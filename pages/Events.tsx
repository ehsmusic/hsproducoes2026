
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { HSEvent, EventStatus, UserRole, ShowType, UserProfile } from '../types';
import { Plus, Calendar, MapPin, ArrowRight, X, Music, Clock, Loader2 } from 'lucide-react';
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
    observacoes: '',
    contratanteId: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({ ...prev, contratanteId: userProfile.role === UserRole.CONTRATANTE ? userProfile.uid : '' }));
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
        setEvents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HSEvent)));

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
        ...formData,
        createdAt: new Date().toISOString(),
        status: EventStatus.SOLICITADO,
        integrantesIds: [],
        confirmedIntegrantes: [],
        payments: []
      };
      const docRef = await addDoc(collection(db, 'events'), newEvent);
      setEvents([{ id: docRef.id, ...newEvent } as HSEvent, ...events]);
      setIsModalOpen(false);
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-8 animate-fade-in relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div><h1 className="text-4xl font-black text-white tracking-tighter">Agenda de Shows</h1><p className="text-slate-500 font-bold mt-1">Gestão completa da agenda e logística.</p></div>
        {userProfile?.role !== UserRole.INTEGRANTE && <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black hover:bg-blue-500 shadow-xl transition-all active:scale-95"><Plus size={20} /><span>Novo Show</span></button>}
      </div>

      {loading ? <div className="flex justify-center py-24"><div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map(event => (
            <div key={event.id} className="group bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden hover:border-blue-500/30 transition-all shadow-2xl flex flex-col">
              <div className="p-7 border-b border-slate-800/50 flex justify-between items-center bg-slate-950/20"><span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{event.status}</span><div className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{event.tipo}</div></div>
              <div className="p-8 flex-1 space-y-6">
                <div><h3 className="font-black text-2xl text-white tracking-tighter line-clamp-1">{event.titulo}</h3><div className="flex items-center text-xs text-blue-500 font-black uppercase mt-2"><Clock size={12} className="mr-1.5" /> {event.duracao}h de Show</div></div>
                <div className="space-y-4"><div className="flex items-center text-sm font-black text-slate-400 uppercase tracking-widest"><Calendar size={18} className="mr-3 text-blue-500/70" />{event.dataEvento || 'Data a definir'}</div><div className="flex items-center text-sm font-bold text-slate-400"><MapPin size={18} className="mr-3 text-blue-500/70" />{event.local}</div></div>
              </div>
              <div className="px-8 py-6 bg-slate-950/60 border-t border-slate-800/50"><Link to={`/events/${event.id}`} className="w-full justify-center px-6 py-2.5 bg-slate-800 rounded-xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center">VER DETALHES <ArrowRight size={14} className="ml-2" /></Link></div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
        <div className="relative bg-slate-900 rounded-[3rem] w-full max-w-4xl shadow-2xl border border-white/5 overflow-hidden animate-fade-in my-auto max-h-[90vh] overflow-y-auto scrollbar-hide">
          <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 sticky top-0 z-10"><h2 className="text-3xl font-black text-white uppercase tracking-tighter">Nova Solicitação</h2><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button></div>
          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                {userProfile?.role === UserRole.ADMIN && (
                  <div className="space-y-2"><label className="text-[10px] font-black text-amber-500 uppercase ml-2">Contratante</label><select required value={formData.contratanteId} onChange={e => setFormData({...formData, contratanteId: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none"><option value="">Selecione...</option>{clients.map(c => <option key={c.uid} value={c.uid}>{c.displayName}</option>)}</select></div>
                )}
                <div className="space-y-2"><label className="text-[10px] font-black text-blue-500 uppercase ml-2">Título</label><input required value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none" /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Duração (h)</label><input type="number" step="0.5" value={formData.duracao} onChange={e => setFormData({...formData, duracao: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Data</label><input type="date" required value={formData.dataEvento} onChange={e => setFormData({...formData, dataEvento: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none" /></div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-blue-500 uppercase ml-2">Local</label><input required value={formData.local} onChange={e => setFormData({...formData, local: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Observações</label><textarea rows={4} value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none resize-none" /></div>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:bg-blue-500 shadow-2xl transition-all">{isSubmitting ? 'Processando...' : 'Solicitar Orçamento'}</button>
          </form>
        </div></div>
      )}
    </div>
  );
};

export default Events;
