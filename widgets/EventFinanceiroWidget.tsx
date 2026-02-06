
import React from 'react';
import { HSEventFinance } from '../types';
import { DollarSign, TrendingUp, Loader2, Save } from 'lucide-react';

interface Props {
  isAdmin: boolean;
  isContratante: boolean;
  calcTotal: number;
  financeDoc: HSEventFinance | null;
  progressPercent: number;
  financeInputs: { valorAlimentacao: number; valorTransporte: number; valorOutros: number };
  setFinanceInputs: (inputs: any) => void;
  handleSaveFinance: () => void;
  isSavingFinance: boolean;
}

const EventFinanceiroWidget: React.FC<Props> = ({ 
  isAdmin, isContratante, calcTotal, financeDoc, progressPercent, financeInputs, setFinanceInputs, handleSaveFinance, isSavingFinance 
}) => (
  <div className="space-y-10 animate-fade-in">
    {/* CARD RESUMO FINANCEIRO - THEME WHITE */}
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 space-y-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] relative overflow-hidden group">
       <div className="absolute -right-10 -top-10 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 text-slate-900"><DollarSign size={240} /></div>
       <div className="flex flex-col md:flex-row md:items-center justify-between relative z-10 gap-8">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Receita Prevista</p>
            <p className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">R$ {calcTotal.toLocaleString('pt-BR')}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Status Pagamento</p>
            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
              financeDoc?.statusPagamento === 'Quitado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              {financeDoc?.statusPagamento || 'Em aberto'}
            </span>
          </div>
       </div>
       <div className="space-y-3 pt-6 relative z-10">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="text-slate-400">Fluxo Realizado</span>
            <span className="text-blue-600">{progressPercent}%</span>
          </div>
          <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1 shadow-inner">
            <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000 rounded-full" style={{ width: `${progressPercent}%` }}></div>
          </div>
       </div>
    </div>

    {/* SEÇÃO DE CUSTOS (ADMIN) - THEME WHITE */}
    {isAdmin && (
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 space-y-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)]">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center ml-2">
          <TrendingUp size={18} className="mr-3 text-blue-600" /> Despesas Operacionais (Custo Interno)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center ml-2">Alimentação</label>
            <input type="number" value={financeInputs.valorAlimentacao} onChange={e => setFinanceInputs({...financeInputs, valorAlimentacao: Number(e.target.value)})} className="w-full px-6 py-5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-slate-900 font-black text-lg focus:border-blue-500 transition-all" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center ml-2">Transporte</label>
            <input type="number" value={financeInputs.valorTransporte} onChange={e => setFinanceInputs({...financeInputs, valorTransporte: Number(e.target.value)})} className="w-full px-6 py-5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-slate-900 font-black text-lg focus:border-blue-500 transition-all" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center ml-2">Outros</label>
            <input type="number" value={financeInputs.valorOutros} onChange={e => setFinanceInputs({...financeInputs, valorOutros: Number(e.target.value)})} className="w-full px-6 py-5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-slate-900 font-black text-lg focus:border-blue-500 transition-all" />
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-slate-50">
          <button onClick={handleSaveFinance} disabled={isSavingFinance} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black text-xs uppercase hover:bg-slate-200 border border-slate-200 transition-all active:scale-95 disabled:opacity-50">
            {isSavingFinance ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="inline mr-2" />} 
            Salvar Lançamentos
          </button>
        </div>
      </div>
    )}
  </div>
);

export default EventFinanceiroWidget;
