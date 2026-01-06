
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { UserRole, HSEvent, HSEventFinance, HSEventContratacao } from '../types';
import { 
  DollarSign, TrendingUp, CreditCard, Clock, 
  Loader2, Wallet, MapPin, CheckCircle2, ShieldAlert,
  Sparkles, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Finance: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financeItems, setFinanceItems] = useState<{event: HSEvent, finance?: HSEventFinance, memberCache?: number}[]>([]);
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
      if (!userProfile) return;
      
      setLoading(true);
      try {
        const eventsRef = collection(db, 'events');
        const financeRef = collection(db, 'financeiro');
        const contratacaoRef = collection(db, 'contratacao');
        
        let joinedData: any[] = [];
        let totals = { totalGeral: 0, totalRecebido: 0, totalPendente: 0 };

        if (isAdmin || isContratante) {
          let eventsList: HSEvent[] = [];
          if (isAdmin) {
            const eventsSnap = await getDocs(eventsRef);
            // Fix: Cast doc.data() as object to avoid spread type error
            eventsList = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() as object } as HSEvent));
          } else {
            const q = query(eventsRef, where('contratanteId', '==', userProfile.uid));
            const eventsSnap = await getDocs(q);
            // Fix: Cast doc.data() as object to avoid spread type error
            eventsList = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() as object } as HSEvent));
          }

          const financeSnap = await getDocs(financeRef);
          const financeMap = new Map<string, HSEventFinance>();
          financeSnap.docs.forEach(d => financeMap.set(d.id, d.data() as HSEventFinance));

          joinedData = eventsList.map(event => {
            const fin = financeMap.get(event.id);
            if (!fin && !isAdmin) return null;
            return { event, finance: fin || { id: event.id, valorEvento: 0, valorPago: 0, saldoPendente: 0, statusPagamento: 'Em aberto' } };
          }).filter(Boolean);

          totals = joinedData.reduce((acc, curr) => ({
            totalGeral: acc.totalGeral + (curr.finance.valorEvento || 0),
            totalRecebido: acc.totalRecebido + (curr.finance.valorPago || 0),
            totalPendente: acc.totalPendente + (curr.finance.saldoPendente || 0)
          }), { totalGeral: 0, totalRecebido: 0, totalPendente: 0 });
        } 
        else if (isIntegrante) {
          // Lógica para Integrante: ver seus cachês
          const q = query(contratacaoRef, where('integranteId', '==', userProfile.uid));
          const contSnap = await getDocs(q);
          const contData = contSnap.docs.map(d => d.data() as HSEventContratacao);
          
          const eventSnap = await getDocs(eventsRef);
          const eventsMap = new Map<string, HSEvent>();
          // Fix: Cast doc.data() as object to avoid spread type error
          eventSnap.docs.forEach(d => eventsMap.set(d.id, { id: d.id, ...d.data() as object } as HSEvent));

          const finSnap = await getDocs(financeRef);
          const financeMap = new Map<string, HSEventFinance>();
          finSnap.docs.forEach(d => financeMap.set(d.id, d.data() as HSEventFinance));

          joinedData = contData.map(c => {
            const ev = eventsMap.get(c.showId);
            const fin = financeMap.get(c.showId);
            if (!ev) return null;
            return { event: ev, finance: fin, memberCache: c.cache };
          }).filter(Boolean);

          totals = joinedData.reduce((acc, curr) => {
            const cache = curr.memberCache || 0;
            const isPago = curr.finance?.statusPagamento === 'Quitado';
            return {
              totalGeral: acc.totalGeral + cache,
              totalRecebido: acc.totalRecebido + (isPago ? cache : 0),
              totalPendente: acc.totalPendente + (isPago ? 0 : cache)
            };
          }, { totalGeral: 0, totalRecebido: 0, totalPendente: 0 });
        }

        joinedData.sort((a, b) => new Date(b.event.dataEvento).getTime() - new Date(a.event.dataEvento).getTime());
        setFinanceItems(joinedData);
        setStats(totals);
      } catch (err) {
        console.error("Erro financeiro:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [userProfile, isAdmin, isContratante, isIntegrante]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-6">
      <Loader2 className="animate-spin text-blue-500" size={64} />
      <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Calculando Ativos...</p>
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
          {isIntegrante ? 'Acompanhe seus cachês e o status de pagamento dos shows realizados.' : 'Gestão de faturamento e recebíveis HS.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{isIntegrante ? 'Cachê Acumulado' : 'Total Geral'}</p>
          <p className="text-3xl font-black text-white tracking-tighter">R$ {stats.totalGeral.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{isIntegrante ? 'Já Recebido' : 'Liquidado'}</p>
          <p className="text-3xl font-black text-emerald-500 tracking-tighter">R$ {stats.totalRecebido.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{isIntegrante ? 'A Receber' : 'Pendente'}</p>
          <p className="text-3xl font-black text-amber-500 tracking-tighter">R$ {stats.totalPendente.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {financeItems.map(({ event, finance, memberCache }) => {
          const isQuitado = finance?.statusPagamento === 'Quitado';
          return (
            <div key={event.id} className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 hover:border-blue-500/30 transition-all shadow-2xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-white tracking-tighter truncate">{event.titulo}</h3>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1 flex items-center">
                    <MapPin size={10} className="mr-1" /> {event.local}
                  </p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                  isQuitado ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {isQuitado ? 'Liquidado' : 'Em aberto'}
                </span>
              </div>

              <div className="flex justify-between items-end border-t border-slate-800/50 pt-6">
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Seu Cachê</p>
                  <p className="text-2xl font-black text-white tracking-tighter">R$ {(isIntegrante ? memberCache : finance?.valorEvento)?.toLocaleString('pt-BR')}</p>
                </div>
                <Link to={`/finance/${event.id}`} className="p-4 bg-slate-800 text-blue-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                  <ChevronRight size={20} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Finance;
