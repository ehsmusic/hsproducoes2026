
import React, { useState, useEffect } from 'react';
import { HSEvent } from '../types';
import { Calendar, Clock, Users, MapPin, Utensils, Sparkles, AlignLeft, Briefcase } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Props {
  event: HSEvent;
}

const EventInfoWidget: React.FC<Props> = ({ event }) => {
  const [contratanteNome, setContratanteNome] = useState<string>('Carregando...');

  useEffect(() => {
    const fetchContratante = async () => {
      if (!event.contratanteId) {
        setContratanteNome('Não informado');
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, 'users', event.contratanteId));
        if (docSnap.exists()) {
          setContratanteNome(docSnap.data().displayName);
        } else {
          setContratanteNome('Não encontrado');
        }
      } catch (err) {
        setContratanteNome('Erro ao carregar');
      }
    };
    fetchContratante();
  }, [event.contratanteId]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 shadow-2xl">
         <div className="space-y-8">
            <div className="flex items-start space-x-5">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><Calendar size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Data e Hora</p>
                <p className="text-xl font-black text-white">{event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR') : '--'} às {event.horaEvento || '--:--'}h</p>
              </div>
            </div>
            <div className="flex items-start space-x-5">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><Clock size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Duração do Show</p>
                <p className="text-xl font-black text-white">{event.duracao} Horas</p>
              </div>
            </div>
            <div className="flex items-start space-x-5">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><Users size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Público Estimado</p>
                <p className="text-xl font-black text-white">{event.publicoEstimado || 0} Pessoas</p>
              </div>
            </div>
         </div>

         <div className="space-y-8">
            <div className="flex items-start space-x-5">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><Briefcase size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Contratante</p>
                <p className="text-xl font-black text-white">{contratanteNome}</p>
              </div>
            </div>
            <div className="flex items-start space-x-5">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><MapPin size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Local do Evento</p>
                <p className="text-xl font-black text-white">{event.local}</p>
                <p className="text-xs text-slate-500 font-bold mt-1">{event.enderecoEvento}</p>
              </div>
            </div>
            <div className="flex items-start space-x-5">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><Utensils size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Logística Inclusa</p>
                <div className="flex gap-2 mt-2">
                   <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${event.somContratado ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>Som: {event.somContratado ? 'Sim' : 'Não'}</span>
                   <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${event.alimentacaoInclusa ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>Refeição: {event.alimentacaoInclusa ? 'Sim' : 'Não'}</span>
                </div>
              </div>
            </div>
         </div>
      </div>

      {event.tipo === 'Casamento' && (event.cerimonialista || event.localCerimonia) && (
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 space-y-8 shadow-2xl">
           <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest flex items-center"><Sparkles size={18} className="mr-3" /> Detalhes da Cerimônia</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cerimonialista / Equipe</p>
                <p className="text-lg font-black text-white">{event.cerimonialista || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Local da Cerimônia</p>
                <p className="text-lg font-black text-white">{event.localCerimonia || 'Mesmo local do show'}</p>
              </div>
           </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 space-y-6 shadow-2xl">
         <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center"><AlignLeft size={18} className="mr-3" /> Observações e Briefing</h3>
         <div className="bg-slate-950/40 p-8 rounded-3xl border border-slate-800 shadow-inner">
            <p className="text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
              {event.observacoes || 'Nenhuma observação adicional registrada para este evento.'}
            </p>
         </div>
      </div>
    </div>
  );
};

export default EventInfoWidget;
