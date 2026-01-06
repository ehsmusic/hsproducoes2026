
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { UserRole, HSEvent, HSEventFinance, HSEventContratacao, EventStatus } from '../types';
import { 
  DollarSign, TrendingUp, Loader2, Wallet, MapPin, 
  Sparkles, ChevronRight, Check, X, Clock
} from 'lucide-react';
import { Link } from 'react-router';

const Finance: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financeItems, setFinanceItems] = useState<{event: HSEvent, finance?: HSEventFinance, memberCache?: number, contratacaoId?: string, statusContratacao?: string}[]>([]);
  const [stats, setStats] = useState({
    totalGeral: 0,
    totalRecebido: 0,
    totalPendente: 0
  });

  const isAdmin = userProfile?.role === UserRole.ADMIN;
  const isContratante = userProfile?.role === UserRole.CONTRATANTE;
  const isIntegrante = userProfile?.role === UserRole.INTEGRANTE;

  // Status de eventos considerados "Válidos" para soma de acumulado e a receber
  const validShowStatuses = [
    EventStatus.ACEITO.toLowerCase(),
    EventStatus.CONFIRMADO.toLowerCase(),
    EventStatus.CONCLUIDO.toLowerCase()
  ];

  useEffect(() => {
    if (!userProfile) return;
    
    setLoading(true);
    let unsub: () => void = () => {};

    const fetchData = async () => {
      try {
        const eventsRef = collection(db, 'events');
        const financeRef = collection(db, 'financeiro');
        const contratacaoRef = collection(db, 'contratacao');

        if (isAdmin || isContratante) {
          let eventsList: HSEvent[] = [];
          if (isAdmin) {
            const eventsSnap = await getDocs(eventsRef);
            eventsList = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() as object } as HSEvent));
          } else {
            const q = query(eventsRef, where('contratanteId', '==', userProfile.uid));
            const eventsSnap = await getDocs(q);
            eventsList = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() as object } as HSEvent));
          }

          const financeSnap = await getDocs(financeRef);
          const financeMap = new Map<string, HSEventFinance>();
          financeSnap.docs.forEach(d => financeMap.set(d.id, d.data() as HSEventFinance));

          const joinedData = eventsList.map(event => {
            const fin = financeMap.get(event.id);
            if (!fin && !isAdmin) return null;
            return { event, finance: fin || { id: event.id, valorEvento: 0, valorPago: 0, saldoPendente: 0, statusPagamento: 'Em aberto' } };
          }).filter(Boolean);

          const totals = (joinedData as any[]).reduce((acc, curr) => ({
            totalGeral: acc.totalGeral + (curr.finance.valorEvento || 0),
            totalRecebido: acc.totalRecebido + (curr.finance.valorPago || 0),
            totalPendente: acc.totalPendente + (curr.finance.saldoPendente || 0)
          }), { totalGeral: 0, totalRecebido: 0, totalPendente: 0 });

          joinedData.sort((a: any, b: any) => new Date(b.event.dataEvento).getTime() - new Date(a.event.dataEvento).getTime());
          setFinanceItems(joinedData as any[]);
          setStats(totals);
          setLoading(false);
        } else if (isIntegrante) {
          const qCont = query(contratacaoRef, where('integranteId', '==', userProfile.uid));
          
          unsub = onSnapshot(qCont, async (snapshot) => {
            const contData = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as HSEventContratacao));
            
            const eventsSnap = await getDocs(eventsRef);
            const eventsMap = new Map<string, HSEvent>();
            eventsSnap.docs.forEach(d => eventsMap.set(d.id, { id: d.id, ...d.data() as object } as HSEvent));

            const joinedData = contData.map(c => {
              const ev = eventsMap.get(c.showId);
              if (!ev) return null;
              return { 
                event: ev, 
                memberCache: c.cache, 
                contratacaoId: c.id, 
                statusContratacao: c.statusContratacao || 'Pendente' 
              };
            }).filter(Boolean) as any[];

            // Cálculos baseados nas novas regras:
            const totals = joinedData.reduce((acc, curr) => {
              const cache = curr.memberCache || 0;
              const isPago = curr.statusContratacao === 'Pago';
              const eventStatusValid = validShowStatuses.includes((curr.event.status || "").toLowerCase());

              return {
                // "Já recebido": calcule todos os caches com o status pago
                totalRecebido: acc.totalRecebido + (isPago ? cache : 0),
                
                // "A receber": caches com status pendente E status evento "Confirmado", "Concluído", "Aceito"
                totalPendente: acc.totalPendente + (!isPago && eventStatusValid ? cache : 0),
                
                // "Cachê acumulado": soma todos os caches independente do statusContratacao, mas o evento tem que ser Confirmado/Concluido/Aceito
                totalGeral: acc.totalGeral + (eventStatusValid ? cache : 0)
              };
            }, { totalGeral: 0, totalRecebido: 0, totalPendente: 0 });

            joinedData.sort((a, b) => new Date(b.event.dataEvento).getTime() - new Date(a.event.dataEvento).getTime());
            setFinanceItems(joinedData);
            setStats(totals);
            setLoading(false);
          });
        }
      } catch (err) {
        console.error("Erro financeiro:", err);
        setLoading(false);
      }
    };

    fetchData();
    return () => unsub();
  }, [userProfile, isAdmin, isContratante, isIntegrante]);

  const togglePaymentStatus = async (contId: string, currentStatus: string) => {
    if (!isIntegrante) return;
    try {
      const newStatus = currentStatus === 'Pago' ? 'Pendente' : 'Pago';
      await updateDoc(doc(db, 'contratacao', contId), {
        statusContratacao: newStatus
      });
    } catch (err) {
      console.error("Erro ao atualizar status de pagamento:", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-6">
      <Loader2 className="animate-spin text-blue-500" size={64} />
      <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Sincronizando Fluxo...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-24 px-1 md:px-0">
      <div className="flex flex-col gap-4">
        <div className="flex items-center space-x-3 text-blue-500">
          <Sparkles size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Financeiro Backstage</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Fluxo de Caixa</h1>
        <p className="text-slate-500 font-bold mt-1 text-sm">
          {isIntegrante ? 'Gerencie seus recebimentos. Clique no botão de status para marcar como pago.' : 'Gestão de faturamento e recebíveis HS.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{isIntegrante ? 'Cachê Acumulado' : 'Total Geral'}</p>
          <p className="text-3xl font-black text-white tracking-tighter">R$ {stats.totalGeral.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl border-b-4 border-b-emerald-500/50">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{isIntegrante ? 'Já Recebido' : 'Liquidado'}</p>
          <p className="text-3xl font-black text-emerald-500 tracking-tighter">R$ {stats.totalRecebido.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl border-b-4 border-b-amber-500/50">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{isIntegrante ? 'A Receber' : 'Pendente'}</p>
          <p className="text-3xl font-black text-amber-500 tracking-tighter">R$ {stats.totalPendente.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {financeItems.map(({ event, finance, memberCache, contratacaoId, statusContratacao }) => {
          const isPago = statusContratacao === 'Pago';
          const isQuitadoAdmin = finance?.statusPagamento === 'Quitado';

          return (
            <div key={event.id} className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 hover:border-blue-500/30 transition-all shadow-2xl flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-white tracking-tighter truncate group-hover:text-blue-400 transition-colors">{event.titulo}</h3>
                  <div className="flex items-center text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                    <MapPin size={10} className="mr-1" /> {event.local}
                  </div>
                  <div className="mt-2 inline-flex px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[8px] font-black uppercase text-slate-600">
                    Evento {event.status}
                  </div>
                </div>

                {/* Status Badge para Admin/Contratante */}
                {!isIntegrante && (
                  <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    isQuitadoAdmin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {finance?.statusPagamento || 'Em aberto'}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-end border-t border-slate-800/50 pt-6">
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Valor do Cachê</p>
                  <p className="text-2xl font-black text-white tracking-tighter">
                    R$ {(isIntegrante ? memberCache : finance?.valorEvento)?.toLocaleString('pt-BR')}
                  </p>
                </div>
                
                {isIntegrante ? (
                  /* Botão Toggle para Integrante (Substitui a seta) */
                  <button 
                    onClick={() => togglePaymentStatus(contratacaoId!, statusContratacao!)}
                    className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border shadow-xl ${
                      isPago 
                      ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500' 
                      : 'bg-slate-800 text-amber-500 border-amber-500/30 hover:bg-slate-700'
                    }`}
                  >
                    {isPago ? (
                      <>
                        <Check size={16} strokeWidth={3} />
                        <span>Pago</span>
                      </>
                    ) : (
                      <>
                        <Clock size={16} strokeWidth={3} />
                        <span>Pendente</span>
                      </>
                    )}
                  </button>
                ) : (
                  /* Botão de Detalhes para Admin/Contratante */
                  <Link 
                    to={isAdmin ? `/finance/${event.id}` : `/events/${event.id}`} 
                    className="p-4 bg-slate-800 text-blue-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                  >
                    <ChevronRight size={20} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
        
        {financeItems.length === 0 && (
          <div className="col-span-full py-32 bg-slate-950/40 border-2 border-dashed border-slate-900 rounded-[3rem] text-center">
            <DollarSign className="mx-auto text-slate-800 mb-4" size={48} />
            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Nenhum registro financeiro encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;
