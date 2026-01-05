
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole, HSEvent, EventStatus } from '../types';
import { Calendar, TrendingUp, ChevronRight, Clock, MapPin, Music, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [nextEvents, setNextEvents] = useState<HSEvent[]>([]);
  const [stats, setStats] = useState({
    totalShows: 0,
    confirmados: 0,
    solicitacoes: 0,
    financeiro: 'R$ 0,00'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userProfile) return;
      try {
        const eventsRef = collection(db, 'events');
        
        // 1. Busca para a Lista de Próximos Shows (Limitado a 5)
        let qEvents;
        if (userProfile.role === UserRole.ADMIN) {
          qEvents = query(eventsRef, orderBy('date', 'asc'), limit(5));
        } else if (userProfile.role === UserRole.CONTRATANTE) {
          qEvents = query(eventsRef, where('contratanteId', '==', userProfile.uid), orderBy('date', 'asc'), limit(5));
        } else {
          qEvents = query(eventsRef, where('integrantesIds', 'array-contains', userProfile.uid), orderBy('date', 'asc'), limit(5));
        }
        
        const eventsSnapshot = await getDocs(qEvents);
        const fetchedEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HSEvent));
        setNextEvents(fetchedEvents);

        // 2. Busca para Estatísticas (Sem limite de 5)
        let qStats;
        if (userProfile.role === UserRole.ADMIN) {
          qStats = query(eventsRef);
        } else if (userProfile.role === UserRole.CONTRATANTE) {
          qStats = query(eventsRef, where('contratanteId', '==', userProfile.uid));
        } else {
          qStats = query(eventsRef, where('integrantesIds', 'array-contains', userProfile.uid));
        }

        const statsSnapshot = await getDocs(qStats);
        const allEvents = statsSnapshot.docs.map(doc => doc.data() as HSEvent);

        // LOGICA DE SOMA SOLICITADA:
        // Integrante: Soma eventos onde está escalado e o status geral é CONFIRMADO
        // Contratante: Soma solicitações (status Solicitado) criadas por ele
        // Admin: Soma TODAS as solicitações (status Solicitado) do sistema
        
        const totalShows = allEvents.length;
        const confirmados = allEvents.filter(e => e.status === EventStatus.CONFIRMADO).length;
        const solicitacoes = allEvents.filter(e => e.status === EventStatus.SOLICITADO).length;

        setStats({
          totalShows,
          confirmados,
          solicitacoes,
          financeiro: userProfile.role === UserRole.ADMIN ? 'R$ 12.450,00' : 'R$ 0,00'
        });

      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [userProfile]);

  const renderCards = () => {
    const isAdmin = userProfile?.role === UserRole.ADMIN;
    const isContratante = userProfile?.role === UserRole.CONTRATANTE;
    const isIntegrante = userProfile?.role === UserRole.INTEGRANTE;

    const cards = [];

    // Card Meus Shows / Shows Escalados - Visível para todos
    cards.push({ 
      title: isIntegrante ? 'Shows Escalados' : 'Meus Shows', 
      value: stats.totalShows, 
      icon: Music, 
      color: 'from-blue-600 to-indigo-700' 
    });

    // Card Confirmados - EXCLUSIVO INTEGRANTE
    if (isIntegrante) {
      cards.push({ 
        title: 'Meus Confirmados', 
        value: stats.confirmados, 
        icon: Sparkles, 
        color: 'from-emerald-600 to-teal-700' 
      });
    }

    // Card Solicitações - EXCLUSIVO ADMIN E CONTRATANTE
    if (isAdmin || isContratante) {
      cards.push({ 
        title: isAdmin ? 'Solicitações Globais' : 'Minhas Solicitações', 
        value: stats.solicitacoes, 
        icon: Clock, 
        color: 'from-amber-600 to-orange-700' 
      });
    }

    // Card Financeiro - Apenas Admin
    if (isAdmin) {
      cards.push({ 
        title: 'Previsão de Saldo', 
        value: stats.financeiro, 
        icon: TrendingUp, 
        color: 'from-purple-600 to-pink-700' 
      });
    }

    return cards.map((card, i) => (
      <div key={i} className="relative group overflow-hidden bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] hover:border-blue-500/30 transition-all duration-500 shadow-2xl">
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${card.color} opacity-10 blur-2xl group-hover:opacity-30 transition-opacity`}></div>
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-8 shadow-xl shadow-black/40 group-hover:scale-110 transition-transform duration-500`}>
          <card.icon size={26} />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{card.title}</p>
        <p className="text-4xl font-black text-white mt-2 tracking-tighter">{card.value}</p>
      </div>
    ));
  };

  if (loading) return (
    <div className="animate-pulse space-y-12">
      <div className="h-12 w-64 bg-slate-900 rounded-2xl"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-900 border border-slate-800 rounded-[2.5rem]"></div>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 text-blue-500 mb-2">
            <Sparkles size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Visão Geral HS</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Olá, <span className="text-blue-500">{userProfile?.displayName.split(' ')[0]}</span>.
          </h1>
          <p className="text-slate-500 font-bold mt-2">Painel administrativo - Perfil: {userProfile?.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {renderCards()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white flex items-center tracking-tighter uppercase">
              <Calendar className="mr-4 text-blue-500" size={24} /> Próximos Shows
            </h2>
            <Link to="/events" className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest bg-blue-500/5 px-4 py-2 rounded-xl transition-all border border-blue-500/10">Ver Todos</Link>
          </div>
          
          <div className="space-y-5">
            {nextEvents.length > 0 ? nextEvents.map(event => (
              <Link key={event.id} to={`/events/${event.id}`} className="group relative block bg-slate-900/20 border border-slate-900 p-6 rounded-[2rem] hover:bg-slate-900/60 hover:border-blue-500/20 transition-all duration-300">
                <div className="flex items-center justify-between gap-8">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-slate-950 rounded-[1.25rem] flex flex-col items-center justify-center text-blue-500 font-black border border-slate-800 group-hover:border-blue-500/50 transition-colors">
                      <span className="text-[10px] uppercase leading-none opacity-50 font-bold">{new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                      <span className="text-2xl leading-none mt-1.5">{new Date(event.date).getDate()}</span>
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-white group-hover:text-blue-400 transition-colors tracking-tight">{event.title}</h3>
                      <div className="flex items-center text-sm text-slate-500 mt-2 font-bold">
                        <MapPin size={14} className="mr-2 text-slate-700" /> {event.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="hidden sm:block text-right">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        event.status === EventStatus.CONFIRMADO ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        event.status === EventStatus.SOLICITADO ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>{event.status}</span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="bg-slate-950/50 border-2 border-dashed border-slate-900 rounded-[3rem] p-20 text-center">
                <Music className="mx-auto text-slate-800 mb-6" size={56} />
                <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Nenhum evento agendado</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Acesso Rápido</h2>
          <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3rem] space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
            {userProfile?.role !== UserRole.INTEGRANTE && (
              <Link to="/events?new=true" className="w-full flex items-center justify-between p-5 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/30 active:scale-95 text-lg">
                Novo Evento <Sparkles size={22} />
              </Link>
            )}
            <Link to="/profile" className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-800/50 text-slate-200 font-bold hover:bg-slate-800 transition-all border border-slate-800 active:scale-95">
              Editar Perfil <ChevronRight size={20} />
            </Link>
            {userProfile?.role === UserRole.ADMIN && (
              <Link to="/integrantes" className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-800/50 text-slate-200 font-bold hover:bg-slate-800 transition-all border border-slate-800 active:scale-95">
                Equipe & Músicos <Users size={20} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
