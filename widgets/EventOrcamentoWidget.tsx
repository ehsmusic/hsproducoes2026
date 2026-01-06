
import React from 'react';
import { HSEvent, HSEventFinance, EventStatus } from '../types';
import { 
  Star, Users, Sparkles, Box, CheckCircle2, Instagram, 
  Globe, Mail, ThumbsUp, ThumbsDown, Music, 
  Mic2, Radio, Zap, Guitar, Trophy, Heart
} from 'lucide-react';

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
  <div className="animate-fade-in bg-slate-900 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl pb-24">
    {/* BANNER PREMIUM */}
    <div className="w-full h-96 relative">
      <img 
        src="https://i.ibb.co/67C8hq4M/banner.png" 
        className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-1000" 
        alt="Helder Santos Live" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
      <div className="absolute bottom-12 left-12">
        <div className="flex items-center space-x-3 text-blue-400 mb-3">
          <Sparkles size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Proposta Artística</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">Helder Santos</h2>
      </div>
    </div>

    <div className="px-8 md:px-14 -mt-6 relative z-10 space-y-20">
      
      {/* SEÇÃO 1: BIOGRAFIA REAL */}
      <section className="space-y-8">
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
            <Mic2 size={20} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Trajetória</h3>
        </div>
        <div className="bg-slate-950/40 p-10 rounded-[2.5rem] border border-slate-800/50 relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Trophy size={80} />
          </div>
          <div className="space-y-6 text-slate-300 font-medium leading-[1.8] text-lg">
            <p>
              Nascido e criado em <span className="text-white font-black">Lençóis Paulista</span>, Helder Santos iniciou sua carreira musical aos 13 anos, tocando violão e cantando no coral da igreja. Em 2010, formou uma dupla sertaneja com sua irmã, gravando um CD autoral com 12 faixas.
            </p>
            <p>
              Desde 2020 em <span className="text-blue-400 font-black italic">carreira solo</span>, Helder vem conquistando o público com seu carisma e um repertório extremamente animado. Em 2023, o reconhecimento veio com o prêmio <span className="text-amber-500 font-black">"Melhores do Ano"</span> e um momento histórico: dividiu o palco da Facilpa com <span className="text-white font-black">Jorge & Mateus</span>.
            </p>
            <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-2xl flex items-center space-x-4 mt-4">
               <Radio className="text-blue-400" size={24} />
               <p className="text-sm font-bold text-blue-100 italic">
                 Ouça o novo álbum <span className="font-black">"Tá Acontecendo"</span> em todas as plataformas digitais!
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: REPERTÓRIO ECLÉTICO */}
      <section className="space-y-8">
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-500">
            <Music size={20} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Show Eclético</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Sertanejo', icon: Guitar, color: 'text-blue-400', desc: 'Carro-chefe' },
            { label: 'Samba & Pagode', icon: Heart, color: 'text-red-400', desc: 'Roda de Samba' },
            { label: 'Axé & Piseiro', icon: Zap, color: 'text-amber-400', desc: 'Energia Total' },
            { label: 'Xote & Rock', icon: Star, color: 'text-purple-400', desc: 'Nacional' },
          ].map((item, i) => (
            <div key={i} className="bg-slate-950/20 border border-slate-800 p-6 rounded-3xl text-center space-y-3 hover:border-blue-500/30 transition-all">
              <div className={`mx-auto w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center ${item.color}`}>
                <item.icon size={24} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{item.label}</h4>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* SEÇÃO 3: INFRAESTRUTURA */}
      <section className="space-y-10">
         <h3 className="text-2xl font-black text-white uppercase tracking-tighter border-b border-slate-800 pb-6">Estrutura da Proposta</h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800 space-y-8">
               <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] flex items-center"><Users size={16} className="mr-3" /> Formação</h4>
               <div className="space-y-6">
                  {orcMusicos.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {orcMusicos.map((m, i) => (
                        <span key={i} className="text-[10px] font-black text-white bg-slate-900 px-5 py-3 rounded-2xl border border-slate-800 uppercase tracking-widest shadow-xl">
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic">Formação completa Helder Santos (Músicos de elite).</p>
                  )}
                  {orcBailarinas > 0 && (
                    <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-2xl flex items-center space-x-4">
                       <Sparkles className="text-blue-400" size={20} />
                       <p className="text-xs font-black text-blue-300 uppercase tracking-widest">Ballet: {orcBailarinas} Bailarinas</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800 space-y-8">
               <h4 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center"><Box size={16} className="mr-3" /> Produção Técnica</h4>
               <div className="space-y-4">
                 {orcEquipamentos.length > 0 ? orcEquipamentos.map((e, i) => (
                   <div key={i} className="flex items-center text-xs font-bold text-slate-300">
                     <CheckCircle2 size={14} className="mr-3 text-emerald-500" /> {e}
                   </div>
                 )) : (
                   <div className="p-6 bg-emerald-600/5 border border-emerald-500/10 rounded-2xl">
                     <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Sonorização HS Oficial</p>
                     <p className="text-[10px] text-slate-600 mt-2 font-bold leading-relaxed">Infraestrutura dimensionada para {event.publicoEstimado} pessoas.</p>
                   </div>
                 )}
               </div>
            </div>
         </div>

         {/* INVESTIMENTO */}
         <div className="relative pt-10">
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-14 rounded-[4rem] text-center space-y-6 shadow-2xl">
              <p className="text-xs font-black text-blue-500 uppercase tracking-[0.6em]">Investimento do Evento</p>
              <div className="flex flex-col items-center">
                <p className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-none">
                  <span className="text-3xl md:text-4xl align-top mr-2 text-blue-500/30">R$</span>
                  {financeDoc?.valorEvento.toLocaleString('pt-BR') || '0,00'}
                </p>
                <div className="mt-8 px-6 py-2 bg-slate-800 border border-slate-700 rounded-full inline-block">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Válido por 15 dias</span>
                </div>
              </div>
            </div>
         </div>
      </section>

      {/* RODAPÉ E CONTATO */}
      <section className="space-y-16 pt-20 border-t border-slate-800 text-center">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { label: 'Instagram', value: '@heldersantoscantor', icon: Instagram },
              { label: 'Website', value: 'heldersantos.com.br', icon: Globe },
              { label: 'Contato', value: 'contato@heldersantos.com.br', icon: Mail },
            ].map((contact, i) => (
              <div key={i} className="flex flex-col items-center space-y-4">
                <div className="w-14 h-14 rounded-[1.5rem] bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-500 shadow-xl">
                  <contact.icon size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{contact.label}</p>
                  <p className="text-sm font-black text-white">{contact.value}</p>
                </div>
              </div>
            ))}
         </div>

         {event.status === EventStatus.ORCAMENTO_GERADO && isContratante && (
           <div className="flex flex-col md:flex-row gap-6 justify-center pt-10 px-6">
             <button 
               onClick={() => handleUpdateStatus(EventStatus.ACEITO)} 
               className="flex-1 max-w-xs py-7 bg-emerald-600 text-white rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.5)] transition-all active:scale-95"
             >
               <ThumbsUp size={28} className="inline mr-3" /> Aceitar Orçamento
             </button>
             <button 
               onClick={() => handleUpdateStatus(EventStatus.RECUSADO)} 
               className="flex-1 max-w-xs py-7 bg-slate-800 text-slate-400 rounded-[2.5rem] font-black text-xl hover:text-white border border-slate-700 transition-all active:scale-95"
             >
               <ThumbsDown size={28} className="inline mr-3" /> Recusar
             </button>
           </div>
         )}
      </section>
    </div>
  </div>
);

export default EventOrcamentoWidget;
