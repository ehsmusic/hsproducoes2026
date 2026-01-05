
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { UserRole, HSEvent, HSEventFinance } from '../types';
import { 
  DollarSign, TrendingUp, CreditCard, Clock, 
  Loader2, Wallet, MapPin, CheckCircle2, ShieldAlert,
  Sparkles, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Finance: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financeItems, setFinanceItems] = useState<{event: HSEvent, finance: HSEventFinance}[]>([]);
  const [stats, setStats] = useState({
    totalGeral: 0,
    totalRecebido: 0,
    totalPendente: 0
  });

  const isAdmin = userProfile?.role === UserRole.ADMIN;
  const isContratante = userProfile?.role === UserRole.CONTRATANTE;
  const isIntegrante = userProfile?.role === UserRole.INTEGRANTE;

  useEffect(() => {
    const fetchFinanceData = async () => {
      if (!userProfile || isIntegrante) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const eventsRef = collection(db, 'events');
        const financeRef = collection(db, 'financeiro');
        
        let eventsList: HSEvent[] = [];
        
        if (isAdmin) {
          const eventsSnap = await getDocs(eventsRef);
          eventsList = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as HSEvent));
        } else if (isContratante) {
          const q = query(eventsRef, where('contratanteId', '==', userProfile.uid));
          const eventsSnap = await getDocs(q);
          eventsList = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as HSEvent));
        }

        const financeSnap = await getDocs(financeRef);
        const financeMap = new Map<string, HSEventFinance>();
        financeSnap.docs.forEach(d => {
          financeMap.set(d.id, d.data() as HSEventFinance);
        });

        const joinedData = eventsList.map(event => {
          const fin = financeMap.get(event.id);
          if (!fin && !isAdmin) return null; 
          
          return {
            event,
            finance: fin || {
              id: event.id,
              valorEvento: 0,
              valorPago: 0,
              saldoPendente: 0,
              statusPagamento: 'Em aberto',
              valorEquipe: 0,
              valorEquipamento: 0,
              valorAlimentacao: 0,
              valorTransporte: 0,
              valorOutros: 0,
              createdAt: event.createdAt
            } as HSEventFinance
          };
        }).filter(item => item !== null) as {event: HSEvent, finance: HSEventFinance}[];

        joinedData.sort((a, b) => new Date(b.event.dataEvento).getTime() - new Date(a.event.dataEvento).getTime());
        setFinanceItems(joinedData);

        const totals = joinedData.reduce((acc, curr) => ({
          totalGeral: acc.totalGeral + (curr.finance.valorEvento || 0),
          totalRecebido: acc.totalRecebido + (curr.finance.valorPago || 0),
          totalPendente: acc.totalPendente + (curr.finance.saldoPendente || ((curr.finance.valorEvento || 0) - (curr.finance.valorPago || 0)))
        }), { totalGeral: 0, totalRecebido: 0, totalPendente: 0 });

        setStats(totals);
      } catch (err) {
        console.error("Erro na sincronização financeira:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [userProfile, isAdmin, isContratante, isIntegrante]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-6">
      <div className="relative">
        <Loader2 className="animate-spin text-blue-500" size={64} />
        <DollarSign className="absolute inset-0 m-auto text-blue-500" size={24} />
      </div>
      <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] text-center px-6">Calculando Ativos Financeiros...</p>
    </div>
  );

  if (isIntegrante) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-8 animate-fade-in px-6 text-center">
      <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center text-red-500 shadow-2xl shadow-red-900/20">
        <ShieldAlert size={48} />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Acesso Restrito</h2>
        <p className="text-slate-500 font-bold max-w-xs mx-auto text-sm">Informações de faturamento são visíveis apenas para Administradores e Contratantes.</p>
      </div>
      <Link to="/" className="px-10 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all">Voltar ao Início</Link>
    </div>
  );

  return (
    <div className="space-y-10 md:space-y-12 animate-fade-in pb-24 px-1 md:px-0">
      <div className="flex flex-col gap-4">
        <div className="flex items-center space-x-3 text-blue-500">
          <Sparkles size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Gestão de Ativos HS</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Financeiro</h1>
        <p className="text-slate-500 font-bold mt-1 text-sm md:text-base max-w-xl">
          {isAdmin ? 'Controle total de faturamento, liquidações e saúde financeira da HS Produções.' : 'Consulte seus pagamentos e orçamentos dos seus contratos ativos.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
        {[
          { icon: TrendingUp, label: isAdmin ? 'Faturamento Bruto' : 'Total Contratado', value: stats.totalGeral, color: 'text-white', bg: 'blue' },
          { icon: Wallet, label: isAdmin ? 'Valor Liquidado' : 'Total Pago', value: stats.totalRecebido, color: 'text-emerald-500', bg: 'emerald' },
          { icon: Clock, label: isAdmin ? 'Saldos a Receber' : 'Saldo Devedor', value: stats.totalPendente, color: 'text-amber-500', bg: 'amber' }
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-7 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full bg-${item.bg}-600/5 blur-3xl group-hover:bg-${item.bg}-600/10 transition-all`}></div>
            <div className={`w-14 h-14 rounded-2xl bg-${item.bg}-600/10 border border-${item.bg}-500/20 flex items-center justify-center text-${item.bg}-500 mb-6 group-hover:rotate-6 transition-transform`}>
              <item.icon size={26} />
            </div>
            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
            <p className={`text-2xl sm:text-3xl lg:text-4xl font-black ${item.color} tracking-tighter truncate`}>
              R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-black text-white flex items-center uppercase tracking-tighter px-2">
          <CreditCard size={28} className="mr-4 text-blue-500 flex-shrink-0" /> Fluxo por Evento
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {financeItems.map(({event, finance}) => {
            const progress = finance.valorEvento > 0 ? Math.min(Math.round((finance.valorPago / finance.valorEvento) * 100), 100) : 0;
            const saldoPendente = Math.max(0, finance.saldoPendente || (finance.valorEvento - finance.valorPago));
            const isQuitado = saldoPendente <= 0 && finance.valorEvento > 0;
            
            return (
              <div key={event.id} className="group bg-slate-900 border border-slate-800 rounded-[2.5rem] md:rounded-[3.5rem] p-7 md:p-10 hover:border-blue-500/30 transition-all duration-500 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[420px]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                
                <div>
                  <div className="flex flex-row items-start justify-between gap-4 mb-8 relative z-10">
                     <div className="flex items-center space-x-4 md:space-x-5 min-w-0">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-blue-500 group-hover:border-blue-500/50 transition-colors flex-shrink-0">
                           <span className="text-[8px] md:text-[9px] font-black uppercase opacity-40 leading-none">{new Date(event.dataEvento).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                           <span className="text-lg md:text-xl font-black tracking-tighter mt-1">{new Date(event.dataEvento).getDate()}</span>
                        </div>
                        <div className="min-w-0">
                           <h3 className="text-lg md:text-2xl font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors leading-tight truncate">{event.titulo}</h3>
                           <p className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1 flex items-center truncate">
                              <MapPin size={10} className="mr-1.5 flex-shrink-0" /> {event.local}
                           </p>
                        </div>
                     </div>
                     <div className="flex-shrink-0">
                        <span className={`inline-block whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest border transition-all flex-shrink-0 ${
                          isQuitado 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {isQuitado ? 'Quitado' : 'Em aberto'}
                        </span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                     <div className="space-y-1">
                        <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Valor do Show</p>
                        <p className="text-xl md:text-2xl font-black text-white tracking-tighter truncate">R$ {finance.valorEvento.toLocaleString('pt-BR')}</p>
                     </div>
                     <div className="space-y-1 text-right">
                        <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">A Liquidar</p>
                        <p className={`text-xl md:text-2xl font-black tracking-tighter truncate ${isQuitado ? 'text-slate-800' : 'text-amber-500'}`}>
                          R$ {saldoPendente.toLocaleString('pt-BR')}
                        </p>
                     </div>
                  </div>
                </div>

                <div className="space-y-8 relative z-10 mt-auto">
                   <div className="space-y-3">
                      <div className="flex items-center justify-between text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                         <span className="text-slate-500">Progressão de Liquidez</span>
                         <span className="text-blue-500">{progress}%</span>
                      </div>
                      <div className="w-full h-2 md:h-3 bg-slate-950 rounded-full border border-slate-800 p-0.5 shadow-inner overflow-hidden">
                         <div 
                           className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                           style={{ width: `${progress}%` }}
                         ></div>
                      </div>
                   </div>

                   <div className="pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center space-x-3 self-start sm:self-center">
                         <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                           <CheckCircle2 size={14} />
                         </div>
                         <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                           Pago: <span className="text-white ml-1">R$ {finance.valorPago.toLocaleString('pt-BR')}</span>
                         </p>
                      </div>
                      <Link 
                         to={`/finance/${event.id}`} 
                         className="flex items-center justify-center space-x-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-white transition-colors group/btn w-full sm:w-auto px-4 py-3 bg-slate-950/30 sm:bg-transparent rounded-xl border border-slate-800 sm:border-0"
                      >
                         <span>Ver Pagamentos</span>
                         <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform flex-shrink-0" />
                      </Link>
                   </div>
                </div>
              </div>
            );
          })}

          {financeItems.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 bg-slate-900/20 border-2 border-dashed border-slate-900 rounded-[3rem] px-6 text-center">
               <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-800 border border-slate-800">
                  <DollarSign size={32} />
               </div>
               <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">Nenhum registro financeiro disponível no momento.</p>
            </div>
          )}
        </div>
      </div>

      {isAdmin && financeItems.length > 0 && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-2xl shadow-blue-900/40 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-10">
           <div className="flex flex-col sm:flex-row items-center text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-8">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white border border-white/10 flex-shrink-0">
                 <TrendingUp size={36} />
              </div>
              <div>
                 <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-tight">Saúde Financeira HS</h3>
                 <p className="text-blue-100 font-bold opacity-80 mt-1 text-xs md:text-sm">Análise de desempenho baseada em liquidez e volume de caixa.</p>
              </div>
           </div>
           
           <div className="flex flex-row items-center space-x-6 md:space-x-12 w-full lg:w-auto justify-center lg:justify-end">
              <div className="text-center">
                 <p className="text-[7px] md:text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1">Conversão de Caixa</p>
                 <p className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                    {stats.totalGeral > 0 ? Math.round((stats.totalRecebido / stats.totalGeral) * 100) : 0}%
                 </p>
              </div>
              <div className="w-px h-12 md:h-16 bg-white/20"></div>
              <div className="text-center">
                 <p className="text-[7px] md:text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1">Total de Shows</p>
                 <p className="text-3xl md:text-5xl font-black text-white tracking-tighter">{financeItems.length}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
