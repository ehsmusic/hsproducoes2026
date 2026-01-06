
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { HSEvent, HSEventContratacao } from '../types';
import { CheckCircle2, Calendar, MapPin, Loader2, Music, Sparkles, ChevronRight, Info, Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Confirmacoes: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<{ event: HSEvent; contratacao: HSEventContratacao }[]>([]);

  useEffect(() => {
    if (!userProfile) return;

    // Busca as contratações filtrando pelo ID do integrante logado
    const q = query(collection(db, 'contratacao'), where('integranteId', '==', userProfile.uid));
    
    const unsub = onSnapshot(q, async (snapshot: any) => {
      const contData = snapshot.docs.map((d: any) => ({ ...d.data(), id: d.id } as HSEventContratacao));
      
      const eventsRef = collection(db, 'events');
      const eventSnap = await getDocs(eventsRef);
      const eventsMap = new Map<string, HSEvent>();
      
      eventSnap.docs.forEach(d => {
        const data = d.data();
        eventsMap.set(d.id, { ...data, id: d.id } as HSEvent);
      });

      const joined = contData.map((c: HSEventContratacao) => ({
        contratacao: c,
        event: eventsMap.get(c.showId) as HSEvent
      })).filter((item: { event: HSEvent; contratacao: HSEventContratacao }) => item.event !== undefined);

      // Ordenar por data (mais próximos primeiro)
      joined.sort((a: { event: HSEvent; contratacao: HSEventContratacao }, b: { event: HSEvent; contratacao: HSEventContratacao }) => 
        new Date(a.event.dataEvento).getTime() - new Date(b.event.dataEvento).getTime()
      );
      
      setItems(joined);
      setLoading(false);
    });

    return () => unsub();
  }, [userProfile]);

  const toggleConfirm = async (contId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'contratacao', contId), {
        confirmacao: !currentStatus
      });
    } catch (err) {
      console.error("Erro ao confirmar presença:", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <Loader2 className="animate-spin text-blue-500" size={48} />
      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando Escala...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div>
        <div className="flex items-center space-x-3 text-blue-500 mb-2">
          <CheckCircle2 size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Gestão de Presença</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter">Minhas Confirmações</h1>
        <p className="text-slate-500 font-bold mt-1">Confirme sua participação nos próximos eventos da banda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {items.length > 0 ? items.map(({ event, contratacao }) => (
          <div key={contratacao.id} className={`group bg-slate-900 border ${contratacao.confirmacao ? 'border-emerald-500/20' : 'border-slate-800'} rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[350px]`}>
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Music size={120} className="text-blue-500" />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">{event.tipo}</span>
                  <h3 className="text-2xl font-black text-white tracking-tighter mt-2">{event.titulo}</h3>
                </div>
                <div className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                  contratacao.confirmacao 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {contratacao.confirmacao ? 'Confirmado' : 'Pendente'}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm font-bold text-slate-300">
                  <Calendar size={16} className="mr-3 text-blue-500" /> {new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR')} às {event.horaEvento}h
                </div>
                <div className="flex items-start text-sm font-bold text-slate-300">
                  <MapPin size={16} className="mr-3 text-blue-500 mt-0.5 flex-shrink-0" /> 
                  <div className="min-w-0">
                    <p className="truncate">{event.local}</p>
                    <div className="flex items-center mt-1 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                       <MapIcon size={10} className="mr-1.5" /> {event.enderecoEvento || 'Endereço não informado'}
                    </div>
                  </div>
                </div>
              </div>

              {contratacao.note && (
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 mb-8">
                  <div className="flex items-center space-x-2 text-blue-400 mb-1.5">
                    <Info size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Nota da Produção</span>
                  </div>
                  <p className="text-xs text-slate-400 italic leading-relaxed">"{contratacao.note}"</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-800/50 relative z-10 mt-auto">
              <button 
                onClick={() => toggleConfirm(contratacao.id!, contratacao.confirmacao)}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  contratacao.confirmacao 
                  ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xl shadow-emerald-900/20'
                }`}
              >
                {contratacao.confirmacao ? 'Desmarcar Presença' : 'Confirmar Presença'}
              </button>
              <Link 
                to={`/events/${event.id}`}
                className="p-4 bg-slate-800 text-white rounded-2xl hover:bg-blue-600 transition-all active:scale-90"
              >
                <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 bg-slate-900/20 border-2 border-dashed border-slate-900 rounded-[3rem] px-6 text-center">
             <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-800 border border-slate-800">
                <Sparkles size={32} />
             </div>
             <div className="space-y-2">
                <p className="text-white font-black uppercase tracking-widest text-sm">Nada por aqui ainda.</p>
                <p className="text-slate-600 font-bold text-xs max-w-xs mx-auto">Quando você for escalado para um novo show pela HS Produções, ele aparecerá aqui para sua confirmação.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Confirmacoes;
