
import React from 'react';
import { Wallet, CheckCircle2, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';

interface StatsProps {
  label1: string;
  value1: number;
  isCurrency1: boolean;
  label2: string;
  value2: number;
  label3: string;
  value3: number;
  isIntegrante: boolean;
}

const DashboardStatsWidget: React.FC<StatsProps> = ({ 
  label1, value1, isCurrency1, label2, value2, label3, value3, isIntegrante 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Card 1 - Financeiro */}
      <div className="relative group overflow-hidden bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:border-blue-200 transition-all duration-500 shadow-sm hover:shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Wallet size={20} />
          </div>
          <ArrowUpRight className="text-slate-200 group-hover:text-blue-500 transition-colors" size={18} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label1}</p>
        <div className="flex items-baseline space-x-1 mt-2">
          {isCurrency1 && <span className="text-lg font-black text-slate-300 tracking-tighter">R$</span>}
          <p className="text-4xl font-black text-slate-900 tracking-tighter">
            {isCurrency1 ? value1.toLocaleString('pt-BR') : value1}
          </p>
        </div>
      </div>

      {/* Card 2 - Shows / Escala */}
      <div className="relative group overflow-hidden bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:border-emerald-200 transition-all duration-500 shadow-sm hover:shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={20} />
          </div>
          <ArrowUpRight className="text-slate-200 group-hover:text-emerald-500 transition-colors" size={18} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label2}</p>
        <p className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{value2}</p>
      </div>

      {/* Card 3 - Pendências */}
      <div className="relative group overflow-hidden bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:border-amber-200 transition-all duration-500 shadow-sm hover:shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            {isIntegrante ? <AlertCircle size={20} /> : <Clock size={20} />}
          </div>
          <ArrowUpRight className="text-slate-200 group-hover:text-amber-500 transition-colors" size={18} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label3}</p>
        <p className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{value3}</p>
      </div>
    </div>
  );
};

export default DashboardStatsWidget;
