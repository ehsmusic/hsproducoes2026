
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, onSnapshot, updateDoc, collection, 
  addDoc, deleteDoc, getDocs, serverTimestamp, query, orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { HSEvent, HSEventFinance, UserRole } from '../types';
import { 
  ChevronLeft, DollarSign, Calendar, MapPin, 
  CheckCircle2, Clock, Loader2, TrendingUp, 
  Receipt, ShieldCheck, Save, AlertCircle, 
  Users, Truck, Trash2, Edit2, Plus, X, CreditCard,
  Wallet, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

interface Movimentacao {
  id: string;
  createdAt: any;
  dataMovimentacao: string;
  valorMovimentacao: number;
  formaPgmt: string;
}

const FinanceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [event, setEvent] = useState<HSEvent | null>(null);
  const [finance, setFinance] = useState<HSEventFinance | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMov, setEditingMov] = useState<Movimentacao | null>(null);

  const [formData, setFormData] = useState({
    dataMovimentacao: new Date().toISOString().split('T')[0],
    valorMovimentacao: 0,
    formaPgmt: 'Pix'
  });

  const isAdmin = userProfile?.role === UserRole.ADMIN;
  const isContratante = userProfile?.role === UserRole.CONTRATANTE;

  useEffect(() => {
    if (!id) return;

    // Listener do Evento
    const unsubEvent = onSnapshot(doc(db, 'events', id), (doc) => {
      if (doc.exists()) setEvent({ id: doc.id, ...doc.data() } as HSEvent);
    });

    // Listener do Resumo Financeiro
    const unsubFinance = onSnapshot(doc(db, 'financeiro', id), (doc) => {
      if (doc.exists()) setFinance(doc.data() as HSEventFinance);
      setLoading(false);
    });

    // Listener da Subcoleção de Movimentações
    const qMov = query(collection(db, 'financeiro', id, 'movimentacoes'), orderBy('dataMovimentacao', 'desc'));
    const unsubMov = onSnapshot(qMov, (snap) => {
      setMovimentacoes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Movimentacao)));
    });

    return () => { unsubEvent(); unsubFinance(); unsubMov(); };
  }, [id]);

  // Função para recalcular os totais no documento pai baseado na subcoleção
  const recalculateFinance = async () => {
    if (!id || !finance) return;
    const snap = await getDocs(collection(db, 'financeiro', id, 'movimentacoes'));
    const totalPago = snap.docs.reduce((acc, curr) => acc + (Number(curr.data().valorMovimentacao) || 0), 0);
    const valorContrato = finance.valorEvento || 0;
    const novoSaldo = Math.max(0, valorContrato - totalPago);
    
    await updateDoc(doc(db, 'financeiro', id), {
      valorPago: totalPago,
      saldoPendente: novoSaldo,
      statusPagamento: novoSaldo <= 0 ? 'Quitado' : 'Em aberto'
    });
  };

  const handleSaveMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      if (editingMov) {
        await updateDoc(doc(db, 'financeiro', id, 'movimentacoes', editingMov.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'financeiro', id, 'movimentacoes'), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      // Força o recálculo após a alteração
      await recalculateFinance();
      
      setIsModalOpen(false);
      setEditingMov(null);
      setFormData({ dataMovimentacao: new Date().toISOString().split('T')[0], valorMovimentacao: 0, formaPgmt: 'Pix' });
    } catch (err) {
      console.error(err);
      alert("Erro ao processar lançamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMov = async (movId: string) => {
    if (!id || !window.confirm("Confirmar exclusão desta movimentação? O saldo será recalculado.")) return;
    try {
      await deleteDoc(doc(db, 'financeiro', id, 'movimentacoes', movId));
      await recalculateFinance();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Sincronizando Extrato...</p>
    </div>
  );

  if (!event || !finance) return (
    <div className="text-center py-40 space-y-6">
      <AlertCircle className="mx-auto text-slate-800" size={64} />
      <p className="text-slate-500 font-bold">Dados financeiros não encontrados.</p>
      <button onClick={() => navigate(-1)} className="text-blue-500 font-black uppercase text-xs tracking-widest">Voltar</button>
    </div>
  );

  const progress = Math.min(Math.round((finance.valorPago / (finance.valorEvento || 1)) * 100), 100);

  return (
    <div className="space-y-10 animate-fade-in pb-24 px-1 md:px-0">
      {/* Header com Botão Voltar */}
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl active:scale-95">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">Relatório Financeiro</span>
            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">ID: {id?.slice(-6)}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter truncate">{event.titulo}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Card Resumo Principal */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full group-hover:bg-blue-600/10 transition-all duration-1000"></div>
            
            <div className="relative z-10 flex flex-row justify-between items-center gap-4 mb-12">
              <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 truncate">Valor Total do Show</p>
                <p className="text-4xl md:text-6xl font-black text-white tracking-tighter truncate">
                  <span className="text-lg md:text-2xl text-blue-500/50 align-top mr-1">R$</span>
                  {finance.valorEvento.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className={`inline-flex whitespace-nowrap px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border transition-all ${
                  finance.statusPagamento === 'Quitado' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {finance.statusPagamento}
                </span>
              </div>
            </div>

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Progressão de Liquidação</span>
                <span className="text-blue-500">{progress}%</span>
              </div>
              <div className="w-full h-4 md:h-5 bg-slate-950 rounded-full border border-slate-800 p-1 shadow-inner overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-slate-500 overflow-hidden">
                  <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-[8px] md:text-[9px] font-black uppercase truncate">R$ {finance.valorPago.toLocaleString('pt-BR')} Realizado</span>
                </div>
                <div className="flex items-center justify-end space-x-2 text-slate-500 overflow-hidden">
                  <Clock size={14} className="text-amber-500 flex-shrink-0" />
                  <span className="text-[8px] md:text-[9px] font-black uppercase truncate">R$ {finance.saldoPendente.toLocaleString('pt-BR')} Pendente</span>
                </div>
              </div>
            </div>
          </div>

          {/* TABELA DE MOVIMENTAÇÕES (Histórico de Entradas) */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-950/20">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Movimentações</h3>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Entradas financeiras do contratante</p>
                </div>
              </div>
              {(isAdmin || isContratante) && finance.statusPagamento !== 'Quitado' && (
                <button 
                  onClick={() => { setEditingMov(null); setIsModalOpen(true); }}
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl active:scale-95"
                >
                  <Plus size={16} />
                  <span>Adicionar Lançamento</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-800/50">
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5 text-right">Valor</th>
                    <th className="px-8 py-5">Tipo de Pagamento</th>
                    <th className="px-8 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {movimentacoes.length > 0 ? movimentacoes.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-8 py-5">
                        <span className="text-xs font-bold text-slate-300">{new Date(mov.dataMovimentacao + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-sm font-black text-emerald-400">+ R$ {mov.valorMovimentacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-2">
                           <CreditCard size={14} className="text-blue-500/50" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{mov.formaPgmt}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center space-x-3">
                          {(isAdmin || isContratante) && (
                            <>
                              <button 
                                onClick={() => { 
                                  setEditingMov(mov); 
                                  setFormData({ 
                                    dataMovimentacao: mov.dataMovimentacao, 
                                    valorMovimentacao: mov.valorMovimentacao, 
                                    formaPgmt: mov.formaPgmt 
                                  }); 
                                  setIsModalOpen(true); 
                                }}
                                className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteMov(mov.id)}
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                          {!isAdmin && !isContratante && <CheckCircle2 size={16} className="text-emerald-500/50" />}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                         <div className="flex flex-col items-center space-y-3 opacity-30">
                            <Receipt size={48} />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nenhuma movimentação registrada.</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custos Internos (Admin Only) */}
          {isAdmin && (
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 space-y-10 shadow-2xl">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
                <TrendingUp size={18} className="mr-3 text-blue-500" /> Detalhamento de Saídas (Custos)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Cachês de Equipe', value: finance.valorEquipe, icon: Users, color: 'text-blue-500' },
                  { label: 'Alocação de Equipamento', value: finance.valorEquipamento, icon: Wallet, color: 'text-indigo-500' },
                  { label: 'Logística & Transporte', value: finance.valorTransporte, icon: Truck, color: 'text-purple-500' },
                  { label: 'Custos Adicionais', value: finance.valorOutros, icon: ArrowUpRight, color: 'text-slate-400' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center ${item.color}`}>
                        <item.icon size={18} />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <span className="text-xs md:text-sm font-black text-white">R$ {item.value.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-800 pb-4">Info do Contrato</h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Calendar size={18} className="text-blue-500 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Data do Show</p>
                  <p className="text-sm font-bold text-white">{event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR') : '--'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MapPin size={18} className="text-blue-500 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Localização</p>
                  <p className="text-sm font-bold text-white truncate">{event.local}</p>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-800">
                <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{event.status}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-8 space-y-4 shadow-2xl">
             <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-2">
                <ShieldCheck size={24} />
             </div>
             <h4 className="text-sm font-black text-white uppercase tracking-tighter">Auditoria Backstage</h4>
             <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
               Cada pagamento gera um registro inalterável para conferência da HS Produções. Para suporte financeiro, use o canal oficial.
             </p>
          </div>
        </div>
      </div>

      {/* MODAL PARA LANÇAMENTO (Adicionar / Editar) */}
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
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Data da Transação</label>
                <input 
                  type="date" 
                  required
                  value={formData.dataMovimentacao}
                  onChange={e => setFormData({...formData, dataMovimentacao: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none" 
                />
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

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Forma de Pagamento</label>
                <select 
                  value={formData.formaPgmt}
                  onChange={e => setFormData({...formData, formaPgmt: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-black uppercase text-xs tracking-widest outline-none appearance-none"
                >
                  <option value="Pix">Pix</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-800 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || formData.valorMovimentacao <= 0}
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  <span>{editingMov ? 'Confirmar Edição' : 'Efetivar Lançamento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceDetail;
