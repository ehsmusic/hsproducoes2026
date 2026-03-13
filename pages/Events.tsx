
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { HSEvent, EventStatus, UserRole, ShowType, UserProfile } from '../types';
import { Plus, Calendar, MapPin, ArrowRight, Music, Clock, Loader2, Filter, ChevronLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

// Widgets
import EventFormWidget from '../widgets/EventFormWidget';

const Events: React.FC = () => {
  const { userProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<HSEvent[]>([]);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showAll, setShowAll] = useState(false);

  const [formData, setFormData] = useState<Partial<HSEvent>>({
    titulo: '',
    tipo: 'Casamento' as ShowType,
    duracao: 2,
    dataEvento: '',
    horaEvento: '',
    local: '',
    enderecoEvento: '',
    publicoEstimado: 100,
    somContratado: false,
    alimentacaoInclusa: false,
    cerimonialista: '',
    localCerimonia: '',
    observacoes: '',
    contratanteId: '',
    status: EventStatus.SOLICITADO 
  });

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({ 
        ...prev, 
        contratanteId: userProfile.role === UserRole.CONTRATANTE ? userProfile.uid : '' 
      }));
    }
  }, [userProfile]);

  useEffect(() => {
    if (searchParams.get('new') === 'true' && userProfile?.role !== UserRole.INTEGRANTE) {
      setIsModalOpen(true);
    }
  }, [searchParams, userProfile]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) return;
      setLoading(true);
      try {
        const eventsRef = collection(db, 'events');
        let q;
        if (userProfile.role === UserRole.ADMIN) {
          q = query(eventsRef, orderBy('dataEvento', 'desc'));
        } else if (userProfile.role === UserRole.CONTRATANTE) {
          q = query(eventsRef, where('contratanteId', '==', userProfile.uid));
        } else {
          q = query(eventsRef, where('integrantesIds', 'array-contains', userProfile.uid));
        }
        const querySnapshot = await getDocs(q);
        setEvents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as object } as HSEvent)));

        if (userProfile.role === UserRole.ADMIN) {
          const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', UserRole.CONTRATANTE)));
          setClients(usersSnap.docs.map(doc => doc.data() as UserProfile));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newEvent: Omit<HSEvent, 'id'> = {
        ...(formData as any),
        createdAt: new Date().toISOString(),
        status: formData.status || EventStatus.SOLICITADO,
        integrantesIds: [],
        confirmedIntegrantes: [],
        payments: []
      };
      const docRef = await addDoc(collection(db, 'events'), newEvent);
      setEvents([{ id: docRef.id, ...newEvent } as HSEvent, ...events]);
      setIsModalOpen(false);
      setSearchParams({});
      setFormData({
        titulo: '', tipo: 'Casamento', duracao: 2, dataEvento: '', horaEvento: '',
        local: '', enderecoEvento: '', publicoEstimado: 100, somContratado: false,
        alimentacaoInclusa: false, cerimonialista: '', localCerimonia: '',
        observacoes: '', status: EventStatus.SOLICITADO,
        contratanteId: userProfile?.role === UserRole.CONTRATANTE ? userProfile.uid : ''
      });
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const isAdmin = userProfile?.role === UserRole.ADMIN;

  const filteredEvents = events.filter(e => {
    const matchesStatus = statusFilter === 'todos' || e.status === statusFilter;
    
    if (statusFilter === 'todos' && !showAll) {
      const hiddenStatuses = [EventStatus.RECUSADO, EventStatus.CANCELADO, EventStatus.CONCLUIDO];
      return matchesStatus && !hiddenStatuses.includes(e.status);
    }
    
    return matchesStatus;
  });

  // Se o formulário estiver aberto, renderizamos APENAS ele para parecer uma nova página
  if (isModalOpen) {
    return (
      <EventFormWidget 
        title="Nova Solicitação de Show"
        data={formData}
        setData={setFormData}
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          setSearchParams({});
        }}
        isSubmitting={isSubmitting}
        isAdmin={isAdmin}
        clients={clients}
        submitLabel="Confirmar Solicitação"
      />
    );
  }

  return (
    <div className="space-y-12 animate-fade-in relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div>
          <div className="flex items-center space-x-3 text-blue-600 mb-2">
            <Music size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Logística HS Produções</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">Agenda de Shows</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Gerencie escalas, locais e o workflow de cada apresentação.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setShowAll(!showAll)}
            className={`flex items-center space-x-2 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm border ${
              showAll 
              ? 'bg-slate-900 text-white border-slate-900' 
              : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'
            }`}
          >
            <Filter size={14} />
            <span>{showAll ? 'Ocultar Encerrados' : 'Mostrar Tudo'}</span>
          </button>

          <div className="relative group min-w-[220px] hidden md:block">
            <Filter size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-14 pr-10 py-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-sm"
            >
              <option value="todos">Status: Todos</option>
              {Object.values(EventStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {userProfile?.role !== UserRole.INTEGRANTE && (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="group flex items-center justify-center space-x-3 bg-blue-600 text-white px-8 py-4 rounded-xl font-black hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest">Novo Show</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando Agenda...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-20">
          {filteredEvents.map(event => (
            <Link 
              key={event.id} 
              to={`/events/${event.id}`} 
              className="group bg-white border border-slate-100 rounded-2xl p-4 md:p-6 hover:border-blue-500/30 transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6 flex-1">
                <div className="hidden sm:flex flex-col items-center justify-center w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600">
                    {event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }) : '---'}
                  </span>
                  <span className="text-2xl font-black text-slate-900 group-hover:text-blue-600 tracking-tighter">
                    {event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').getDate() : '--'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${
                      event.status === EventStatus.CONFIRMADO 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : event.status === EventStatus.CONCLUIDO
                      ? 'bg-slate-50 text-slate-400 border-slate-100'
                      : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {event.status}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                       <Music size={10} className="mr-1" /> {event.tipo}
                    </span>
                  </div>
                  <h3 className="font-black text-lg text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">
                    {event.titulo}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div className="flex items-center text-[10px] font-bold text-slate-500">
                      <MapPin size={12} className="mr-2 text-blue-500/50" />
                      <span className="truncate max-w-[200px]">{event.local}</span>
                    </div>
                    <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Clock size={12} className="mr-2 text-blue-500/50" /> {event.horaEvento || '--:--'} • {event.duracao}h
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                    +{event.integrantesIds?.length || 0}
                  </div>
                </div>
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm">
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}

          {!loading && filteredEvents.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm italic">Nenhum show localizado com este critério.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Events;
