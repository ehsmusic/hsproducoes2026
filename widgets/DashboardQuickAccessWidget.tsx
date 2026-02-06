
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
    <div className="space-y-8">
      <div className="space-y-5">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic px-2">Acesso Direto</h2>
        <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] space-y-2.5 shadow-sm">
          <Link to="/profile" className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-blue-600 text-slate-900 hover:text-white transition-all active:scale-[0.98] group border border-slate-100">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 border border-slate-100 group-hover:border-transparent transition-all">
                <UserCircle size={19} />
              </div>
              <span className="text-sm font-bold">Meu Perfil</span>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-white" />
          </Link>

          {isAdmin && (
            <Link to="/integrantes" className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-purple-600 text-slate-900 hover:text-white transition-all active:scale-[0.98] group border border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-purple-600 border border-slate-100 group-hover:border-transparent transition-all">
                  <Users size={19} />
                </div>
                <span className="text-sm font-bold">Gerenciar Equipe</span>
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-white" />
            </Link>
          )}

          <Link to="/finance" className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-emerald-600 text-slate-900 hover:text-white transition-all active:scale-[0.98] group border border-slate-100">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 border border-slate-100 group-hover:border-transparent transition-all">
                <TrendingUp size={19} />
              </div>
              <span className="text-sm font-bold">Financeiro</span>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-white" />
          </Link>
        </div>
      </div>

      {/* Banner HS Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl group">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
        <div className="relative z-10 space-y-4">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20">
            <Star size={20} />
          </div>
          <h4 className="text-xl font-black text-white tracking-tighter">Backstage HS</h4>
          <p className="text-[11px] text-blue-50 font-medium leading-relaxed opacity-80">
            Plataforma oficial para gestão de apresentações, contratos e logística Helder Santos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardQuickAccessWidget;
