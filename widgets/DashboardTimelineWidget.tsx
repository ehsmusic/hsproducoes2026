
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
          <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Próximos Shows</h2>
        </div>
        <Link to="/events" className="group flex items-center space-x-1.5 text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-all">
          <span>Agenda Completa</span>
          <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="space-y-3">
        {events.length > 0 ? events.map(event => (
          <Link key={event.id} to={`/events/${event.id}`} className="group block bg-white border border-slate-100 p-5 rounded-[2rem] transition-all hover:border-blue-100 hover:shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center space-x-5">
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                  <span className="text-[7px] font-black text-slate-400 uppercase leading-none group-hover:text-blue-500">{event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }) : '---'}</span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 leading-none group-hover:text-blue-600">{event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').getDate() : '--'}</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">{event.titulo}</h3>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-400 mt-1 font-medium">
                    <span className="flex items-center"><MapPin size={11} className="mr-1.5 text-slate-300" /> {event.local}</span>
                    <span className="flex items-center"><Clock size={11} className="mr-1.5 text-slate-300" /> {event.horaEvento || '00:00'}h</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-5">
                <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                  confirmedStatuses.includes((event.status || "").toLowerCase())
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {event.status}
                </span>
                <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-blue-600 flex items-center justify-center text-slate-300 group-hover:text-white transition-all">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          </Link>
        )) : (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
              <Calendar size={32} />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">A agenda está vazia por enquanto.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTimelineWidget;
