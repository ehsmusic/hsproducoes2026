
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { HSEvent, EventStatus, UserRole, ShowType, UserProfile } from '../types';
import { Plus, Calendar, MapPin, ArrowRight, Music, Clock, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

// Widgets
import EventFormWidget from '../widgets/EventFormWidget';

const Events: React.FC = () => {
  const { userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<HSEvent[]>([]);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    status: EventStatus.SOLICITADO // Garantindo status inicial para o select
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

  return (
    <div className="space-y-8 animate-fade-in relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Agenda de Shows</h1>
          <p className="text-slate-500 font-bold mt-1">Gestão completa da agenda e logística.</p>
        </div>
        {userProfile?.role !== UserRole.INTEGRANTE && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black hover:bg-blue-500 shadow-xl transition-all active:scale-95">
            <Plus size={20} />
            <span>Novo Show</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map(event => (
            <div key={event.id} className="group bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden hover:border-blue-500/30 transition-all shadow-2xl flex flex-col">
              <div className="p-7 border-b border-slate-800/50 flex justify-between items-center bg-slate-950/20">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{event.status}</span>
                <div className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{event.tipo}</div>
              </div>
              <div className="p-8 flex-1 space-y-6">
                <div>
                  <h3 className="font-black text-2xl text-white tracking-tighter line-clamp-1">{event.titulo}</h3>
                  <div className="flex items-center text-xs text-blue-500 font-black uppercase mt-2">
                    <Clock size={12} className="mr-1.5" /> {event.duracao}h de Show
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center text-sm font-black text-slate-400 uppercase tracking-widest">
                    <Calendar size={18} className="mr-3 text-blue-500/70" />
                    {event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data a definir'}
                  </div>
                  <div className="flex items-center text-sm font-bold text-slate-400">
                    <MapPin size={18} className="mr-3 text-blue-500/70" />
                    {event.local}
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-950/60 border-t border-slate-800/50">
                <Link to={`/events/${event.id}`} className="w-full justify-center px-6 py-2.5 bg-slate-800 rounded-xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center">
                  VER DETALHES <ArrowRight size={14} className="ml-2" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <EventFormWidget 
          title="Nova Solicitação"
          data={formData}
          setData={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isSubmitting}
          isAdmin={isAdmin}
          clients={clients}
          submitLabel="Solicitar Orçamento"
        />
      )}
    </div>
  );
};

export default Events;
