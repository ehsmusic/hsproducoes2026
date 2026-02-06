
import React from 'react';
import { HSEvent, HSEventFinance, EventStatus } from '../types';
// Adicionado DollarSign para corrigir erro de referência
import { 
  Star, Users, Sparkles, Box, CheckCircle2, Instagram, 
  Globe, Mail, ThumbsUp, ThumbsDown, Music, 
  Mic2, Radio, Zap, Guitar, Trophy, Heart, DollarSign
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
  <div className="animate-fade-in bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] pb-24">
    {/* BANNER PREMIUM - LIGHT GRADIENT OVERLAY */}
    <div className="w-full h-[30rem] relative">
      <img 
        src="https://i.ibb.co/67C8hq4M/banner.png" 
        className="w-full h-full object-cover transition-all duration-1000" 
        alt="Helder Santos Live" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
      <div className="absolute bottom-16 left-8 md:left-16">
        <div className="flex items-center space-x-3 text-blue-600 mb-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full w-fit shadow-sm border border-white">
          <Sparkles size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Proposta Artística Exclusiva</span>
        </div>
        <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">Helder Santos</h2>
      </div>
    </div>

    <div className="px-8 md:px-20 -mt-8 relative z-10 space-y-24">
      
      {/* SEÇÃO 1: BIOGRAFIA */}
      <section className="space-y-10">
        <div className="flex items-center space-x-4 border-b border-slate-50 pb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
            <Mic2 size={22} />
          </div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Trajetória Artística</h3>
        </div>
        <div className="bg-slate-50/50 p-10 md:p-16 rounded-[3rem] border border-slate-100 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000 text-blue-600">
            <Trophy size={120} />
          </div>
          <div className="relative z-10 space-y-8 text-slate-600 font-medium leading-[1.8] text-xl">
            <p>
              Nascido e criado em <span className="text-slate-900 font-black">Lençóis Paulista</span>, Helder Santos iniciou sua carreira musical aos 13 anos. Desde 2020 em <span className="text-blue-600 font-black italic">carreira solo</span>, Helder vem conquistando o público com carisma e um repertório vibrante.
            </p>
            <p>
              Em 2023, o reconhecimento veio com o prêmio <span className="text-amber-600 font-black italic">"Melhores do Ano"</span> e um momento histórico: dividiu o palco da Facilpa com <span className="text-slate-900 font-black">Jorge & Mateus</span> para milhares de pessoas.
            </p>
            <div className="p-8 bg-white border border-blue-100 rounded-[2rem] flex items-center space-x-6 mt-6 shadow-sm">
               <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                 <Radio size={24} />
               </div>
               <p className="text-sm font-bold text-slate-700 italic leading-relaxed">
                 Ouça o novo álbum <span className="text-blue-600 font-black uppercase tracking-widest text-[10px] ml-1">"Tá Acontecendo"</span> em todas as plataformas!
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: REPERTÓRIO */}
      <section className="space-y-10">
        <div className="flex items-center space-x-4 border-b border-slate-50 pb-8">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
            <Music size={22} />
          </div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Show & Performance</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Sertanejo', icon: Guitar, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Carro-chefe' },
            { label: 'Samba & Pagode', icon: Heart, color: 'text-red-600', bg: 'bg-red-50', desc: 'Roda de Samba' },
            { label: 'Axé & Piseiro', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Energia Total' },
            { label: 'Xote & Rock', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Mix Nacional' },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] text-center space-y-4 hover:border-blue-500/20 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className={`mx-auto w-16 h-16 rounded-[1.25rem] ${item.bg} border border-slate-50 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon size={32} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{item.label}</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* SEÇÃO 3: ESTRUTURA */}
      <section className="space-y-12">
         <div className="flex items-center justify-between border-b border-slate-50 pb-8">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Configuração da Proposta</h3>
           <div className="px-4 py-1.5 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">Premium Setup</div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-slate-50/50 p-12 rounded-[3rem] border border-slate-100 space-y-10 shadow-sm">
               <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] flex items-center"><Users size={16} className="mr-3" /> Elenco Escala Técnica</h4>
               <div className="space-y-6">
                  {orcMusicos.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {orcMusicos.map((m, i) => (
                        <span key={i} className="text-[9px] font-black text-slate-700 bg-white px-5 py-3 rounded-2xl border border-slate-100 uppercase tracking-widest shadow-sm">
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Formação completa Helder Santos • Músicos de elite.</p>
                  )}
                  {orcBailarinas > 0 && (
                    <div className="p-6 bg-white border border-blue-100 rounded-[1.5rem] flex items-center space-x-4 shadow-sm">
                       <Sparkles className="text-blue-500" size={20} />
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Ballet: {orcBailarinas} Bailarinas Profissionais</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="bg-slate-50/50 p-12 rounded-[3rem] border border-slate-100 space-y-10 shadow-sm">
               <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] flex items-center"><Box size={16} className="mr-3" /> Rider de Equipamentos</h4>
               <div className="space-y-5">
                 {orcEquipamentos.length > 0 ? orcEquipamentos.map((e, i) => (
                   <div key={i} className="flex items-center text-xs font-bold text-slate-600">
                     <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center mr-3 text-emerald-500">
                        <CheckCircle2 size={14} />
                     </div>
                     {e}
                   </div>
                 )) : (
                   <div className="p-8 bg-white border border-emerald-100 rounded-[1.5rem] shadow-sm">
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sonorização HS Profissional</p>
                     <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed">Dimensionamento técnico para audiência de {event.publicoEstimado} pessoas.</p>
                   </div>
                 )}
               </div>
            </div>
         </div>

         {/* INVESTIMENTO - PREMIUM CARD */}
         <div className="relative pt-12">
            <div className="relative bg-white border border-slate-100 p-16 md:p-24 rounded-[4rem] text-center space-y-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-slate-50/20 opacity-50"></div>
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-40 group-hover:scale-150 transition-transform duration-1000"></div>
              
              <div className="relative z-10 space-y-6">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.8em] ml-[0.8em]">Investimento Consolidado</p>
                <div className="flex flex-col items-center">
                  <p className="text-8xl md:text-[10rem] font-black text-slate-900 tracking-tighter leading-none italic">
                    <span className="text-3xl md:text-5xl align-top mr-4 text-slate-200">R$</span>
                    {financeDoc?.valorEvento.toLocaleString('pt-BR') || '0,00'}
                  </p>
                  <div className="mt-12 flex items-center space-x-4">
                    <div className="px-8 py-3 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                      Vigência da Proposta: 15 Dias
                    </div>
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
         </div>
      </section>

      {/* RODAPÉ E CONTATO */}
      <section className="space-y-20 pt-24 border-t border-slate-50 text-center">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { label: 'Rede Social', value: '@heldersantoscantor', icon: Instagram, color: 'text-pink-500' },
              { label: 'Canal Oficial', value: 'heldersantos.com.br', icon: Globe, color: 'text-blue-500' },
              { label: 'E-mail Produção', value: 'contato@heldersantos.com.br', icon: Mail, color: 'text-slate-400' },
            ].map((contact, i) => (
              <div key={i} className="flex flex-col items-center space-y-4 group">
                <div className="w-16 h-16 rounded-[1.75rem] bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform group-hover:border-slate-200">
                  <contact.icon size={26} className={contact.color} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{contact.label}</p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">{contact.value}</p>
                </div>
              </div>
            ))}
         </div>

         {event.status === EventStatus.ORCAMENTO_GERADO && isContratante && (
           <div className="flex flex-col md:flex-row gap-6 justify-center pt-10 px-6 max-w-4xl mx-auto">
             <button 
               onClick={() => handleUpdateStatus(EventStatus.ACEITO)} 
               className="flex-1 py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-xl hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center"
             >
               <ThumbsUp size={24} className="mr-4" /> Aceitar Orçamento
             </button>
             <button 
               onClick={() => handleUpdateStatus(EventStatus.RECUSADO)} 
               className="flex-1 py-8 bg-white text-slate-400 rounded-[2.5rem] font-black text-xl hover:text-slate-900 border border-slate-100 transition-all active:scale-95 flex items-center justify-center shadow-sm"
             >
               <ThumbsDown size={24} className="mr-4" /> Recusar Proposta
             </button>
           </div>
         )}
      </section>
    </div>
  </div>
);

export default EventOrcamentoWidget;
