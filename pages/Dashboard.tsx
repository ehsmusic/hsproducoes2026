
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole, HSEvent, EventStatus, HSEventFinance, HSEventContratacao } from '../types';
import { 
  Calendar, TrendingUp, ChevronRight, Clock, MapPin, 
  Music, Sparkles, Users, Wallet, CheckCircle2, 
  ArrowUpRight, DollarSign, Briefcase, Star, 
  Activity, Bell, LayoutGrid, Plus, UserCircle,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  
  // Status de referência para filtros (Normalizados para minúsculas)
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

  // Função de segurança para verificar Role (Case Insensitive)
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

        // 1. CRONOGRAMA LATERAL (Lista de próximos shows)
        let qEvents;
        if (isRole(UserRole.ADMIN)) {
          qEvents = query(eventsRef, orderBy('dataEvento', 'asc'), limit(8));
        } else if (isRole(UserRole.CONTRATANTE)) {
          qEvents = query(eventsRef, where('contratanteId', '==', userProfile.uid), orderBy('dataEvento', 'asc'), limit(5));
        } else {
          qEvents = query(eventsRef, where('integrantesIds', 'array-contains', userProfile.uid), orderBy('dataEvento', 'asc'), limit(5));
        }
        const eventsSnapshot = await getDocs(qEvents);
        // Fix: Cast doc.data() as object to avoid spread type error
        setNextEvents(eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as object } as HSEvent)));

        // 2. LÓGICA DOS CARDS (AGREGAÇÃO DE DADOS)
        
        if (isRole(UserRole.ADMIN)) {
          // --- ADMIN ---
          const allEvtsSnap = await getDocs(eventsRef);
          // Fix: Cast doc.data() as object to avoid spread type error
          const allEvts = allEvtsSnap.docs.map(d => ({ id: d.id, ...d.data() as object } as HSEvent));
          
          const confirmedIds = allEvts
            .filter(e => confirmedStatuses.includes((e.status || "").toLowerCase()))
            .map(e => e.id);
          
          const confirmedCount = confirmedIds.length;
          const solicitudesPendentes = allEvts.filter(e => (e.status || "").toLowerCase() === pendingStatus).length;

          let volumeNegocios = 0;
          if (confirmedIds.length > 0) {
            const finSnap = await getDocs(financeRef);
            finSnap.forEach(d => {
              // Verifica se o financeiro.id está na lista de IDs de eventos aceitos/confirmados/concluidos
              if (confirmedIds.includes(d.id)) {
                volumeNegocios += (d.data() as HSEventFinance).valorEvento || 0;
              }
            });
          }

          setStats({
            label1: 'Volume em negócios', value1: volumeNegocios, isCurrency1: true,
            label2: 'Eventos confirmados', value2: confirmedCount,
            label3: 'Solicitações pendentes', value3: solicitudesPendentes
          });

        } else if (isRole(UserRole.CONTRATANTE)) {
          // --- CONTRATANTE ---
          const qMyEvts = query(eventsRef, where('contratanteId', '==', userProfile.uid));
          const myEvtsSnap = await getDocs(qMyEvts);
          const myEvts = myEvtsSnap.docs.map(d => ({ id: d.id, ...d.data() as object } as HSEvent));

          const confirmedIds = myEvts
            .filter(e => confirmedStatuses.includes((e.status || "").toLowerCase()))
            .map(e => e.id);
          
          const confirmedCount = confirmedIds.length;
          const solicitudesPendentes = myEvts.filter(e => (e.status || "").toLowerCase() === pendingStatus).length;

          let investimentoTotal = 0;
          if (confirmedIds.length > 0) {
            const finSnap = await getDocs(financeRef);
            finSnap.forEach(d => {
              if (confirmedIds.includes(d.id)) {
                investimentoTotal += (d.data() as HSEventFinance).valorEvento || 0;
              }
            });
          }

          setStats({
            label1: 'Investimento total', value1: investimentoTotal, isCurrency1: true,
            label2: 'Eventos confirmados', value2: confirmedCount,
            label3: 'Solicitações pendentes', value3: solicitudesPendentes
          });

        } else if (isRole(UserRole.INTEGRANTE)) {
          // --- INTEGRANTE ---
          const qMyCont = query(contratacaoRef, where('integranteId', '==', userProfile.uid));
          const myContSnap = await getDocs(qMyCont);
          const myConts = myContSnap.docs.map(d => d.data() as HSEventContratacao);

          // Cachê Acumulado e Shows Escalados (confirmacao === true)
          const confirmedConts = myConts.filter(c => c.confirmacao === true);
          const cacheAcumulado = confirmedConts.reduce((acc, curr) => acc + (curr.cache || 0), 0);
          const showsEscaladosCount = confirmedConts.length;

          // Confirmações Pendentes (confirmacao === false E dataEvento > hoje)
          const pendingConts = myConts.filter(c => c.confirmacao === false);
          let pendentesFuturos = 0;

          if (pendingConts.length > 0) {
            // Buscamos os eventos para cruzar a data
            const allEvtsSnap = await getDocs(eventsRef);
            const evtsMap = new Map();
            // Fix: Cast doc.data() as object to avoid spread type error
            allEvtsSnap.docs.forEach(d => evtsMap.set(d.id, { id: d.id, ...d.data() as object } as HSEvent));

            pendingConts.forEach(c => {
              const evt = evtsMap.get(c.showId);
              if (evt && evt.dataEvento > todayStr) {
                pendentesFuturos++;
              }
            });
          }

          setStats({
            label1: 'Cachê acumulado', value1: cacheAcumulado, isCurrency1: true,
            label2: 'Shows escalados', value2: showsEscaladosCount,
            label3: 'Confirmações pendentes', value3: pendentesFuturos
          });
        }

      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [userProfile]);

  if (loading) return (
    <div className="flex flex-col h-96 items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Sincronizando Backstage...</p>
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
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-blue-500 mb-2">
            <Activity size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Painel de Controle HS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">{userProfile?.displayName.split(' ')[0]}</span>.
          </h1>
          <div className="flex items-center space-x-3 text-slate-500 font-bold">
            <Calendar size={14} className="text-slate-700" />
            <span className="text-sm">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {isRole(UserRole.ADMIN) && (
             <Link to="/events?new=true" className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] transition-all active:scale-95 flex items-center space-x-2">
               <Plus size={18} className="group-hover:rotate-90 transition-transform" />
               <span>Novo Show</span>
             </Link>
           )}
           {isRole(UserRole.CONTRATANTE) && (
             <Link to="/events?new=true" className="group bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] transition-all active:scale-95 flex items-center space-x-2">
               <DollarSign size={18} />
               <span>Pedir Orçamento</span>
             </Link>
           )}
           {isRole(UserRole.INTEGRANTE) && (
             <Link to="/confirmacoes" className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] transition-all active:scale-95 flex items-center space-x-2">
               <CheckCircle2 size={18} />
               <span>Ver Escala</span>
             </Link>
           )}
        </div>
      </div>

      {/* STATS GRID - 100% PRECISO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl p-8 rounded-[2.5rem] hover:border-blue-500/30 transition-all duration-500">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-blue-600/5 blur-2xl group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20"><Wallet size={22} /></div>
            <ArrowUpRight className="text-slate-700 group-hover:text-blue-500 transition-colors" size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stats.label1}</p>
          <div className="flex items-baseline space-x-1 mt-2">
            {stats.isCurrency1 && <span className="text-lg font-black text-blue-500/50 tracking-tighter">R$</span>}
            <p className="text-4xl font-black text-white tracking-tighter">
              {stats.isCurrency1 ? stats.value1.toLocaleString('pt-BR') : stats.value1}
            </p>
          </div>
        </div>

        <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl p-8 rounded-[2.5rem] hover:border-emerald-500/30 transition-all duration-500">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-emerald-600/5 blur-2xl group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><CheckCircle2 size={22} /></div>
            <ArrowUpRight className="text-slate-700 group-hover:text-emerald-500 transition-colors" size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stats.label2}</p>
          <p className="text-4xl font-black text-white mt-2 tracking-tighter">{stats.value2}</p>
        </div>

        <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl p-8 rounded-[2.5rem] hover:border-amber-500/30 transition-all duration-500">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-amber-600/5 blur-2xl group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              {isRole(UserRole.INTEGRANTE) ? <AlertCircle size={22} /> : <Clock size={22} />}
            </div>
            <ArrowUpRight className="text-slate-700 group-hover:text-amber-500 transition-colors" size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stats.label3}</p>
          <p className="text-4xl font-black text-white mt-2 tracking-tighter">{stats.value3}</p>
        </div>
      </div>

      {/* CRONOGRAMA DE SHOWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-4">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Cronograma de Shows</h2>
            </div>
            <Link to="/events" className="group flex items-center space-x-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">
              <span>Ver Agenda Completa</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-4">
            {nextEvents.length > 0 ? nextEvents.map(event => (
              <Link key={event.id} to={`/events/${event.id}`} className="group relative block bg-slate-900/20 border border-slate-800/40 hover:border-blue-500/30 p-6 rounded-[2rem] transition-all hover:bg-slate-900/40 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center space-x-6">
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-950 rounded-2xl border border-slate-800 group-hover:border-blue-500/50 transition-colors">
                      <span className="text-[8px] font-black text-slate-500 uppercase leading-none">{event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }) : '---'}</span>
                      <span className="text-xl font-black text-white mt-1 leading-none">{event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').getDate() : '--'}</span>
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-white group-hover:text-blue-400 transition-colors tracking-tight">{event.titulo}</h3>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[11px] text-slate-500 mt-2 font-bold">
                        <span className="flex items-center"><MapPin size={12} className="mr-2 text-blue-500/50" /> {event.local}</span>
                        <span className="flex items-center"><Clock size={12} className="mr-2 text-blue-500/50" /> {event.horaEvento || '00:00'}h</span>
                        <span className="text-slate-700 hidden sm:inline">•</span>
                        <span className="flex items-center text-slate-600 italic truncate max-w-[200px]">{event.enderecoEvento}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end md:space-x-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                      confirmedStatuses.includes((event.status || "").toLowerCase())
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {event.status}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-blue-600 flex items-center justify-center text-slate-500 group-hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="bg-slate-950/50 border-2 border-dashed border-slate-900 rounded-[3rem] py-24 text-center">
                <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-800">
                  <Calendar size={40} />
                </div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Nenhum evento agendado</p>
                <p className="text-slate-700 font-bold text-xs mt-2">Novas datas aparecerão aqui automaticamente.</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR: ACESSO RÁPIDO */}
        <div className="space-y-10">
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic px-2">Acesso Rápido</h2>
            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[3rem] space-y-4 shadow-2xl backdrop-blur-md">
              <Link to="/profile" className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-white font-bold hover:bg-blue-600 hover:border-blue-500 transition-all active:scale-95 group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-white/10 flex items-center justify-center text-blue-500 group-hover:text-white transition-all">
                    <UserCircle size={20} />
                  </div>
                  <span className="text-sm">Meu Perfil</span>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
              </Link>

              {isRole(UserRole.ADMIN) && (
                <Link to="/integrantes" className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-white font-bold hover:bg-purple-600 hover:border-purple-500 transition-all active:scale-95 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-white/10 flex items-center justify-center text-purple-500 group-hover:text-white transition-all">
                      <Users size={20} />
                    </div>
                    <span className="text-sm">Gerenciar Time</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
                </Link>
              )}

              <Link to="/finance" className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-white font-bold hover:bg-emerald-600 hover:border-emerald-500 transition-all active:scale-95 group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-white/10 flex items-center justify-center text-emerald-500 group-hover:text-white transition-all">
                    <TrendingUp size={20} />
                  </div>
                  <span className="text-sm">Financeiro</span>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] shadow-2xl group">
             <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
             <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20">
                  <Star size={24} />
                </div>
                <h4 className="text-xl font-black text-white tracking-tighter">Time Helder Santos</h4>
                <p className="text-xs text-blue-100 font-medium leading-relaxed">
                   Gerenciamento profissional de shows e eventos com o padrão de qualidade HS Produções.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
