
import React from 'react';
import { Link } from 'react-router';
import { Calendar, ChevronRight, MapPin, Clock } from 'lucide-react';
import { HSEvent } from '../types';

interface TimelineProps {
  events: HSEvent[];
  confirmedStatuses: string[];
}

const DashboardTimelineWidget: React.FC<TimelineProps> = ({ events, confirmedStatuses }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-4">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Cronograma de Shows</h2>
        </div>
        <Link to="/events" className="group flex items-center space-x-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">
          <span>Ver Agenda Completa</span>
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="space-y-4">
        {events.length > 0 ? events.map(event => (
          <Link key={event.id} to={`/events/${event.id}`} className="group relative block bg-slate-900/20 border border-slate-800/40 hover:border-blue-500/30 p-6 rounded-[2rem] transition-all hover:bg-slate-900/40 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center space-x-6">
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-950 rounded-2xl border border-slate-800 group-hover:border-blue-500/50 transition-colors">
                  <span className="text-[8px] font-black text-slate-500 uppercase leading-none">{event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }) : '---'}</span>
                  <span className="text-xl font-black text-white mt-1 leading-none">{event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').getDate() : '--'}</span>
                </div>
                <div>
                  <h3 className="font-black text-lg text-white group-hover:text-blue-400 transition-colors tracking-tight">{event.titulo}</h3>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[11px] text-slate-500 mt-2 font-bold">
                    <span className="flex items-center"><MapPin size={12} className="mr-2 text-blue-500/50" /> {event.local}</span>
                    <span className="flex items-center"><Clock size={12} className="mr-2 text-blue-500/50" /> {event.horaEvento || '00:00'}h</span>
                    <span className="text-slate-700 hidden sm:inline">•</span>
                    <span className="flex items-center text-slate-600 italic truncate max-w-[200px]">{event.enderecoEvento}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end md:space-x-6">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                  confirmedStatuses.includes((event.status || "").toLowerCase())
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {event.status}
                </span>
                <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-blue-600 flex items-center justify-center text-slate-500 group-hover:text-white transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          </Link>
        )) : (
          <div className="bg-slate-950/50 border-2 border-dashed border-slate-900 rounded-[3rem] py-24 text-center">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-800">
              <Calendar size={40} />
            </div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Nenhum evento agendado</p>
            <p className="text-slate-700 font-bold text-xs mt-2">Novas datas aparecerão aqui automaticamente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTimelineWidget;
