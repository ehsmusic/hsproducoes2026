
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  doc, getDoc, collection, query, where, getDocs, 
  onSnapshot, updateDoc, addDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, HSEvent, HSEventFinance, EventStatus } from '../types';
import { 
  ChevronLeft, Loader2, UserCircle, Mail, Phone, MapPin, 
  DollarSign, Calendar, TrendingUp, Music, ArrowRight,
  ShieldCheck, Wallet, CreditCard, Receipt, Plus, X, Save, Trash2, Edit2, AlertCircle
} from 'lucide-react';
import { DEFAULT_AVATAR } from '../App';

interface Movimentacao {
  id: string;
  eventId: string; // Referência ao show
  eventTitle: string; // Cache para exibição
  createdAt: any;
  dataMovimentacao: string;
  valorMovimentacao: number;
  formaPgmt: string;
}

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<HSEvent[]>([]);
  const [finances, setFinances] = useState<Map<string, HSEventFinance>>(new Map());
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  
  // Estados do Modal de Movimentação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMov, setEditingMov] = useState<Movimentacao | null>(null);
  const [formData, setFormData] = useState({
    eventId: '',
    dataMovimentacao: new Date().toISOString().split('T')[0],
    valorMovimentacao: 0,
    formaPgmt: 'Pix'
  });

  // Estados do Modal de Confirmação de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [movToDelete, setMovToDelete] = useState<Movimentacao | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Perfil do Cliente
        const clientSnap = await getDoc(doc(db, 'users', id));
        if (clientSnap.exists()) {
          setClient(clientSnap.data() as UserProfile);
        } else {
          navigate('/clients');
          return;
        }

        // 2. Listener para eventos do cliente
        const qEvents = query(collection(db, 'events'), where('contratanteId', '==', id));
        const unsubEvents = onSnapshot(qEvents, (snapshot) => {
          const eventsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() as object } as HSEvent));
          eventsData.sort((a, b) => new Date(b.dataEvento).getTime() - new Date(a.dataEvento).getTime());
          setEvents(eventsData);

          // Buscar movimentações de cada evento
          eventsData.forEach(evt => {
            const qMov = query(collection(db, 'financeiro', evt.id, 'movimentacoes'));
            onSnapshot(qMov, (movSnap) => {
              const currentMovs = movSnap.docs.map(m => ({ 
                id: m.id, 
                eventId: evt.id,
                eventTitle: evt.titulo,
                ...m.data() as any 
              } as Movimentacao));
              
              setMovimentacoes(prev => {
                const filtered = prev.filter(p => p.eventId !== evt.id);
                const combined = [...filtered, ...currentMovs];
                return combined.sort((a, b) => new Date(b.dataMovimentacao).getTime() - new Date(a.dataMovimentacao).getTime());
              });
            });
          });
        });

        // 3. Financeiro (para cálculo de totais)
        const financeSnap = await getDocs(collection(db, 'financeiro'));
        const financeMap = new Map<string, HSEventFinance>();
        financeSnap.docs.forEach(d => financeMap.set(d.id, d.data() as HSEventFinance));
        setFinances(financeMap);

        setLoading(false);
        return () => unsubEvents();
      } catch (err) {
        console.error("Erro ao carregar detalhes do cliente:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const stats = useMemo(() => {
    const totalShows = events.length;
    let totalInvestido = 0;
    let saldoPendente = 0;

    events.forEach(evt => {
      const fin = finances.get(evt.id);
      if (fin) {
        totalInvestido += fin.valorEvento || 0;
        saldoPendente += fin.saldoPendente || 0;
      }
    });

    return { totalShows, totalInvestido, saldoPendente };
  }, [events, finances]);

  const recalculateFinance = async (eventId: string) => {
    const snap = await getDocs(collection(db, 'financeiro', eventId, 'movimentacoes'));
    const totalPago = snap.docs.reduce((acc, curr) => acc + (Number((curr.data() as any).valorMovimentacao) || 0), 0);
    
    const financeRef = doc(db, 'financeiro', eventId);
    const financeSnap = await getDoc(financeRef);
    if (!financeSnap.exists()) return;

    const financeData = financeSnap.data() as HSEventFinance;
    const valorContrato = financeData.valorEvento || 0;
    const novoSaldo = Math.max(0, valorContrato - totalPago);
    
    await updateDoc(financeRef, {
      valorPago: totalPago,
      saldoPendente: novoSaldo,
      statusPagamento: novoSaldo <= 0 ? 'Quitado' : 'Em aberto'
    });

    setFinances(prev => {
      const newMap = new Map(prev);
      newMap.set(eventId, { ...financeData, valorPago: totalPago, saldoPendente: novoSaldo, statusPagamento: novoSaldo <= 0 ? 'Quitado' : 'Em aberto' });
      return newMap;
    });
  };

  const handleSaveMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventId) return;
    setIsSubmitting(true);
    try {
      if (editingMov) {
        await updateDoc(doc(db, 'financeiro', editingMov.eventId, 'movimentacoes', editingMov.id), {
          dataMovimentacao: formData.dataMovimentacao,
          valorMovimentacao: formData.valorMovimentacao,
          formaPgmt: formData.formaPgmt,
          updatedAt: serverTimestamp()
        });
        await recalculateFinance(editingMov.eventId);
      } else {
        await addDoc(collection(db, 'financeiro', formData.eventId, 'movimentacoes'), {
          dataMovimentacao: formData.dataMovimentacao,
          valorMovimentacao: formData.valorMovimentacao,
          formaPgmt: formData.formaPgmt,
          createdAt: serverTimestamp()
        });
        await recalculateFinance(formData.eventId);
      }
      
      setIsModalOpen(false);
      setEditingMov(null);
      setFormData({ eventId: '', dataMovimentacao: new Date().toISOString().split('T')[0], valorMovimentacao: 0, formaPgmt: 'Pix' });
    } catch (err) {
      console.error(err);
      alert("Erro ao processar lançamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (mov: Movimentacao) => {
    setMovToDelete(mov);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!movToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'financeiro', movToDelete.eventId, 'movimentacoes', movToDelete.id));
      await recalculateFinance(movToDelete.eventId);
      setIsDeleteModalOpen(false);
      setMovToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir movimentação.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando Dossiê...</p>
    </div>
  );

  if (!client) return null;

  return (
    <div className="space-y-10 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <button 
          onClick={() => navigate(-1)} 
          className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl active:scale-95"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">Histórico do Contratante</span>
            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">UID: {id?.slice(-6)}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter truncate">{client.displayName}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Card Principal - Perfil */}
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-slate-950 p-1.5 border-4 border-slate-800 shadow-2xl overflow-hidden flex-shrink-0">
                <img src={client.photoURL || DEFAULT_AVATAR} className="w-full h-full object-cover rounded-[2rem]" alt={client.displayName} />
              </div>
              
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">E-mail Corporativo</p>
                    <div className="flex items-center text-white font-bold text-sm">
                      <Mail size={14} className="mr-2 text-blue-500" /> {client.email}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">WhatsApp</p>
                    <div className="flex items-center text-white font-bold text-sm">
                      <Phone size={14} className="mr-2 text-blue-500" /> {client.phoneNumber || "Não cadastrado"}
                    </div>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Endereço de Faturamento</p>
                    <div className="flex items-center text-white font-bold text-sm">
                      <MapPin size={14} className="mr-2 text-blue-500" /> {client.endereco || "Endereço não informado"}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800/50 flex flex-wrap gap-3">
                   <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center space-x-2">
                      <CreditCard size={14} className="text-blue-500" />
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">CPF: {client.pixKey || '--'}</span>
                   </div>
                   <div className="px-4 py-2 bg-blue-600 rounded-xl flex items-center space-x-2 shadow-lg">
                      <ShieldCheck size={14} className="text-white" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Contratante Verificado</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Widget de Gestão de Crédito & Movimentações */}
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-950/20">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Gestão de Crédito</h3>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Extrato consolidado de pagamentos</p>
                </div>
              </div>
              <button 
                onClick={() => { setEditingMov(null); setIsModalOpen(true); }}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl active:scale-95"
              >
                <Plus size={16} />
                <span>Adicionar Lançamento</span>
              </button>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-800/50">
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5">Show</th>
                    <th className="px-8 py-5 text-right">Valor</th>
                    <th className="px-8 py-5 text-center">Forma</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {movimentacoes.length > 0 ? movimentacoes.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-8 py-5">
                        <span className="text-xs font-bold text-slate-300">{new Date(mov.dataMovimentacao + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </td>
                      <td className="px-8 py-5 max-w-[200px]">
                        <p className="text-xs font-black text-white truncate">{mov.eventTitle}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-sm font-black text-emerald-400">+ R$ {mov.valorMovimentacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{mov.formaPgmt}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end space-x-3">
                          <button 
                            onClick={() => { 
                              setEditingMov(mov); 
                              setFormData({ 
                                eventId: mov.eventId,
                                dataMovimentacao: mov.dataMovimentacao, 
                                valorMovimentacao: mov.valorMovimentacao, 
                                formaPgmt: mov.formaPgmt 
                              }); 
                              setIsModalOpen(true); 
                            }}
                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(mov)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                         <div className="flex flex-col items-center space-y-3 opacity-30">
                            <Receipt size={48} />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nenhuma movimentação para este cliente.</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lista de Shows */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
               <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Agenda Contratada</h3>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{events.length} Shows Registrados</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {events.length > 0 ? events.map(event => {
                const fin = finances.get(event.id);
                const isQuitado = fin?.statusPagamento === 'Quitado';

                return (
                  <Link 
                    key={event.id} 
                    to={`/events/${event.id}`} 
                    className="group bg-slate-900 border border-slate-800/40 hover:border-blue-500/30 p-6 rounded-[2rem] transition-all hover:bg-slate-900/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-950 rounded-2xl border border-slate-800 group-hover:border-blue-500/50 transition-colors">
                        <span className="text-[8px] font-black text-slate-500 uppercase leading-none">{new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                        <span className="text-xl font-black text-white mt-1 leading-none">{new Date(event.dataEvento + 'T00:00:00').getDate()}</span>
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-white group-hover:text-blue-400 transition-colors tracking-tight">{event.titulo}</h3>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[11px] text-slate-500 mt-1.5 font-bold">
                          <span className="flex items-center"><MapPin size={12} className="mr-2 text-blue-500/50" /> {event.local}</span>
                          <span className="flex items-center"><Music size={12} className="mr-2 text-blue-500/50" /> {event.tipo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Contrato</p>
                        <p className="text-sm font-black text-white">R$ {fin?.valorEvento.toLocaleString('pt-BR') || '0,00'}</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        isQuitado 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {event.status}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-blue-600 flex items-center justify-center text-slate-500 group-hover:text-white transition-all">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </Link>
                );
              }) : (
                <div className="bg-slate-950/40 border-2 border-dashed border-slate-900 rounded-[3rem] py-24 text-center">
                   <Music className="mx-auto text-slate-800 mb-4" size={48} />
                   <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Nenhum show histórico</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-10 shadow-2xl">
             <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-800 pb-4">Indicadores Financeiros</h3>
             
             <div className="space-y-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Music size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Shows Realizados</p>
                    <p className="text-2xl font-black text-white">{stats.totalShows}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total em Contratos</p>
                    <p className="text-2xl font-black text-white">R$ {stats.totalInvestido.toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Saldo em Aberto</p>
                    <p className="text-2xl font-black text-amber-500">R$ {stats.saldoPendente.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
             </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[3rem] p-10 space-y-6 shadow-2xl">
             <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                <DollarSign size={24} />
             </div>
             <h4 className="text-lg font-black text-white uppercase tracking-tighter leading-tight">Gestão Backstage</h4>
             <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
               Cada pagamento adicionado aqui reduz automaticamente o saldo pendente do show correspondente. Os dados são sincronizados em tempo real com a equipe de produção.
             </p>
          </div>
        </div>
      </div>

      {/* MODAL PARA LANÇAMENTO FINANCEIRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-fade-in my-auto">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                {editingMov ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveMovimentacao} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Destino do Pagamento (Show)</label>
                <select 
                  required
                  disabled={!!editingMov}
                  value={formData.eventId}
                  onChange={e => setFormData({...formData, eventId: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none appearance-none disabled:opacity-50"
                >
                  <option value="">Selecione o Show...</option>
                  {events.map(evt => (
                    <option key={evt.id} value={evt.id}>{evt.titulo} ({new Date(evt.dataEvento + 'T00:00:00').toLocaleDateString()})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Data</label>
                  <input 
                    type="date" 
                    required
                    value={formData.dataMovimentacao}
                    onChange={e => setFormData({...formData, dataMovimentacao: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Forma</label>
                  <select 
                    value={formData.formaPgmt}
                    onChange={e => setFormData({...formData, formaPgmt: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Cartão">Cartão</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Valor Recebido (R$)</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xl">R$</span>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={formData.valorMovimentacao || ''}
                    onChange={e => setFormData({...formData, valorMovimentacao: Number(e.target.value)})}
                    placeholder="0,00"
                    className="w-full pl-16 pr-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl text-white font-black text-2xl focus:border-blue-500 transition-all outline-none" 
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || formData.valorMovimentacao <= 0 || !formData.eventId}
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  <span>{editingMov ? 'Confirmar Edição' : 'Efetivar Lançamento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-sm shadow-2xl overflow-hidden p-10 text-center animate-fade-in my-auto">
            <div className="mb-6 flex justify-center">
              <div className="w-32 h-32 rounded-full p-1 bg-slate-800 border-2 border-slate-700 overflow-hidden shadow-2xl">
                <img src="https://i.ibb.co/pjTnM2NQ/avatar-Sucesso.png" className="w-full h-full object-cover rounded-full" alt="Alerta" />
              </div>
            </div>
            
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Confirmar Exclusão?</h3>
            <p className="text-xs text-slate-500 font-bold leading-relaxed mb-8 uppercase tracking-widest">
              Esta ação removerá o lançamento do histórico e o saldo do show será recalculado automaticamente.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl flex items-center justify-center space-x-2 active:scale-95"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                <span>Confirmar Exclusão</span>
              </button>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-4 bg-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all active:scale-95"
              >
                Manter Lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail;
