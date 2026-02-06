
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

            const totals = joinedData.reduce((acc, curr) => {
              const cache = curr.memberCache || 0;
              const isPago = curr.statusContratacao === 'Pago';
              const eventStatusValid = validShowStatuses.includes((curr.event.status || "").toLowerCase());

              return {
                totalRecebido: acc.totalRecebido + (isPago ? cache : 0),
                totalPendente: acc.totalPendente + (!isPago && eventStatusValid ? cache : 0),
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
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Gestão Financeira</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Fluxo de Caixa</h1>
        <p className="text-slate-500 font-bold mt-1 text-sm">
          {isIntegrante ? 'Controle seus cachês. Clique para marcar como pago após receber.' : 'Acompanhamento de faturamento e recebíveis da banda.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{isIntegrante ? 'Cachê Acumulado' : 'Volume de Negócios'}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">R$ {stats.totalGeral.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm border-b-4 border-b-emerald-500">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{isIntegrante ? 'Já Recebido' : 'Liquidado'}</p>
          <p className="text-3xl font-black text-emerald-600 tracking-tighter">R$ {stats.totalRecebido.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm border-b-4 border-b-amber-500">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{isIntegrante ? 'A Receber' : 'Aguardando'}</p>
          <p className="text-3xl font-black text-amber-600 tracking-tighter">R$ {stats.totalPendente.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {financeItems.map(({ event, finance, memberCache, contratacaoId, statusContratacao }) => {
          const isPago = statusContratacao === 'Pago';
          const isQuitadoAdmin = finance?.statusPagamento === 'Quitado';

          return (
            <div key={event.id} className="bg-white border border-slate-100 rounded-[3rem] p-8 hover:border-blue-500/20 transition-all shadow-sm hover:shadow-xl flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-8">
                <div className="min-w-0">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter truncate group-hover:text-blue-600 transition-colors uppercase italic">{event.titulo}</h3>
                  <div className="flex items-center text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                    <MapPin size={12} className="mr-2 text-blue-500" /> {event.local}
                  </div>
                  <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[8px] font-black uppercase text-slate-500 tracking-widest">
                    Status: {event.status}
                  </div>
                </div>

                {!isIntegrante && (
                  <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    isQuitadoAdmin ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {finance?.statusPagamento || 'Em aberto'}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-end pt-8 border-t border-slate-50">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor do Cachê</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">
                    <span className="text-lg text-slate-200 mr-1">R$</span>
                    {(isIntegrante ? memberCache : finance?.valorEvento)?.toLocaleString('pt-BR')}
                  </p>
                </div>
                
                {isIntegrante ? (
                  <button 
                    onClick={() => togglePaymentStatus(contratacaoId!, statusContratacao!)}
                    className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border ${
                      isPago 
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' 
                      : 'bg-white text-amber-600 border-amber-100 hover:bg-amber-50 shadow-sm'
                    }`}
                  >
                    {isPago ? (
                      <>
                        <Check size={16} strokeWidth={3} />
                        <span>Recebido</span>
                      </>
                    ) : (
                      <>
                        <Clock size={16} strokeWidth={3} />
                        <span>Pendente</span>
                      </>
                    )}
                  </button>
                ) : (
                  <Link 
                    to={isAdmin ? `/finance/${event.id}` : `/events/${event.id}`} 
                    className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-blue-600 hover:bg-white border border-slate-100 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    <ChevronRight size={20} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
        
        {financeItems.length === 0 && (
          <div className="col-span-full py-32 bg-white border-2 border-dashed border-slate-100 rounded-[3rem] text-center">
            <DollarSign className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Nenhum registro localizado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;
