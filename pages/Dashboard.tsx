
import React, { useState, useEffect } from 'react';
import { useAuth, LOGO_URL } from '../App';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole, HSEvent, EventStatus, HSEventFinance, HSEventContratacao } from '../types';
import { 
  Calendar, Activity, Plus, DollarSign, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router';

// Import Widgets
import DashboardStatsWidget from '../widgets/DashboardStatsWidget';
import DashboardTimelineWidget from '../widgets/DashboardTimelineWidget';
import DashboardQuickAccessWidget from '../widgets/DashboardQuickAccessWidget';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  
  const confirmedStatuses = [
    EventStatus.ACEITO.toLowerCase(), 
    EventStatus.CONFIRMADO.toLowerCase(), 
    EventStatus.CONCLUIDO.toLowerCase()
  ];
  const pendingStatus = EventStatus.SOLICITADO.toLowerCase();

  const [nextEvents, setNextEvents] = useState<HSEvent[]>([]);
  const [stats, setStats] = useState({
    label1: '', value1: 0,
    label2: '', value2: 0,
    label3: '', value3: 0,
    isCurrency1: false
  });
  const [loading, setLoading] = useState(true);

  const isRole = (target: UserRole) => {
    if (!userProfile?.role) return false;
    const current = userProfile.role.toLowerCase().trim();
    const goal = target.toLowerCase().trim();
    return current === goal || (goal === 'administrador' && current === 'admin');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userProfile) return;
      try {
        const eventsRef = collection(db, 'events');
        const financeRef = collection(db, 'financeiro');
        const contratacaoRef = collection(db, 'contratacao');
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. CRONOGRAMA
        let qEvents;
        if (isRole(UserRole.ADMIN)) {
          qEvents = query(eventsRef, orderBy('dataEvento', 'asc'), limit(8));
        } else if (isRole(UserRole.CONTRATANTE)) {
          qEvents = query(eventsRef, where('contratanteId', '==', userProfile.uid), orderBy('dataEvento', 'asc'), limit(5));
        } else {
          qEvents = query(eventsRef, where('integrantesIds', 'array-contains', userProfile.uid), orderBy('dataEvento', 'asc'), limit(5));
        }
        const eventsSnapshot = await getDocs(qEvents);
        setNextEvents(eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as object } as HSEvent)));

        // 2. STATS
        if (isRole(UserRole.ADMIN)) {
          const allEvtsSnap = await getDocs(eventsRef);
          const allEvts = allEvtsSnap.docs.map(d => ({ id: d.id, ...d.data() as object } as HSEvent));
          const confirmedIds = allEvts.filter(e => confirmedStatuses.includes((e.status || "").toLowerCase())).map(e => e.id);
          const solicitudesPendentes = allEvts.filter(e => (e.status || "").toLowerCase() === pendingStatus).length;

          let volumeNegocios = 0;
          if (confirmedIds.length > 0) {
            const finSnap = await getDocs(financeRef);
            finSnap.forEach(d => { if (confirmedIds.includes(d.id)) volumeNegocios += (d.data() as HSEventFinance).valorEvento || 0; });
          }

          setStats({
            label1: 'Volume Negociado', value1: volumeNegocios, isCurrency1: true,
            label2: 'Shows Confirmados', value2: confirmedIds.length,
            label3: 'Solicitações', value3: solicitudesPendentes
          });

        } else if (isRole(UserRole.CONTRATANTE)) {
          const qMyEvts = query(eventsRef, where('contratanteId', '==', userProfile.uid));
          const myEvtsSnap = await getDocs(qMyEvts);
          const myEvts = myEvtsSnap.docs.map(d => ({ id: d.id, ...d.data() as object } as HSEvent));
          const confirmedIds = myEvts.filter(e => confirmedStatuses.includes((e.status || "").toLowerCase())).map(e => e.id);
          const solicitudesPendentes = myEvts.filter(e => (e.status || "").toLowerCase() === pendingStatus).length;

          let investimentoTotal = 0;
          if (confirmedIds.length > 0) {
            const finSnap = await getDocs(financeRef);
            finSnap.forEach(d => { if (confirmedIds.includes(d.id)) investimentoTotal += (d.data() as HSEventFinance).valorEvento || 0; });
          }

          setStats({
            label1: 'Investimento Total', value1: investimentoTotal, isCurrency1: true,
            label2: 'Meus Shows', value2: confirmedIds.length,
            label3: 'Em Análise', value3: solicitudesPendentes
          });

        } else if (isRole(UserRole.INTEGRANTE)) {
          const qMyCont = query(contratacaoRef, where('integranteId', '==', userProfile.uid));
          const myContSnap = await getDocs(qMyCont);
          const myConts = myContSnap.docs.map(d => d.data() as HSEventContratacao);
          const confirmedConts = myConts.filter(c => c.confirmacao === true);
          const cacheAcumulado = confirmedConts.reduce((acc, curr) => acc + (curr.cache || 0), 0);
          
          let pendentesFuturos = 0;
          if (myConts.filter(c => !c.confirmacao).length > 0) {
            const allEvtsSnap = await getDocs(eventsRef);
            const evtsMap = new Map();
            allEvtsSnap.docs.forEach(d => evtsMap.set(d.id, { id: d.id, ...d.data() as object } as HSEvent));
            myConts.filter(c => !c.confirmacao).forEach(c => {
              const evt = evtsMap.get(c.showId);
              if (evt && evt.dataEvento > todayStr) pendentesFuturos++;
            });
          }

          setStats({
            label1: 'Ganhos Acumulados', value1: cacheAcumulado, isCurrency1: true,
            label2: 'Shows Confirmados', value2: confirmedConts.length,
            label3: 'Escalas Pendentes', value3: pendentesFuturos
          });
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchDashboardData();
  }, [userProfile]);

  if (loading) return (
    <div className="flex flex-col h-96 items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Backstage HS Sincronizando...</p>
    </div>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-blue-600 mb-2">
            <Activity size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Painel Operacional HS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
            {getGreeting()}, <span className="text-blue-600">{userProfile?.displayName.split(' ')[0]}</span>.
          </h1>
          <div className="flex items-center space-x-3 text-slate-500 font-bold">
            <Calendar size={14} className="text-slate-300" />
            <span className="text-sm">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {isRole(UserRole.ADMIN) && (
             <Link to="/events?new=true" className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center space-x-2">
               <Plus size={18} className="transition-transform group-hover:rotate-90" />
               <span>Agendar Show</span>
             </Link>
           )}
           {isRole(UserRole.CONTRATANTE) && (
             <Link to="/events?new=true" className="group bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center space-x-2">
               <DollarSign size={18} />
               <span>Novo Orçamento</span>
             </Link>
           )}
           {isRole(UserRole.INTEGRANTE) && (
             <Link to="/confirmacoes" className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center space-x-2">
               <CheckCircle2 size={18} />
               <span>Verificar Escala</span>
             </Link>
           )}
        </div>
      </div>

      <DashboardStatsWidget 
        {...stats} 
        isIntegrante={isRole(UserRole.INTEGRANTE)} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <DashboardTimelineWidget 
            events={nextEvents} 
            confirmedStatuses={confirmedStatuses} 
          />
        </div>
        <div>
          <DashboardQuickAccessWidget userProfile={userProfile} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
