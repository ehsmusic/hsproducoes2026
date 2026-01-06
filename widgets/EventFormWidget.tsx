
import React, { useEffect } from 'react';
import { HSEvent, ShowType, UserProfile, EventStatus } from '../types';
import { 
  X, Save, Plus, Loader2, Calendar, MapPin, 
  Users, Clock, Music, Info, ShieldCheck, 
  ChevronLeft, Layout, Flag, AlignLeft
} from 'lucide-react';

interface Props {
  title: string;
  data: Partial<HSEvent>;
  setData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isAdmin: boolean;
  clients?: UserProfile[];
  submitLabel: string;
}

const EventFormWidget: React.FC<Props> = ({ 
  title, data, setData, onSubmit, onCancel, isSubmitting, isAdmin, clients = [], submitLabel 
}) => {
  
  // Bloquear scroll do body e garantir que o componente suba ao topo
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex justify-center animate-fade-in overflow-hidden">
      
      {/* Container Principal com 80% de largura no Desktop, 100% no Mobile */}
      <div className="w-full md:w-[80vw] h-full bg-slate-950 flex flex-col border-x border-slate-800 shadow-2xl">
        
        {/* Header Fixo dentro do container de 80% */}
        <header className="flex-shrink-0 bg-slate-900 border-b border-slate-800 px-6 md:px-12 py-5 flex items-center justify-between shadow-2xl">
          <div className="flex items-center space-x-5">
            <button 
              type="button"
              onClick={onCancel}
              className="w-10 h-10 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase leading-none">{title}</h1>
              <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center">
                <ShieldCheck size={10} className="mr-1.5" />
                HS Produções • Painel de Cadastro
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              type="button"
              onClick={onCancel}
              className="hidden sm:block px-5 py-2.5 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              form="main-event-form"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>{isSubmitting ? 'Salvando...' : submitLabel}</span>
            </button>
          </div>
        </header>

        {/* Área de Conteúdo - Rolagem Independente */}
        <main className="flex-1 overflow-y-auto bg-slate-950 custom-scrollbar">
          <div className="max-w-4xl mx-auto px-6 py-10 md:py-16">
            
            <form id="main-event-form" onSubmit={onSubmit} className="space-y-16">
              
              {/* SEÇÃO 1: ESSENCIAIS */}
              <section className="space-y-8">
                <div className="flex items-center space-x-3 text-blue-500 border-b border-slate-900 pb-4">
                  <Music size={18} />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em]">Definições do Evento</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nome do Show / Evento *</label>
                    <input 
                      required 
                      value={data.titulo} 
                      onChange={e => setData({...data, titulo: e.target.value})} 
                      className="w-full px-6 py-5 bg-slate-900 border border-slate-800 rounded-2xl text-white font-black text-xl md:text-2xl outline-none focus:border-blue-500 transition-all placeholder:text-slate-800" 
                      placeholder="Ex: Casamento Marina e Rodrigo"
                    />
                  </div>

                  {/* TIPO DE SHOW - DESTAQUE */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase ml-2 tracking-widest flex items-center">
                      <Flag size={12} className="mr-1.5" /> Tipo do Show *
                    </label>
                    <div className="relative">
                      <select 
                        required 
                        value={data.tipo} 
                        onChange={e => setData({...data, tipo: e.target.value as ShowType})} 
                        className="w-full px-6 py-5 bg-slate-900 border border-blue-600/30 rounded-2xl text-white font-black text-lg outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none shadow-lg"
                      >
                        <option value="Casamento">Casamento</option>
                        <option value="Aniversário">Aniversário</option>
                        <option value="Formatura">Formatura</option>
                        <option value="Confraternização">Confraternização</option>
                        <option value="Outros">Outros</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
                        <ChevronLeft size={20} className="-rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Público Estimado</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={data.publicoEstimado} 
                        onChange={e => setData({...data, publicoEstimado: Number(e.target.value)})} 
                        className="w-full px-6 py-5 bg-slate-900 border border-slate-800 rounded-2xl text-white font-black text-lg outline-none focus:border-blue-500 transition-all" 
                        placeholder="0"
                      />
                      <Users size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700" />
                    </div>
                  </div>
                </div>
              </section>

              {/* SEÇÃO 2: ADMIN (Somente se Admin) */}
              {isAdmin && (
                <section className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] space-y-8 animate-fade-in">
                  <div className="flex items-center space-x-3 text-amber-500 border-b border-amber-500/10 pb-4">
                    <ShieldCheck size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Controle Interno</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-500 uppercase ml-2 tracking-widest">Contratante / Cliente</label>
                      <select 
                        required 
                        value={data.contratanteId} 
                        onChange={e => setData({...data, contratanteId: e.target.value})} 
                        className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-amber-500 transition-all appearance-none"
                      >
                        <option value="">Selecione o Cliente...</option>
                        {clients?.map(c => <option key={c.uid} value={c.uid}>{c.displayName}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-500 uppercase ml-2 tracking-widest">Status Inicial</label>
                      <select 
                        required 
                        value={data.status} 
                        onChange={e => setData({...data, status: e.target.value as EventStatus})} 
                        className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-amber-500 transition-all appearance-none"
                      >
                        {Object.values(EventStatus).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
              )}

              {/* SEÇÃO 3: CRONOGRAMA */}
              <section className="space-y-8">
                <div className="flex items-center space-x-3 text-blue-500 border-b border-slate-900 pb-4">
                  <Calendar size={18} />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em]">Data e Horário</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Data do Show *</label>
                    <input 
                      type="date" 
                      required 
                      value={data.dataEvento} 
                      onChange={e => setData({...data, dataEvento: e.target.value})} 
                      className="w-full px-5 py-4 bg-slate-900 border border-slate-800 rounded-xl text-white font-black outline-none focus:border-blue-500 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Início Previsto *</label>
                    <input 
                      type="time" 
                      required 
                      value={data.horaEvento} 
                      onChange={e => setData({...data, horaEvento: e.target.value})} 
                      className="w-full px-5 py-4 bg-slate-900 border border-slate-800 rounded-xl text-white font-black outline-none focus:border-blue-500 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Duração (Horas)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={data.duracao} 
                      onChange={e => setData({...data, duracao: Number(e.target.value)})} 
                      className="w-full px-5 py-4 bg-slate-900 border border-slate-800 rounded-xl text-white font-black outline-none focus:border-blue-500 transition-all" 
                    />
                  </div>
                </div>
              </section>

              {/* SEÇÃO 4: LOGÍSTICA */}
              <section className="space-y-8">
                <div className="flex items-center space-x-3 text-blue-500 border-b border-slate-900 pb-4">
                  <MapPin size={18} />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em]">Localização</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nome do Buffet / Local *</label>
                    <input 
                      required 
                      value={data.local} 
                      onChange={e => setData({...data, local: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-blue-500 transition-all" 
                      placeholder="Ex: Villa Régia"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Endereço Completo</label>
                    <input 
                      value={data.enderecoEvento} 
                      onChange={e => setData({...data, enderecoEvento: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-blue-500 transition-all" 
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                    />
                  </div>
                </div>
              </section>

              {/* SEÇÃO 5: CHECKLIST */}
              <section className="space-y-8">
                <div className="flex items-center space-x-3 text-blue-500 border-b border-slate-900 pb-4">
                  <Info size={18} />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em]">Produção Técnica</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <label className="flex items-center p-6 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer group hover:border-blue-500 transition-all">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${data.somContratado ? 'bg-blue-600 border-blue-500' : 'bg-slate-950 border-slate-800'}`}>
                      {data.somContratado && <Plus size={18} className="text-white rotate-45" />}
                      <input type="checkbox" className="hidden" checked={data.somContratado} onChange={e => setData({...data, somContratado: e.target.checked})} />
                    </div>
                    <div className="ml-5">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Som HS Incluso</p>
                      <p className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">Equipamento próprio HS</p>
                    </div>
                  </label>

                  <label className="flex items-center p-6 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer group hover:border-emerald-500 transition-all">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${data.alimentacaoInclusa ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-950 border-slate-800'}`}>
                      {data.alimentacaoInclusa && <Plus size={18} className="text-white rotate-45" />}
                      <input type="checkbox" className="hidden" checked={data.alimentacaoInclusa} onChange={e => setData({...data, alimentacaoInclusa: e.target.checked})} />
                    </div>
                    <div className="ml-5">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Alimentação Banda</p>
                      <p className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">Confirmado com Local</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center">
                    <AlignLeft size={12} className="mr-1.5" /> Briefing e Notas
                  </label>
                  <textarea 
                    rows={5} 
                    value={data.observacoes} 
                    onChange={e => setData({...data, observacoes: e.target.value})} 
                    className="w-full px-6 py-5 bg-slate-900 border border-slate-800 rounded-2xl text-white font-medium outline-none focus:border-blue-500 transition-all resize-none leading-relaxed" 
                    placeholder="Detalhes sobre repertório, cerimonial, etc..."
                  />
                </div>
              </section>

            </form>
          </div>
        </main>

        {/* Footer Fixo na Base do container de 80% */}
        <footer className="flex-shrink-0 bg-slate-900 border-t border-slate-800 p-6 md:p-8 flex flex-col sm:flex-row gap-4 items-center">
          <div className="hidden sm:block flex-1">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Os dados serão sincronizados com o banco HS Oficial.</p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 sm:px-10 py-4 bg-slate-800 text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:text-white transition-all active:scale-95"
            >
              Descartar
            </button>
            <button 
              type="submit"
              form="main-event-form"
              disabled={isSubmitting} 
              className="flex-[2] sm:flex-none sm:px-16 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/40 flex items-center justify-center space-x-3 hover:bg-blue-500 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>{isSubmitting ? 'Gravando...' : submitLabel}</span>
            </button>
          </div>
        </footer>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { 
            background: #1e293b; 
            border-radius: 20px; 
          }
          
          select { 
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); 
            background-position: right 1.5rem center; 
            background-repeat: no-repeat; 
            background-size: 1.25rem; 
            padding-right: 3.5rem; 
          }

          input[type="date"]::-webkit-calendar-picker-indicator,
          input[type="time"]::-webkit-calendar-picker-indicator {
            filter: invert(0.5) sepia(1) saturate(5) hue-rotate(190deg);
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
};

export default EventFormWidget;
