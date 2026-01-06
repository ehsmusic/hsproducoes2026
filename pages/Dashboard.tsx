// Consolidating lucide-react imports to fix 'Plus' not found and clean up redundancy
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole, HSEvent, EventStatus, HSEventFinance, HSEventContratacao } from '../types';
import { 
  Calendar, TrendingUp, ChevronRight, Clock, MapPin, 
  Music, Sparkles, Users, Wallet, CheckCircle2, 
  ArrowUpRight, DollarSign, Briefcase, Star, 
  Activity, Bell, LayoutGrid, Plus, UserCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [nextEvents, setNextEvents] = useState<HSEvent[]>([]);
  const [stats, setStats] = useState({
    totalValue: 0,
    confirmedCount: 0,
    pendingCount: 0,
    memberCaches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userProfile) return;
      try {
        const eventsRef = collection(db, 'events');
        const financeRef = collection(db, 'financeiro');
        const contratacaoRef = collection(db, 'contratacao');
        
        let qEvents;
        if (userProfile.role === UserRole.ADMIN) {
          qEvents = query(eventsRef, orderBy('dataEvento', 'asc'), limit(8));
        } else if (userProfile.role === UserRole.CONTRATANTE) {
          qEvents = query(eventsRef, where('contratanteId', '==', userProfile.uid), orderBy('dataEvento', 'asc'), limit(5));
        } else {
          qEvents = query(eventsRef, where('integrantesIds', 'array-contains', userProfile.uid), orderBy('dataEvento', 'asc'), limit(5));
        }
        
        const eventsSnapshot = await getDocs(qEvents);
        const fetchedEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HSEvent));
        setNextEvents(fetchedEvents);

        let totalValue = 0;
        let confirmedCount = 0;
        let pendingCount = 0;
        let memberCaches = 0;

        if (userProfile.role === UserRole.ADMIN) {
          const finSnap = await getDocs(financeRef);
          finSnap.forEach(d => totalValue += (d.data() as HSEventFinance).valorEvento || 0);
          
          const allEvtSnap = await getDocs(eventsRef);
          allEvtSnap.forEach(d => {
            const status = (d.data() as HSEvent).status;
            if (status === EventStatus.CONFIRMADO) confirmedCount++;
            if (status === EventStatus.SOLICITADO) pendingCount++;
          });
        } 
        else if (userProfile.role === UserRole.CONTRATANTE) {
          const qMyEvents = query(eventsRef, where('contratanteId', '==', userProfile.uid));
          const myEvtSnap = await getDocs(qMyEvents);
          const myIds = myEvtSnap.docs.map(d => {
            const status = (d.data() as HSEvent).status;
            if (status === EventStatus.CONFIRMADO) confirmedCount++;
            else if (status === EventStatus.SOLICITADO) pendingCount++;
            return d.id;
          });
          
          if (myIds.length > 0) {
            const finSnap = await getDocs(financeRef);
            finSnap.forEach(d => {
              if (myIds.includes(d.id)) totalValue += (d.data() as HSEventFinance).valorEvento || 0;
            });
          }
        }
        else {
          const qMyContratacoes = query(contratacaoRef, where('integranteId', '==', userProfile.uid), where('confirmacao', '==', true));
          const contSnap = await getDocs(qMyContratacoes);
          contSnap.forEach(d => memberCaches += (d.data() as HSEventContratacao).cache || 0);
          
          confirmedCount = fetchedEvents.filter(e => e.status === EventStatus.CONFIRMADO).length;
          pendingCount = fetchedEvents.filter(e => e.status === EventStatus.SOLICITADO).length;
        }

        setStats({ totalValue, confirmedCount, pendingCount, memberCaches });
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

  const isAdmin = userProfile?.role === UserRole.ADMIN;
  const isContratante = userProfile?.role === UserRole.CONTRATANTE;
  const isIntegrante = userProfile?.role === UserRole.INTEGRANTE;

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
           {isAdmin && (
             <Link to="/events?new=true" className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] transition-all active:scale-95 flex items-center space-x-2">
               <Plus size={18} className="group-hover:rotate-90 transition-transform" />
               <span>Novo Show</span>
             </Link>
           )}
           {isContratante && (
             <Link to="/events?new=true" className="group bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] transition-all active:scale-95 flex items-center space-x-2">
               <DollarSign size={18} />
               <span>Pedir Orçamento</span>
             </Link>
           )}
           {isIntegrante && (
             <Link to="/confirmacoes" className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] transition-all active:scale-95 flex items-center space-x-2">
               <CheckCircle2 size={18} />
               <span>Ver Escala</span>
             </Link>
           )}
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl p-8 rounded-[2.5rem] hover:border-blue-500/30 transition-all duration-500">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-blue-600/5 blur-2xl group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20"><Wallet size={22} /></div>
            <ArrowUpRight className="text-slate-700 group-hover:text-blue-500 transition-colors" size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{isAdmin ? 'Volume em Negócio' : isContratante ? 'Investimento Total' : 'Cache Acumulado'}</p>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-lg font-black text-blue-500/50 tracking-tighter">R$</span>
            <p className="text-4xl font-black text-white tracking-tighter">{(isIntegrante ? stats.memberCaches : stats.totalValue).toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl p-8 rounded-[2.5rem] hover:border-emerald-500/30 transition-all duration-500">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-emerald-600/5 blur-2xl group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><CheckCircle2 size={22} /></div>
            <ArrowUpRight className="text-slate-700 group-hover:text-emerald-500 transition-colors" size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{isIntegrante ? 'Shows na Escala' : 'Eventos Confirmados'}</p>
          <p className="text-4xl font-black text-white mt-2 tracking-tighter">{stats.confirmedCount}</p>
        </div>

        <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl p-8 rounded-[2.5rem] hover:border-amber-500/30 transition-all duration-500">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-amber-600/5 blur-2xl group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-500 border border-amber-500/20"><Clock size={22} /></div>
            <ArrowUpRight className="text-slate-700 group-hover:text-amber-500 transition-colors" size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{isIntegrante ? 'Aguardando Data' : 'Solicitações Pendentes'}</p>
          <p className="text-4xl font-black text-white mt-2 tracking-tighter">{stats.pendingCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* MAIN CONTENT: AGENDA */}
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
                      event.status === EventStatus.CONFIRMADO 
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

        {/* SIDEBAR: WIDGETS */}
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

              {isAdmin && (
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

              {isAdmin && (
                <Link to="/finance" className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-white font-bold hover:bg-emerald-600 hover:border-emerald-500 transition-all active:scale-95 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-white/10 flex items-center justify-center text-emerald-500 group-hover:text-white transition-all">
                      <TrendingUp size={20} />
                    </div>
                    <span className="text-sm">Relatório Mensal</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
                </Link>
              )}

              {isIntegrante && (
                <Link to="/confirmacoes" className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-white font-bold hover:bg-emerald-600 hover:border-emerald-500 transition-all active:scale-95 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-white/10 flex items-center justify-center text-emerald-500 group-hover:text-white transition-all">
                      <CheckCircle2 size={20} />
                    </div>
                    <span className="text-sm">Confirmar Agenda</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
                </Link>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] shadow-2xl group">
             <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
             <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20">
                  <Star size={24} />
                </div>
                <h4 className="text-xl font-black text-white tracking-tighter">Membro Premium HS</h4>
                <p className="text-xs text-blue-100 font-medium leading-relaxed">
                   Você faz parte do time de elite da Helder Santos Produções. Continue entregando excelência em cada palco!
                </p>
                <div className="pt-2">
                   <div className="flex -space-x-2 overflow-hidden">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-blue-600 bg-slate-800 flex items-center justify-center text-[10px] font-bold">HS</div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;