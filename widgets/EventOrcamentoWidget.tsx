
import React from 'react';
import { HSEvent, HSEventFinance, EventStatus } from '../types';
import { Star, Users, Sparkles, Box, CheckCircle2, Instagram, Globe, Mail, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Props {
  event: HSEvent;
  financeDoc: HSEventFinance | null;
  orcMusicos: string[];
  orcBailarinas: number;
  orcEquipamentos: string[];
  isContratante: boolean;
  handleUpdateStatus: (s: EventStatus) => void;
}

const EventOrcamentoWidget: React.FC<Props> = ({ 
  event, financeDoc, orcMusicos, orcBailarinas, orcEquipamentos, isContratante, handleUpdateStatus 
}) => (
  <div className="animate-fade-in bg-slate-900 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl pb-20">
    <div className="w-full h-80 relative">
      <img src="https://i.ibb.co/67C8hq4M/banner.png" className="w-full h-full object-cover" alt="Helder Santos Banner" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
    </div>

    <div className="px-10 -mt-10 relative z-10 space-y-16">
      <div className="space-y-6 text-center md:text-left">
         <div className="flex items-center justify-center md:justify-start space-x-3 text-blue-500">
            <Star size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Proposta de Show</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight">Helder Santos</h2>
          <p className="text-slate-400 font-medium leading-relaxed text-lg italic bg-slate-950/40 p-8 rounded-[2rem] border border-slate-800/50">"Helder Santos é sinônimo de carisma e energia, moldando cada apresentação para ser um momento único."</p>
      </div>
      
      <div className="space-y-10">
         <h3 className="text-2xl font-black text-white uppercase tracking-tighter border-b border-slate-800 pb-6">Detalhes da Proposta</h3>
         <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-1"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Show</p><p className="text-xl font-black text-white">{event.titulo}</p></div>
            <div className="space-y-1"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Data</p><p className="text-xl font-black text-white">{event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR') : '--'}</p></div>
            <div className="space-y-1"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Duração</p><p className="text-xl font-black text-white">{event.duracao}h</p></div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800 space-y-8">
               <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] flex items-center"><Users size={16} className="mr-3" /> Staff e Elenco</h4>
               <div className="space-y-6">
                  {orcMusicos.length > 0 && (
                    <div className="flex flex-wrap gap-2">{orcMusicos.map((m, i) => <span key={i} className="text-xs font-bold text-white bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">{m}</span>)}</div>
                  )}
                  {orcBailarinas > 0 && (
                    <div className="p-5 bg-blue-600/5 border border-blue-500/10 rounded-[2rem] flex items-center space-x-4">
                       <Sparkles className="text-blue-500" size={20} />
                       <p className="text-xs font-bold text-slate-300">Presença de {orcBailarinas} bailarinas confirmadas.</p>
                    </div>
                  )}
               </div>
            </div>
            <div className="bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800 space-y-8">
               <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] flex items-center"><Box size={16} className="mr-3" /> Infraestrutura</h4>
               <div className="space-y-1">{orcEquipamentos.length > 0 ? orcEquipamentos.map((e, i) => <div key={i} className="flex items-center text-xs font-bold text-slate-300 mb-2"><CheckCircle2 size={12} className="mr-2 text-emerald-500" /> {e}</div>) : <p className="text-[10px] text-slate-500 italic">Estrutura técnica Helder Santos inclusa.</p>}</div>
            </div>
         </div>

         <div className="relative pt-10">
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-14 rounded-[4rem] text-center space-y-4 shadow-2xl">
              <p className="text-xs font-black text-blue-500 uppercase tracking-[0.5em]">Investimento Total</p>
              <p className="text-7xl md:text-8xl font-black text-white tracking-tighter">
                <span className="text-3xl md:text-4xl align-top mr-2 text-blue-500/50">R$</span>
                {financeDoc?.valorEvento.toLocaleString('pt-BR') || '0,00'}
              </p>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pt-4">Proposta Válida por 15 dias</span>
            </div>
         </div>
      </div>

      <div className="space-y-16 pt-10 border-t border-slate-800">
         <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.5em] text-center">Contatos Oficiais HS</h3>
         <div className="max-w-xl mx-auto space-y-8 px-6">
            <div className="flex items-center space-x-6"><div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-xl"><Instagram size={24} /></div><div className="flex-1"><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Instagram</p><p className="text-xl font-black text-white">@heldersantoscantor</p></div></div>
            <div className="flex items-center space-x-6"><div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-xl"><Globe size={24} /></div><div className="flex-1"><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Website</p><p className="text-xl font-black text-white">heldersantosoficial.com.br</p></div></div>
            <div className="flex items-center space-x-6"><div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-xl"><Mail size={24} /></div><div className="flex-1"><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">E-mail Comercial</p><p className="text-lg md:text-xl font-black text-white">contato@heldersantosoficial.com.br</p></div></div>
         </div>
         {event.status === EventStatus.ORCAMENTO_GERADO && isContratante && (
           <div className="flex flex-col md:flex-row gap-6 justify-center pt-10 px-6">
             <button onClick={() => handleUpdateStatus(EventStatus.ACEITO)} className="flex-1 max-w-xs py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 shadow-2xl transition-all active:scale-95"><ThumbsUp size={28} className="inline mr-2" /> Aceitar</button>
             <button onClick={() => handleUpdateStatus(EventStatus.RECUSADO)} className="flex-1 max-w-xs py-6 bg-slate-800 text-slate-400 rounded-[2.5rem] font-black text-xl hover:text-white border border-slate-700 transition-all active:scale-95"><ThumbsDown size={28} className="inline mr-2" /> Recusar</button>
           </div>
         )}
      </div>
    </div>
  </div>
);

export default EventOrcamentoWidget;
