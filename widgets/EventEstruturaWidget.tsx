
import React from 'react';
import { HSEquipmentAllocation, HSEquipment } from '../types';
import { Plus, Save, Loader2, Trash2, Speaker } from 'lucide-react';

interface Props {
  isAdmin: boolean;
  localAllocations: HSEquipmentAllocation[];
  allEquipment: HSEquipment[];
  isSavingEstrutura: boolean;
  onAdd: () => void;
  onSave: () => void;
  onRemove: (eid: string) => void;
  onUpdate: (eid: string, updates: Partial<HSEquipmentAllocation>) => void;
}

const EventEstruturaWidget: React.FC<Props> = ({ 
  isAdmin, localAllocations, allEquipment, isSavingEstrutura, onAdd, onSave, onRemove, onUpdate 
}) => (
  <div className="space-y-8 animate-fade-in">
     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Estrutura Técnica</h3>
      {isAdmin && (
        <div className="flex gap-4">
          <button onClick={onAdd} className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-500 transition-all"><Plus size={16} /><span>Alocar</span></button>
          <button onClick={onSave} disabled={isSavingEstrutura} className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-emerald-500 transition-all disabled:opacity-50">
              {isSavingEstrutura ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}<span>Salvar Estrutura</span>
            </button>
        </div>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {localAllocations.map(alloc => {
        const eq = allEquipment.find(e => e.id === alloc.equipamentoId);
        if (!eq) return null;
        return (
          <div key={alloc.equipamentoId} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-6 shadow-xl">
             <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700 text-slate-600 shadow-inner flex-shrink-0">
                  {eq.photoUrlEquipamento ? <img src={eq.photoUrlEquipamento} className="w-full h-full object-cover" alt={eq.displayName} /> : <Speaker size={24} />}
                </div>
                <div className="min-w-0"><h4 className="font-black text-white tracking-tight truncate">{eq.displayName}</h4></div>
              </div>
              {isAdmin && <button onClick={() => onRemove(alloc.equipamentoId)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all"><Trash2 size={16} /></button>}
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{isAdmin ? 'Custo de Alocação (R$)' : 'Patrimônio HS'}</label>
              {isAdmin ? (
                <input type="number" value={alloc.valorAlocacao} onChange={e => onUpdate(alloc.equipamentoId, { valorAlocacao: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-black text-xs focus:border-blue-500 outline-none" />
              ) : (
                <div className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl p-3 text-blue-500 font-black text-[10px] uppercase tracking-widest">Alocado</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default EventEstruturaWidget;
