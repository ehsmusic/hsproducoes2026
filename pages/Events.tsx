
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

  const filteredEvents = statusFilter === 'todos' 
    ? events 
    : events.filter(e => e.status === statusFilter);

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
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Agenda de Shows</h1>
          <p className="text-slate-500 font-bold mt-2">Gerencie escalas, locais e o workflow de cada apresentação.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group min-w-[220px] hidden md:block">
            <Filter size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-14 pr-10 py-5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-sm"
            >
              <option value="todos">Todos os Status</option>
              {Object.values(EventStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {userProfile?.role !== UserRole.INTEGRANTE && (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="group flex items-center justify-center space-x-3 bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black hover:bg-blue-700 shadow-2xl shadow-blue-500/20 transition-all active:scale-95"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              <span className="text-xs uppercase tracking-widest">Novo Show</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {filteredEvents.map(event => (
            <Link key={event.id} to={`/events/${event.id}`} className="group bg-white border border-slate-100 rounded-[3rem] overflow-hidden hover:border-blue-500/30 transition-all shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_60px_-15px_rgba(59,130,246,0.15)] flex flex-col">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                  event.status === EventStatus.CONFIRMADO ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-400 border-slate-100'
                }`}>
                  {event.status}
                </span>
                <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center">
                   <Music size={12} className="mr-1.5" /> {event.tipo}
                </div>
              </div>
              <div className="p-8 flex-1 space-y-8">
                <div>
                  <h3 className="font-black text-2xl text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors line-clamp-2">{event.titulo}</h3>
                  <div className="flex items-center text-[10px] text-slate-400 font-black uppercase mt-3 tracking-widest">
                    <Clock size={12} className="mr-1.5 text-blue-500" /> {event.duracao}h de Duração
                  </div>
                </div>
                <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-50">
                  <div className="flex items-center text-[11px] font-black text-slate-600 uppercase tracking-widest">
                    <Calendar size={18} className="mr-4 text-blue-500" />
                    {event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Data a definir'}
                  </div>
                  <div className="flex items-center text-[11px] font-bold text-slate-500">
                    <MapPin size={18} className="mr-4 text-blue-500" />
                    <span className="truncate">{event.local}</span>
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesse o painel</span>
                <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm">
                  <ArrowRight size={18} />
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
