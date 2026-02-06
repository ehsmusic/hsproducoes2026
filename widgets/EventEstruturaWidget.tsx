
import React from 'react';
import { HSEquipmentAllocation, HSEquipment } from '../types';
import { Plus, Save, Loader2, Trash2, Speaker, Layout, ShieldCheck } from 'lucide-react';

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
  <div className="space-y-10 animate-fade-in">
    {/* Cabeçalho da Seção */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
      <div>
        <div className="flex items-center space-x-3 text-blue-600 mb-1">
          <Layout size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Logística Patrimonial</span>
        </div>
        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Estrutura Técnica</h3>
      </div>
      
      {isAdmin && (
        <div className="flex items-center gap-4">
           <button 
             onClick={onAdd} 
             className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-900 px-6 py-4 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95"
           >
             <Plus size={16} />
             <span>Alocar Item</span>
           </button>
           <button 
             onClick={onSave} 
             disabled={isSavingEstrutura} 
             className="flex items-center space-x-3 bg-blue-600 text-white px-8 py-4 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
           >
              {isSavingEstrutura ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Salvar Logística</span>
            </button>
        </div>
      )}
    </div>

    {/* Grid de Equipamentos */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {localAllocations.map(alloc => {
        const eq = allEquipment.find(e => e.id === alloc.equipamentoId);
        if (!eq) return null;
        return (
          <div key={alloc.equipamentoId} className="bg-white border border-slate-100 rounded-[3rem] p-8 space-y-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:border-blue-100 transition-all">
            
            {/* Cabeçalho do Card */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 p-1 border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center">
                  {eq.photoUrlEquipamento ? (
                    <img src={eq.photoUrlEquipamento} className="w-full h-full object-cover rounded-[1.2rem]" alt={eq.displayName} />
                  ) : (
                    <Speaker size={32} className="text-slate-300" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-xl tracking-tight leading-tight">{eq.displayName}</h4>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-1">Patrimônio Ativo</p>
                </div>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => onRemove(alloc.equipamentoId)} 
                  className="w-11 h-11 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                  title="Remover Alocação"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            {/* Inputs de Custo e Notas */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isAdmin ? 'Custo de Alocação' : 'Status Técnico'}</label>
                {isAdmin ? (
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs group-focus-within:text-blue-500">R$</span>
                    <input 
                      type="number" 
                      value={alloc.valorAlocacao} 
                      onChange={e => onUpdate(alloc.equipamentoId, { valorAlocacao: Number(e.target.value) })} 
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-[1.5rem] py-5 pl-12 pr-6 text-slate-900 font-black text-sm outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all shadow-sm" 
                    />
                  </div>
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 flex items-center space-x-3">
                    <ShieldCheck size={14} className="text-blue-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Alocado para Operação</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações Técnicas</label>
                {isAdmin ? (
                  <textarea 
                    value={alloc.note || ''} 
                    onChange={e => onUpdate(alloc.equipamentoId, { note: e.target.value })} 
                    placeholder="Ex: Verificar cabos de força, levar pedestais extras..."
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-[2rem] p-6 text-slate-700 font-medium text-xs outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all resize-none h-28 leading-relaxed placeholder:text-slate-300"
                  />
                ) : (
                  <div className={`w-full p-6 rounded-[2rem] border italic text-xs leading-relaxed ${
                    alloc.note ? 'bg-blue-50 border-blue-100 text-slate-600' : 'bg-slate-50 border-slate-50 text-slate-400'
                  }`}>
                    {alloc.note || 'Nenhuma instrução técnica específica para este item.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {localAllocations.length === 0 && (
        <div className="col-span-full py-24 bg-white border-2 border-dashed border-slate-100 rounded-[3rem] text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-200 border border-slate-100">
            <Layout size={32} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Nenhum equipamento alocado para este evento.</p>
        </div>
      )}
    </div>
  </div>
);

export default EventEstruturaWidget;
