
import React, { useState, useEffect } from 'react';
import { HSEvent } from '../types';
import { Calendar, Clock, Users, MapPin, Utensils, Sparkles, AlignLeft, Briefcase, FileText, Download, ShieldCheck } from 'lucide-react';
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
    <div className="space-y-10 animate-fade-in">
      {/* Bloco de Ação de Contrato - Premium Clean Style */}
      {event.contractUrl && (
        <div className="bg-white border border-emerald-100 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.1)] animate-fade-in relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-1000"></div>
          
          <div className="flex items-center space-x-6 text-center md:text-left relative z-10">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
              <FileText size={32} />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start space-x-2 text-emerald-600 mb-1">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Documento Formalizado</span>
              </div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Contrato Disponível</h4>
            </div>
          </div>
          
          <a 
            href={event.contractUrl} 
            target="_blank" 
            rel="noreferrer"
            className="w-full md:w-auto flex items-center justify-center space-x-4 px-12 py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-emerald-500/20 active:scale-95"
          >
            <Download size={20} />
            <span>Baixar PDF Oficial</span>
          </a>
        </div>
      )}

      {/* Grid de Informações Básicas - Premium White Card */}
      <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)]">
         <div className="space-y-10">
            <div className="flex items-start space-x-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0 shadow-sm"><Calendar size={26} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data e Horário</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                  {event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR') : '--'}
                  <span className="text-slate-300 mx-2">/</span>
                  <span className="text-blue-600">{event.horaEvento || '--:--'}h</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0 shadow-sm"><Clock size={26} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duração do Espetáculo</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{event.duracao} <span className="text-slate-400 text-lg uppercase ml-1">Horas</span></p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0 shadow-sm"><Users size={26} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Público Estimado</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{event.publicoEstimado || 0} <span className="text-slate-400 text-lg uppercase ml-1">Convidados</span></p>
              </div>
            </div>
         </div>

         <div className="space-y-10">
            <div className="flex items-start space-x-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0 shadow-sm"><Briefcase size={26} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contratante / Responsável</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{contratanteNome}</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0 shadow-sm"><MapPin size={26} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Localização do Evento</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{event.local}</p>
                <p className="text-xs text-slate-500 font-bold mt-2 leading-relaxed">{event.enderecoEvento}</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0 shadow-sm"><Utensils size={26} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Logística & Serviços</p>
                <div className="flex flex-wrap gap-3">
                   <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${event.somContratado ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                     Som: {event.somContratado ? 'Incluso' : 'N/A'}
                   </span>
                   <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${event.alimentacaoInclusa ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                     Refeição: {event.alimentacaoInclusa ? 'Incluso' : 'N/A'}
                   </span>
                </div>
              </div>
            </div>
         </div>
      </div>

      {/* Cerimonial - Destaque em tom azul suave */}
      {event.tipo === 'Casamento' && (event.cerimonialista || event.localCerimonia) && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-[3rem] p-8 md:p-12 space-y-8 animate-fade-in">
           <div className="flex items-center space-x-3 text-blue-600 border-b border-blue-100 pb-6">
              <Sparkles size={20} />
              <h3 className="text-xs font-black uppercase tracking-[0.3em]">Protocolos de Cerimônia</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Equipe de Assessoria</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{event.cerimonialista || 'Não informado'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Endereço da Cerimônia</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{event.localCerimonia || 'Mesmo local da recepção'}</p>
              </div>
           </div>
        </div>
      )}

      {/* Observações e Briefing - Estilo Clean Text Area */}
      <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 space-y-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)]">
         <div className="flex items-center space-x-3 text-slate-900 border-b border-slate-50 pb-6">
            <AlignLeft size={20} className="text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-[0.3em]">Briefing & Notas Técnicas</h3>
         </div>
         <div className="bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100">
            <p className="text-slate-600 font-medium leading-relaxed text-lg whitespace-pre-wrap">
              {event.observacoes || 'Nenhuma instrução adicional foi registrada para esta apresentação artística.'}
            </p>
         </div>
      </div>
    </div>
  );
};

export default EventInfoWidget;
