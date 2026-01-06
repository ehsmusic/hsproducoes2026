
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
      <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl p-8 rounded-[2.5rem] hover:border-blue-500/30 transition-all duration-500">
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-blue-600/5 blur-2xl group-hover:opacity-100 transition-opacity"></div>
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
            <Wallet size={22} />
          </div>
          <ArrowUpRight className="text-slate-700 group-hover:text-blue-500 transition-colors" size={20} />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label1}</p>
        <div className="flex items-baseline space-x-1 mt-2">
          {isCurrency1 && <span className="text-lg font-black text-blue-500/50 tracking-tighter">R$</span>}
          <p className="text-4xl font-black text-white tracking-tighter">
            {isCurrency1 ? value1.toLocaleString('pt-BR') : value1}
          </p>
        </div>
      </div>

      {/* Card 2 - Shows / Escala */}
      <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl p-8 rounded-[2.5rem] hover:border-emerald-500/30 transition-all duration-500">
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-emerald-600/5 blur-2xl group-hover:opacity-100 transition-opacity"></div>
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 size={22} />
          </div>
          <ArrowUpRight className="text-slate-700 group-hover:text-emerald-500 transition-colors" size={20} />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label2}</p>
        <p className="text-4xl font-black text-white mt-2 tracking-tighter">{value2}</p>
      </div>

      {/* Card 3 - Pendências */}
      <div className="relative group overflow-hidden bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl p-8 rounded-[2.5rem] hover:border-amber-500/30 transition-all duration-500">
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-amber-600/5 blur-2xl group-hover:opacity-100 transition-opacity"></div>
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
            {isIntegrante ? <AlertCircle size={22} /> : <Clock size={22} />}
          </div>
          <ArrowUpRight className="text-slate-700 group-hover:text-amber-500 transition-colors" size={20} />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label3}</p>
        <p className="text-4xl font-black text-white mt-2 tracking-tighter">{value3}</p>
      </div>
    </div>
  );
};

export default DashboardStatsWidget;
