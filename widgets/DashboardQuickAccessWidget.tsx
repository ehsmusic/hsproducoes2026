
import React from 'react';
import { Link } from 'react-router';
import { UserCircle, Users, TrendingUp, ChevronRight, Star } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface QuickAccessProps {
  userProfile: UserProfile | null;
}

const DashboardQuickAccessWidget: React.FC<QuickAccessProps> = ({ userProfile }) => {
  const isAdmin = userProfile?.role === UserRole.ADMIN;

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter italic px-2">Acesso Rápido</h2>
        <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[3rem] space-y-4 shadow-2xl backdrop-blur-md">
          <Link to="/profile" className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-white font-bold hover:bg-blue-600 hover:border-blue-500 transition-all active:scale-95 group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-white/10 flex items-center justify-center text-blue-500 group-hover:text-white transition-all">
                <UserCircle size={20} />
              </div>
              <span className="text-sm">Meu Perfil</span>
            </div>
            <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
          </Link>

          {isAdmin && (
            <Link to="/integrantes" className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-white font-bold hover:bg-purple-600 hover:border-purple-500 transition-all active:scale-95 group">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-white/10 flex items-center justify-center text-purple-500 group-hover:text-white transition-all">
                  <Users size={20} />
                </div>
                <span className="text-sm">Gerenciar Time</span>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
            </Link>
          )}

          <Link to="/finance" className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-white font-bold hover:bg-emerald-600 hover:border-emerald-500 transition-all active:scale-95 group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-white/10 flex items-center justify-center text-emerald-500 group-hover:text-white transition-all">
                <TrendingUp size={20} />
              </div>
              <span className="text-sm">Financeiro</span>
            </div>
            <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
          </Link>
        </div>
      </div>

      {/* Banner HS */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] shadow-2xl group">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        <div className="relative z-10 space-y-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20">
            <Star size={24} />
          </div>
          <h4 className="text-xl font-black text-white tracking-tighter">Time Helder Santos</h4>
          <p className="text-xs text-blue-100 font-medium leading-relaxed">
            Gerenciamento profissional de shows e eventos com o padrão de qualidade HS Produções.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardQuickAccessWidget;
