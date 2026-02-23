
import React from 'react';
import { HSEventContratacao, UserProfile } from '../types';
import { Plus, Save, Loader2, Trash2, Info, UserCheck, ShieldCheck, Users } from 'lucide-react';
import { DEFAULT_AVATAR } from '../App';

interface Props {
  isAdmin: boolean;
  localContratacoes: HSEventContratacao[];
  integrantes: UserProfile[];
  isSavingEquipe: boolean;
  onAdd: () => void;
  onSave: () => void;
  onRemove: (uid: string) => void;
  onUpdate: (uid: string, updates: Partial<HSEventContratacao>) => void;
}

const EventEquipeWidget: React.FC<Props> = ({ 
  isAdmin, localContratacoes, integrantes, isSavingEquipe, onAdd, onSave, onRemove, onUpdate 
}) => (
  <div className="space-y-10 animate-fade-in">
    {/* Cabeçalho de Ação da Seção */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
      <div>
        <div className="flex items-center space-x-3 text-blue-600 mb-1">
          <Users size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Gestão de Escalas</span>
        </div>
        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Elenco Escalado</h3>
      </div>
      
      {isAdmin && (
        <div className="flex items-center gap-4">
           <button 
             onClick={onAdd} 
             className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-900 px-6 py-4 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95"
           >
             <Plus size={16} />
             <span>Adicionar</span>
           </button>
           <button 
             onClick={onSave} 
             disabled={isSavingEquipe} 
             className="flex items-center space-x-3 bg-blue-600 text-white px-8 py-4 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
           >
              {isSavingEquipe ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Salvar Escala</span>
            </button>
        </div>
      )}
    </div>

    {/* Grid de Membros */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {localContratacoes.map(loc => {
        const m = integrantes.find(i => i.uid === loc.integranteId);
        if (!m) return null;
        return (
          <div key={loc.integranteId} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-all">
            
            {/* Perfil e Remoção */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 p-1 border border-slate-100 shadow-sm overflow-hidden">
                    <img src={m.photoURL || DEFAULT_AVATAR} className="w-full h-full object-cover rounded-lg" alt={m.displayName} />
                  </div>
                  {loc.confirmacao && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <UserCheck size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg tracking-tight">{m.displayName}</h4>
                  <p className="text-[9px] text-blue-600 font-black uppercase tracking-[0.2em] mt-0.5">{m.funcao || m.tipoIntegrante}</p>
                </div>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => onRemove(loc.integranteId)} 
                  className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                  title="Remover da Escala"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Inputs Financeiros e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{isAdmin ? 'Cachê' : 'Sincronização'}</label>
                {isAdmin ? (
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px] group-focus-within:text-blue-500">R$</span>
                    <input 
                      type="number" 
                      value={loc.cache} 
                      onChange={e => onUpdate(loc.integranteId, { cache: Number(e.target.value) })} 
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 font-black text-xs outline-none focus:border-blue-500 focus:bg-white transition-all" 
                    />
                  </div>
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center space-x-2">
                    <ShieldCheck size={12} className="text-blue-500" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Registrado</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                <button 
                  disabled={!isAdmin} 
                  onClick={() => onUpdate(loc.integranteId, { confirmacao: !loc.confirmacao })} 
                  className={`w-full py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                    loc.confirmacao 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-200'
                  }`}
                >
                  {loc.confirmacao ? 'OK' : 'Pendente'}
                </button>
              </div>
            </div>

            {/* Notas e Briefing Técnico */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                <Info size={12} className="mr-2 text-blue-500" /> 
                {isAdmin ? 'Briefing' : 'Instruções'}
              </label>
              {isAdmin ? (
                <textarea 
                  value={loc.note || ''} 
                  onChange={e => onUpdate(loc.integranteId, { note: e.target.value })} 
                  placeholder="Instruções específicas..."
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-4 text-slate-700 font-medium text-[11px] outline-none focus:border-blue-500 focus:bg-white transition-all resize-none h-24 leading-relaxed placeholder:text-slate-300"
                />
              ) : (
                <div className={`w-full p-4 rounded-xl border italic text-[11px] leading-relaxed ${
                  loc.note ? 'bg-blue-50 border-blue-100 text-slate-600' : 'bg-slate-50 border-slate-50 text-slate-400'
                }`}>
                  {loc.note || 'Nenhuma instrução registrada.'}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {localContratacoes.length === 0 && (
        <div className="col-span-full py-24 bg-white border-2 border-dashed border-slate-100 rounded-[3rem] text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-200 border border-slate-100">
            <Users size={32} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Nenhum integrante escalado para este show.</p>
        </div>
      )}
    </div>
  </div>
);

export default EventEquipeWidget;
