
import React from 'react';
import { HSEventContratacao, UserProfile } from '../types';
import { Plus, Save, Loader2, Trash2, Info } from 'lucide-react';
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
  <div className="space-y-8 animate-fade-in">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Escala de Elenco</h3>
      {isAdmin && (
        <div className="flex gap-4">
           <button onClick={onAdd} className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-500 transition-all"><Plus size={16} /><span>Adicionar</span></button>
           <button onClick={onSave} disabled={isSavingEquipe} className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-emerald-500 transition-all disabled:opacity-50">
              {isSavingEquipe ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}<span>Salvar Escala</span>
            </button>
        </div>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {localContratacoes.map(loc => {
        const m = integrantes.find(i => i.uid === loc.integranteId);
        if (!m) return null;
        return (
          <div key={loc.integranteId} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-6 shadow-xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img src={m.photoURL || DEFAULT_AVATAR} className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-lg" alt={m.displayName} />
                  {loc.confirmacao && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                      <Plus size={12} className="text-white rotate-45" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-black text-white">{m.displayName}</h4>
                  <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{m.funcao}</p>
                </div>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => onRemove(loc.integranteId)} 
                  className="text-slate-600 hover:text-red-500 hover:bg-red-500/10 p-2.5 rounded-xl transition-all"
                  title="Remover da Escala"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{isAdmin ? 'Cachê (R$)' : 'Logística'}</label>
                {isAdmin ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-black">R$</span>
                    <input 
                      type="number" 
                      value={loc.cache} 
                      onChange={e => onUpdate(loc.integranteId, { cache: Number(e.target.value) })} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-8 pr-3 text-white font-black text-xs focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                ) : (
                  <div className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl p-3 text-slate-500 font-black text-[10px] uppercase tracking-widest">Registrado</div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                <button 
                  disabled={!isAdmin} 
                  onClick={() => onUpdate(loc.integranteId, { confirmacao: !loc.confirmacao })} 
                  className={`w-full p-3 rounded-xl border text-[9px] font-black uppercase transition-all shadow-inner ${
                    loc.confirmacao ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {loc.confirmacao ? 'Confirmado' : 'Pendente'}
                </button>
              </div>
            </div>

            {/* Campo de Notas / Informações Adicionais */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center">
                <Info size={10} className="mr-1.5 text-blue-500/50" /> 
                {isAdmin ? 'Instruções para o Integrante' : 'Instruções da Produção'}
              </label>
              {isAdmin ? (
                <textarea 
                  value={loc.note || ''} 
                  onChange={e => onUpdate(loc.integranteId, { note: e.target.value })} 
                  placeholder="Ex: Trazer violão de aço, chegar 1h antes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 font-medium text-xs focus:border-blue-500 outline-none transition-all resize-none h-20 scrollbar-hide shadow-inner"
                />
              ) : (
                <div className={`w-full p-4 rounded-xl border italic text-xs leading-relaxed ${
                  loc.note ? 'bg-blue-500/5 border-blue-500/10 text-slate-400' : 'bg-slate-950/50 border-slate-900 text-slate-600'
                }`}>
                  {loc.note || 'Nenhuma instrução específica para este show.'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default EventEquipeWidget;
