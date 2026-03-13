
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
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
          <h2 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">Próximos Shows</h2>
        </div>
        <Link to="/events" className="group flex items-center space-x-1.5 text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-all">
          <span>Agenda Completa</span>
          <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="space-y-3">
        {events.length > 0 ? events.map(event => (
          <Link 
            key={event.id} 
            to={`/events/${event.id}`} 
            className="group block bg-white border border-slate-100 p-4 md:p-5 rounded-2xl transition-all hover:border-blue-500/30 hover:shadow-md"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-5">
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                  <span className="text-[8px] font-black text-slate-400 uppercase leading-none group-hover:text-blue-500">
                    {event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }) : '---'}
                  </span>
                  <span className="text-lg font-black text-slate-900 mt-1 leading-none group-hover:text-blue-600">
                    {event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').getDate() : '--'}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight truncate">
                    {event.titulo}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
                    <span className="flex items-center"><MapPin size={12} className="mr-1.5 text-blue-500/40" /> {event.local}</span>
                    <span className="flex items-center"><Clock size={12} className="mr-1.5 text-blue-500/40" /> {event.horaEvento || '00:00'}h</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-4">
                <span className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border transition-all ${
                  confirmedStatuses.includes((event.status || "").toLowerCase())
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {event.status}
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-blue-600 flex items-center justify-center text-slate-300 group-hover:text-white transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </Link>
        )) : (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-2xl py-16 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-200">
              <Calendar size={24} />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">A agenda está vazia por enquanto.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTimelineWidget;
