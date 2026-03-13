
import React, { useEffect, useState } from 'react';
import { HSEvent, ShowType, UserProfile, EventStatus, UserRole } from '../types';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '../firebase';
import { DEFAULT_AVATAR } from '../App';
import { 
  X, Save, Plus, Loader2, Calendar, MapPin, 
  Users, Clock, Music, Info, ShieldCheck, 
  ChevronLeft, Layout, Flag, AlignLeft, Sparkles,
  UserPlus, Mail, Phone, User
} from 'lucide-react';

interface Props {
  title: string;
  data: Partial<HSEvent>;
  setData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isAdmin: boolean;
  clients?: UserProfile[];
  submitLabel: string;
}

const EventFormWidget: React.FC<Props> = ({ 
  title, data, setData, onSubmit, onCancel, isSubmitting, isAdmin, clients = [], submitLabel 
}) => {
  const [showNewClientPanel, setShowNewClientPanel] = useState(false);
  const [isSavingNewClient, setIsSavingNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState<Partial<UserProfile>>({
    displayName: '',
    email: '',
    phoneNumber: ''
  });
  
  // Rolar para o topo ao abrir para garantir que o usuário veja o início do form
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCreateNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.displayName || !newClientData.email) {
      alert("Nome e E-mail são obrigatórios.");
      return;
    }

    setIsSavingNewClient(true);
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, `Client-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      const defaultPassword = "HS" + Math.random().toString(36).slice(-6);
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        newClientData.email, 
        defaultPassword
      );
      
      const uid = userCredential.user.uid;

      const profile: UserProfile = {
        uid,
        email: newClientData.email,
        displayName: newClientData.displayName,
        role: UserRole.CONTRATANTE,
        photoURL: DEFAULT_AVATAR,
        phoneNumber: newClientData.phoneNumber || '',
        pixKey: '',
        endereco: ''
      };

      await setDoc(doc(db, 'users', uid), profile);

      // Selecionar automaticamente o novo cliente no formulário
      setData({ ...data, contratanteId: uid });

      alert(`Contratante criado com sucesso!\nE-mail: ${newClientData.email}\nSenha Provisória: ${defaultPassword}`);
      
      setShowNewClientPanel(false);
      setNewClientData({ displayName: '', email: '', phoneNumber: '' });

    } catch (err: any) {
      console.error("Erro ao criar contratante:", err);
      alert("Erro ao criar contratante: " + (err.message || "Erro desconhecido"));
    } finally {
      setIsSavingNewClient(false);
      if (secondaryApp) await deleteApp(secondaryApp);
    }
  };

  return (
    <div className="w-full min-h-[80vh] flex flex-col animate-fade-in">
      
      {/* Container Principal - Agora integrado ao layout sem ser fixo na tela toda */}
      <div className="w-full flex flex-col bg-white border border-slate-100 rounded-[3rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* Header Superior - Light & Elegant */}
        <header className="flex-shrink-0 bg-white border-b border-slate-50 px-8 md:px-12 py-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button 
              type="button"
              onClick={onCancel}
              className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-white hover:border-blue-100 transition-all active:scale-95 shadow-sm"
              title="Voltar"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <div className="flex items-center space-x-2 text-blue-600 mb-1">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Ambiente de Registro HS</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{title}</h1>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button 
              type="submit"
              form="main-event-form"
              disabled={isSubmitting}
              className="flex items-center space-x-3 px-10 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>{isSubmitting ? 'Salvando...' : submitLabel}</span>
            </button>
          </div>
        </header>

        {/* Corpo do Formulário */}
        <main className="flex-1 bg-slate-50/30">
          <div className="max-w-4xl mx-auto px-8 py-12 md:py-16">
            
            <form id="main-event-form" onSubmit={onSubmit} className="space-y-12">
              
              {/* SEÇÃO 1: CONCEITO */}
              <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
                <div className="flex items-center space-x-3 text-slate-900 pb-6 border-b border-slate-50">
                  <Music size={20} className="text-blue-600" />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em]">Dados do Espetáculo</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Título do Show / Nome do Evento *</label>
                    <input 
                      required 
                      value={data.titulo} 
                      onChange={e => setData({...data, titulo: e.target.value})} 
                      className="w-full px-8 py-7 bg-slate-50/50 border border-slate-200 rounded-[2.2rem] text-slate-900 font-black text-xl md:text-3xl outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300" 
                      placeholder="Ex: Formatura Direito Unesp 2024"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Tipo de Apresentação *</label>
                    <select 
                      required 
                      value={data.tipo} 
                      onChange={e => setData({...data, tipo: e.target.value as ShowType})} 
                      className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="Casamento">Casamento</option>
                      <option value="Aniversário">Aniversário</option>
                      <option value="Formatura">Formatura</option>
                      <option value="Confraternização">Confraternização</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Público Estimado</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-600 transition-colors">
                        <Users size={20} />
                      </div>
                      <input 
                        type="number" 
                        value={data.publicoEstimado} 
                        onChange={e => setData({...data, publicoEstimado: Number(e.target.value)})} 
                        className="w-full pl-16 pr-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all" 
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* CONTRATANTE (Admin Only) */}
              {isAdmin && (
                <section className="p-8 md:p-12 bg-slate-900 rounded-[3rem] space-y-10 animate-fade-in text-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center space-x-3">
                      <ShieldCheck size={20} className="text-blue-400" />
                      <span className="text-xs font-black uppercase tracking-[0.3em]">Gestão Administrativa</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Vincular a um Contratante</label>
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                          <select 
                            required 
                            value={data.contratanteId} 
                            onChange={e => setData({...data, contratanteId: e.target.value})} 
                            className="w-full px-8 py-6 bg-slate-950 border border-slate-800 rounded-[1.5rem] text-white font-bold outline-none focus:border-blue-500 appearance-none transition-all"
                          >
                            <option value="">Selecione o Cliente...</option>
                            {clients?.map(c => <option key={c.uid} value={c.uid}>{c.displayName}</option>)}
                          </select>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setShowNewClientPanel(true)}
                          className="w-16 h-16 flex items-center justify-center bg-blue-600 text-white rounded-[1.5rem] hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                          title="Novo Contratante"
                        >
                          <UserPlus size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Status do Workflow</label>
                      <select 
                        required 
                        value={data.status} 
                        onChange={e => setData({...data, status: e.target.value as EventStatus})} 
                        className="w-full px-8 py-6 bg-slate-950 border border-slate-800 rounded-[1.5rem] text-white font-bold outline-none focus:border-blue-500 appearance-none transition-all"
                      >
                        {Object.values(EventStatus).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
              )}

              {/* LOGÍSTICA */}
              <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
                <div className="flex items-center space-x-3 text-slate-900 pb-6 border-b border-slate-50">
                  <Calendar size={20} className="text-blue-600" />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em]">Agenda & Local</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Data do Show *</label>
                    <input 
                      type="date" 
                      required 
                      value={data.dataEvento} 
                      onChange={e => setData({...data, dataEvento: e.target.value})} 
                      className="w-full px-6 py-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Início Previsto *</label>
                    <input 
                      type="time" 
                      required 
                      value={data.horaEvento} 
                      onChange={e => setData({...data, horaEvento: e.target.value})} 
                      className="w-full px-6 py-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Duração Estimada</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.5" 
                        value={data.duracao} 
                        onChange={e => setData({...data, duracao: Number(e.target.value)})} 
                        className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" 
                      />
                      <Clock size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>

                  <div className="md:col-span-1 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Buffet / Local *</label>
                    <input 
                      required 
                      value={data.local} 
                      onChange={e => setData({...data, local: e.target.value})} 
                      className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" 
                      placeholder="Nome do Espaço"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Endereço Completo</label>
                    <input 
                      value={data.enderecoEvento} 
                      onChange={e => setData({...data, enderecoEvento: e.target.value})} 
                      className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" 
                      placeholder="Rua, Número, Bairro, Cidade"
                    />
                  </div>
                </div>
              </section>

              {/* BRIEFING */}
              <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
                <div className="flex items-center space-x-3 text-slate-900 pb-6 border-b border-slate-50">
                  <Info size={20} className="text-blue-600" />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em]">Checklist de Produção</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <button 
                    type="button"
                    onClick={() => setData({...data, somContratado: !data.somContratado})}
                    className={`flex items-center p-8 rounded-[2rem] border transition-all text-left ${data.somContratado ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-200'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${data.somContratado ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                      {data.somContratado ? <Plus className="rotate-45" size={20} /> : <div className="w-3 h-3 rounded-full bg-slate-100" />}
                    </div>
                    <div className="ml-5">
                      <p className="text-xs font-black uppercase tracking-widest">Sonorização HS</p>
                      <p className={`text-[9px] font-bold uppercase mt-1 tracking-widest ${data.somContratado ? 'text-blue-100' : 'text-slate-400'}`}>Equipamento Próprio</p>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setData({...data, alimentacaoInclusa: !data.alimentacaoInclusa})}
                    className={`flex items-center p-8 rounded-[2rem] border transition-all text-left ${data.alimentacaoInclusa ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-500/20' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-emerald-200'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${data.alimentacaoInclusa ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                      {data.alimentacaoInclusa ? <Plus className="rotate-45" size={20} /> : <div className="w-3 h-3 rounded-full bg-slate-100" />}
                    </div>
                    <div className="ml-5">
                      <p className="text-xs font-black uppercase tracking-widest">Refeição Equipe</p>
                      <p className={`text-[9px] font-bold uppercase mt-1 tracking-widest ${data.alimentacaoInclusa ? 'text-emerald-100' : 'text-slate-400'}`}>Incluso no Evento</p>
                    </div>
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center">
                    <AlignLeft size={14} className="mr-1.5" /> Notas e Pedidos Especiais
                  </label>
                  <textarea 
                    rows={5} 
                    value={data.observacoes} 
                    onChange={e => setData({...data, observacoes: e.target.value})} 
                    className="w-full px-8 py-8 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] text-slate-900 font-medium outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all resize-none leading-relaxed placeholder:text-slate-300" 
                    placeholder="Especifique restrições, preferências de repertório ou detalhes importantes..."
                  />
                </div>
              </section>

            </form>
          </div>
        </main>

        {/* Footer Inferior - Sticky no final do card */}
        <footer className="bg-white border-t border-slate-50 p-8 md:p-12 flex flex-col sm:flex-row gap-6 items-center justify-between">
          <div className="text-center sm:text-left">
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] max-w-xs">
               O envio dos dados constitui uma solicitação oficial sujeita à auditoria da HS Produções.
             </p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 sm:px-12 py-5 bg-white text-slate-400 border border-slate-200 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              form="main-event-form"
              disabled={isSubmitting} 
              className="flex-[2] sm:flex-none sm:px-20 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-500/30 flex items-center justify-center space-x-3 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{isSubmitting ? 'Gravando...' : submitLabel}</span>
            </button>
          </div>
        </footer>
      </div>

      {/* SIDE PANEL: NOVO CONTRATANTE */}
      {showNewClientPanel && (
        <div className="fixed inset-0 z-[120] overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setShowNewClientPanel(false)}></div>
          
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-100">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white flex-shrink-0">
              <div>
                <div className="flex items-center space-x-2 text-blue-600 mb-1">
                  <UserPlus size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cadastro Rápido</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Novo Contratante</h3>
              </div>
              <button 
                onClick={() => setShowNewClientPanel(false)} 
                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-900 rounded-xl bg-slate-50 hover:bg-white border border-slate-100 transition-all active:scale-95 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-4 scrollbar-hide flex-1 bg-slate-50/30">
              <form onSubmit={handleCreateNewClient} className="space-y-6 animate-fade-in">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Cliente</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        required
                        value={newClientData.displayName}
                        onChange={e => setNewClientData({...newClientData, displayName: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold shadow-sm"
                        placeholder="Nome completo ou Razão Social"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        required
                        type="email"
                        value={newClientData.email}
                        onChange={e => setNewClientData({...newClientData, email: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold shadow-sm"
                        placeholder="email@cliente.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Contato</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        value={newClientData.phoneNumber}
                        onChange={e => setNewClientData({...newClientData, phoneNumber: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold shadow-sm"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-6">
                  <button 
                    type="submit"
                    disabled={isSavingNewClient}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-95"
                  >
                    {isSavingNewClient ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    <span>{isSavingNewClient ? 'Criando...' : 'Salvar Contratante'}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowNewClientPanel(false)}
                    className="w-full py-5 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        select { 
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); 
          background-position: right 1.8rem center; 
          background-repeat: no-repeat; 
          background-size: 1.2rem; 
          padding-right: 4rem; 
        }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.4) sepia(1) saturate(5) hue-rotate(190deg);
          cursor: pointer;
          scale: 1.1;
        }
      `}</style>
    </div>
  );
};

export default EventFormWidget;
