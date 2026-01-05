
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { HSEvent, EventStatus, UserRole, ShowType, UserProfile } from '../types';
import { Plus, Search, Calendar, MapPin, ArrowRight, Loader2, X, Music, Clock, Users, User } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const Events: React.FC = () => {
  const { userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<HSEvent[]>([]);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
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
    contratanteId: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({ ...prev, contratanteId: userProfile.uid }));
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
        
        // RBAC: Filtro de visibilidade
        if (userProfile.role === UserRole.ADMIN) {
          q = query(eventsRef, orderBy('createdAt', 'desc'));
        } else if (userProfile.role === UserRole.CONTRATANTE) {
          // Para contratante, priorizamos o filtro de ID para garantir que ele veja seus shows
          q = query(eventsRef, where('contratanteId', '==', userProfile.uid));
        } else {
          q = query(eventsRef, where('integrantesIds', 'array-contains', userProfile.uid));
        }

        const querySnapshot = await getDocs(q);
        let fetchedEvents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HSEvent));
        
        // Ordenação manual para evitar erro de índice no Firestore caso não esteja configurado
        if (userProfile.role !== UserRole.ADMIN) {
          fetchedEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        setEvents(fetchedEvents);

        if (userProfile.role === UserRole.ADMIN) {
          const usersRef = collection(db, 'users');
          const clientsSnap = await getDocs(query(usersRef, where('role', '==', UserRole.CONTRATANTE)));
          setClients(clientsSnap.docs.map(doc => doc.data() as UserProfile));
        }
      } catch (err) {
        console.error("Fetch events error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || userProfile.role === UserRole.INTEGRANTE) return;
    
    setIsSubmitting(true);
    try {
      const finalContratanteId = userProfile.role === UserRole.ADMIN ? formData.contratanteId : userProfile.uid;

      const newEvent: Omit<HSEvent, 'id'> = {
        ...formData,
        contratanteId: finalContratanteId,
        createdAt: new Date().toISOString(),
        status: EventStatus.SOLICITADO,
        integrantesIds: [],
        confirmedIntegrantes: [],
        payments: []
      };
      
      const docRef = await addDoc(collection(db, 'events'), newEvent);
      setEvents([{ id: docRef.id, ...newEvent } as HSEvent, ...events]);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Add event error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Agenda de Shows</h1>
          <p className="text-slate-500 font-bold mt-1">
            {userProfile?.role === UserRole.CONTRATANTE ? 'Gerencie suas solicitações e contratos.' : 'Gestão completa da agenda e logística.'}
          </p>
        </div>
        
        {userProfile?.role !== UserRole.INTEGRANTE && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/30 active:scale-95">
            <Plus size={20} />
            <span>Novo Show</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-blue-500" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map(event => (
            <div key={event.id} className="group bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden hover:border-blue-500/30 transition-all duration-300 flex flex-col shadow-2xl">
              <div className="p-7 border-b border-slate-800/50 flex justify-between items-center bg-slate-950/20">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{event.status}</span>
                <div className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{event.tipo}</div>
              </div>
              <div className="p-8 flex-1 space-y-6">
                <div>
                  <h3 className="font-black text-2xl text-white group-hover:text-blue-400 transition-colors tracking-tighter line-clamp-1">{event.titulo}</h3>
                  <div className="flex items-center text-xs text-blue-500 font-black uppercase tracking-widest mt-2">
                    <Clock size={12} className="mr-1.5" /> {event.duracao}h de Show
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center text-sm font-black text-slate-400 uppercase tracking-widest">
                    <Calendar size={18} className="mr-3 text-blue-500/70" />
                    {event.dataEvento ? new Date(event.dataEvento).toLocaleDateString('pt-BR') : 'Data a definir'}
                  </div>
                  <div className="flex items-center text-sm font-bold text-slate-400">
                    <MapPin size={18} className="mr-3 text-blue-500/70" />
                    {event.local}
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-950/60 flex items-center justify-between border-t border-slate-800/50">
                <Link to={`/events/${event.id}`} className="w-full justify-center px-6 py-2.5 bg-slate-800 rounded-xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center">
                  VER DETALHES <ArrowRight size={14} className="ml-2" />
                </Link>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="col-span-full py-32 text-center bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-900">
              <Music size={64} className="mx-auto text-slate-800 mb-6" />
              <h3 className="text-2xl font-black text-white">Nenhum evento encontrado</h3>
            </div>
          )}
        </div>
      )}

      {/* Modal Show */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-slate-900 rounded-[3rem] w-full max-w-4xl shadow-2xl border border-white/5 overflow-hidden my-auto animate-fade-in">
            <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 sticky top-0 z-10">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Nova Solicitação</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 max-h-[75vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  {userProfile?.role === UserRole.ADMIN && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-2">Contratante</label>
                      <select required value={formData.contratanteId} onChange={e => setFormData({...formData, contratanteId: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold appearance-none outline-none">
                        <option value="">Selecione...</option>
                        {clients.map(c => <option key={c.uid} value={c.uid}>{c.displayName}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Título</label>
                    <input required value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Tipo</label>
                      <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value as ShowType})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none">
                        <option value="Casamento">Casamento</option>
                        <option value="Aniversário">Aniversário</option>
                        <option value="Formatura">Formatura</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Duração (h)</label>
                      <input type="number" step="0.5" value={formData.duracao} onChange={e => setFormData({...formData, duracao: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Local</label>
                    <input required value={formData.local} onChange={e => setFormData({...formData, local: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Público</label>
                    <input type="number" value={formData.publicoEstimado} onChange={e => setFormData({...formData, publicoEstimado: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Data</label><input type="date" required value={formData.dataEvento} onChange={e => setFormData({...formData, dataEvento: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Hora</label><input type="time" required value={formData.horaEvento} onChange={e => setFormData({...formData, horaEvento: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none" /></div>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full mt-10 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:bg-blue-500 shadow-2xl transition-all">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Solicitar Orçamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
