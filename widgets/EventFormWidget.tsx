
import React from 'react';
import { HSEvent, ShowType, UserProfile, EventStatus } from '../types';
import { X, Save, Plus, Loader2 } from 'lucide-react';

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
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={onCancel}></div>
      <div className="relative bg-slate-900 rounded-[3rem] w-full max-w-5xl shadow-2xl border border-white/5 overflow-hidden my-auto animate-fade-in">
        <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 sticky top-0 z-10">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{title}</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-all p-2 hover:bg-slate-800 rounded-xl">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-10 space-y-10 max-h-[75vh] overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Coluna 1 */}
            <div className="space-y-6">
              {isAdmin && (
                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] space-y-6 animate-fade-in mb-4">
                  <p className="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] text-center border-b border-amber-500/10 pb-4">Controles Administrativos</p>
                  
                  {clients.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-500 uppercase ml-2 tracking-widest">Contratante / Cliente *</label>
                      <select 
                        required 
                        value={data.contratanteId} 
                        onChange={e => setData({...data, contratanteId: e.target.value})} 
                        className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-amber-500 transition-all"
                      >
                        <option value="">Selecione um cliente...</option>
                        {clients.map(c => <option key={c.uid} value={c.uid}>{c.displayName}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-500 uppercase ml-2 tracking-widest">Status do Evento *</label>
                    <select 
                      required 
                      value={data.status} 
                      onChange={e => setData({...data, status: e.target.value as EventStatus})} 
                      className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer"
                    >
                      {Object.values(EventStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase ml-2 tracking-widest">Título do Evento *</label>
                <input 
                  required 
                  value={data.titulo} 
                  onChange={e => setData({...data, titulo: e.target.value})} 
                  className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all" 
                  placeholder="Ex: Casamento de Maria e João"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Tipo de Show *</label>
                  <select 
                    required 
                    value={data.tipo} 
                    onChange={e => setData({...data, tipo: e.target.value as ShowType})} 
                    className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="Casamento">Casamento</option>
                    <option value="Aniversário">Aniversário</option>
                    <option value="Formatura">Formatura</option>
                    <option value="Confraternização">Confraternização</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Público Estimado</label>
                  <input 
                    type="number" 
                    value={data.publicoEstimado} 
                    onChange={e => setData({...data, publicoEstimado: Number(e.target.value)})} 
                    className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Data do Show *</label>
                  <input 
                    type="date" 
                    required 
                    value={data.dataEvento} 
                    onChange={e => setData({...data, dataEvento: e.target.value})} 
                    className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Hora de Início *</label>
                  <input 
                    type="time" 
                    required 
                    value={data.horaEvento} 
                    onChange={e => setData({...data, horaEvento: e.target.value})} 
                    className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Duração do Show (Horas)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  value={data.duracao} 
                  onChange={e => setData({...data, duracao: Number(e.target.value)})} 
                  className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all" 
                />
              </div>
            </div>

            {/* Coluna 2 */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase ml-2 tracking-widest">Local (Nome do Estabelecimento) *</label>
                <input 
                  required 
                  value={data.local} 
                  onChange={e => setData({...data, local: e.target.value})} 
                  className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all" 
                  placeholder="Ex: Buffet Espaço Real"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Endereço Completo</label>
                <input 
                  value={data.enderecoEvento} 
                  onChange={e => setData({...data, enderecoEvento: e.target.value})} 
                  className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all" 
                  placeholder="Rua, Número, Bairro, Cidade"
                />
              </div>

              {data.tipo === 'Casamento' && (
                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-400 uppercase ml-2 tracking-widest">Cerimonialista</label>
                    <input 
                      value={data.cerimonialista} 
                      onChange={e => setData({...data, cerimonialista: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-400 uppercase ml-2 tracking-widest">Local da Cerimônia</label>
                    <input 
                      value={data.localCerimonia} 
                      onChange={e => setData({...data, localCerimonia: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all" 
                      placeholder="Se diferente do local do show"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-4">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${data.somContratado ? 'bg-blue-600 border-blue-500' : 'border-slate-800 bg-slate-950'}`}>
                    {data.somContratado && <Plus size={14} className="text-white rotate-45" />}
                    <input type="checkbox" className="hidden" checked={data.somContratado} onChange={e => setData({...data, somContratado: e.target.checked})} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Som Contratado?</span>
                </label>

                {isAdmin && (
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${data.alimentacaoInclusa ? 'bg-emerald-600 border-emerald-500' : 'border-slate-800 bg-slate-950'}`}>
                      {data.alimentacaoInclusa && <Plus size={14} className="text-white rotate-45" />}
                      <input type="checkbox" className="hidden" checked={data.alimentacaoInclusa} onChange={e => setData({...data, alimentacaoInclusa: e.target.checked})} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Alimentação Inclusa?</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-2 pt-4">
              <label className="text-[10px] font-black text-amber-500 uppercase ml-2 tracking-widest">Informações Adicionais (Briefing Interno HS)</label>
              <textarea 
                rows={4} 
                value={data.observacoes} 
                onChange={e => setData({...data, observacoes: e.target.value})} 
                className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-amber-500 transition-all resize-none shadow-inner" 
                placeholder="Detalhes técnicos, repertório específico ou notas de produção..."
              />
            </div>
          )}

          <div className="flex gap-4 pt-8 sticky bottom-0 bg-slate-900 pb-2">
            <button type="button" onClick={onCancel} className="flex-1 py-5 bg-slate-800 text-slate-400 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all">Descartar</button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-blue-500 transition-all shadow-2xl flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              <span>{submitLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventFormWidget;
