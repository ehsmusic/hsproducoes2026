
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
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

    const unsubEvent = onSnapshot(doc(db, 'events', id), (snapshot) => {
      if (snapshot.exists()) setEvent({ id: snapshot.id, ...snapshot.data() as object } as HSEvent);
    });

    const unsubFinance = onSnapshot(doc(db, 'financeiro', id), (snapshot) => {
      if (snapshot.exists()) setFinance(snapshot.data() as HSEventFinance);
      setLoading(false);
    });

    const qMov = query(collection(db, 'financeiro', id, 'movimentacoes'), orderBy('dataMovimentacao', 'desc'));
    const unsubMov = onSnapshot(qMov, (snap: any) => {
      setMovimentacoes(snap.docs.map((d: any) => ({ id: d.id, ...d.data() as object } as Movimentacao)));
    });

    return () => { unsubEvent(); unsubFinance(); unsubMov(); };
  }, [id]);

  const recalculateFinance = async () => {
    if (!id || !finance) return;
    const snap = await getDocs(collection(db, 'financeiro', id, 'movimentacoes'));
    const totalPago = snap.docs.reduce((acc, curr) => acc + (Number((curr.data() as any).valorMovimentacao) || 0), 0);
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
      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando Extrato...</p>
    </div>
  );

  if (!event || !finance) return null;

  const progress = Math.min(Math.round((finance.valorPago / (finance.valorEvento || 1)) * 100), 100);

  return (
    <div className="space-y-10 animate-fade-in pb-24 px-1 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-95">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-widest">Extrato de Show</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">UID: {id?.slice(-6)}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter truncate uppercase italic">{event.titulo}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Card Resumo Financeiro (White Theme) */}
          <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-50 rounded-full blur-[100px] opacity-50"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor Total Contratado</p>
                <p className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
                  <span className="text-lg md:text-2xl text-slate-300 align-top mr-1">R$</span>
                  {finance.valorEvento.toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <span className={`inline-flex px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  finance.statusPagamento === 'Quitado' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {finance.statusPagamento}
                </span>
              </div>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Progresso da Liquidação</span>
                <span className="text-blue-600">{progress}%</span>
              </div>
              <div className="w-full h-4 bg-slate-50 rounded-full border border-slate-100 p-1 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Realizado</p>
                  <p className="text-sm font-black text-emerald-600">R$ {finance.valorPago.toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo em Aberto</p>
                  <p className="text-sm font-black text-amber-600">R$ {finance.saldoPendente.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Movimentações (White Table) */}
          <div className="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Lançamentos</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Histórico de entradas recebidas</p>
                </div>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => { setEditingMov(null); setIsModalOpen(true); }}
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/10 active:scale-95"
                >
                  <Plus size={16} />
                  <span>Novo Recebimento</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-5">Data do Lançamento</th>
                    <th className="px-8 py-5 text-right">Valor Recebido</th>
                    <th className="px-8 py-5">Método</th>
                    <th className="px-8 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {movimentacoes.length > 0 ? movimentacoes.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5 text-xs font-bold text-slate-600">
                        {new Date(mov.dataMovimentacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-sm font-black text-emerald-600">+ R$ {mov.valorMovimentacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <CreditCard size={14} className="text-blue-500/50" />
                           <span>{mov.formaPgmt}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center space-x-3">
                          {isAdmin && (
                            <>
                              <button 
                                onClick={() => { 
                                  setEditingMov(mov); 
                                  setFormData({ dataMovimentacao: mov.dataMovimentacao, valorMovimentacao: mov.valorMovimentacao, formaPgmt: mov.formaPgmt }); 
                                  setIsModalOpen(true); 
                                }}
                                className="p-2 text-slate-300 hover:text-blue-600 hover:bg-white border border-transparent hover:border-blue-100 rounded-lg transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteMov(mov.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-white border border-transparent hover:border-red-100 rounded-lg transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-24 text-center">
                         <div className="flex flex-col items-center space-y-3 opacity-20">
                            <Receipt size={48} className="text-slate-400" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum lançamento registrado para este show.</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar (White Theme) */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-8 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4 italic">Dados do Evento</h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Calendar size={18} className="text-blue-500 mt-1" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Agenda</p>
                  <p className="text-sm font-bold text-slate-900">{event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR') : '--'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MapPin size={18} className="text-blue-500 mt-1" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Localização</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{event.local}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] space-y-6 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                <ShieldCheck size={80} className="text-white" />
             </div>
             <h4 className="text-xl font-black text-white uppercase italic tracking-tight relative z-10">Auditoria Financeira</h4>
             <p className="text-[11px] text-slate-400 font-medium leading-relaxed relative z-10">
               Os lançamentos registrados aqui refletem diretamente nos balanços de ganhos da equipe e custos de infraestrutura da HS Produções.
             </p>
          </div>
        </div>
      </div>

      {/* MODAL PARA LANÇAMENTO (Premium White) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white border border-slate-100 rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-scale-in my-auto">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
                {editingMov ? 'Editar Lançamento' : 'Efetivar Recebimento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-slate-900 rounded-xl transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveMovimentacao} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data da Transação</label>
                <input 
                  type="date" 
                  required
                  value={formData.dataMovimentacao}
                  onChange={e => setFormData({...formData, dataMovimentacao: e.target.value})}
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor Realizado (R$)</label>
                <div className="relative group">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 font-black text-2xl group-focus-within:text-blue-600 transition-colors">R$</span>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={formData.valorMovimentacao || ''}
                    onChange={e => setFormData({...formData, valorMovimentacao: Number(e.target.value)})}
                    placeholder="0,00"
                    className="w-full pl-20 pr-8 py-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-black text-3xl focus:border-blue-500 transition-all outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Método de Pagamento</label>
                <select 
                  value={formData.formaPgmt}
                  onChange={e => setFormData({...formData, formaPgmt: e.target.value})}
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-black uppercase text-xs tracking-widest outline-none appearance-none focus:border-blue-500"
                >
                  <option value="Pix">Pix</option>
                  <option value="Transferência">Transferência Bancária</option>
                  <option value="Dinheiro">Dinheiro (Espécie)</option>
                  <option value="Cartão">Cartão (Débito/Crédito)</option>
                </select>
              </div>

              <div className="pt-6 flex flex-col md:flex-row gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-all">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || formData.valorMovimentacao <= 0}
                  className="flex-[2] py-6 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center space-x-3 disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  <span>{editingMov ? 'Confirmar Edição' : 'Registrar Lançamento'}</span>
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
