
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { Briefcase, Search, Loader2, Mail, Phone, MapPin, Trash2, Edit2, X, ChevronRight, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../App';
import { Link } from 'react-router-dom';

const Clients: React.FC = () => {
  const { userProfile: currentUser } = useAuth();
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});

  const fetchClients = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), where('role', '==', UserRole.CONTRATANTE));
      const querySnapshot = await getDocs(q);
      setClients(querySnapshot.docs.map(doc => doc.data() as UserProfile));
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const handleDelete = async (uid: string) => {
    if (!window.confirm("Remover este contratante do sistema?")) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      setClients(clients.filter(c => c.uid !== uid));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (client: UserProfile) => {
    setEditingClient(client);
    setEditFormData(client);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', editingClient.uid), editFormData);
      await fetchClients();
      setEditingClient(null);
    } catch (err) {
      console.error("Erro ao atualizar contratante:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = clients.filter(c => 
    c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center space-x-3 text-blue-600 mb-2">
            <Briefcase size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Carteira de Clientes</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Contratantes</h1>
          <p className="text-slate-500 font-bold mt-2">Gestão de parceiros e solicitantes de shows.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 p-5 rounded-[2.5rem] relative group shadow-sm max-w-2xl">
        <Search className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Pesquisar por nome ou e-mail..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-8 py-4 bg-slate-50/50 border border-slate-100 rounded-[2rem] focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-bold"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Base...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(client => (
            <div key={client.uid} className="bg-white border border-slate-100 rounded-[3rem] p-8 hover:border-blue-500/30 transition-all group shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_60px_-15px_rgba(59,130,246,0.15)] flex flex-col justify-between h-full relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-sm p-1">
                      <img src={client.photoURL || "/avatar.png"} alt="" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{client.displayName}</h3>
                      <div className="flex items-center text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">
                        <ShieldCheck size={12} className="mr-1.5" /> Cliente Verificado
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => handleEditClick(client)}
                      className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-blue-600 hover:bg-white border border-slate-100 rounded-xl transition-all active:scale-90"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>
                
                <div className="space-y-4 mb-10 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-50">
                  <div className="flex items-center text-xs font-bold text-slate-500">
                    <Mail size={16} className="mr-3 text-blue-500/50 flex-shrink-0" /> <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center text-xs font-bold text-slate-500">
                    <Phone size={16} className="mr-3 text-blue-500/50 flex-shrink-0" /> {client.phoneNumber || "WhatsApp não informado"}
                  </div>
                  <div className="flex items-center text-xs font-bold text-slate-500">
                    <MapPin size={16} className="mr-3 text-blue-500/50 flex-shrink-0" /> <span className="truncate">{client.endereco || "Localização não informada"}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-50 relative z-10">
                <Link 
                  to={`/clients/${client.uid}`}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all text-center flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  <ChevronRight size={16} className="mr-2" /> Dossiê Completo
                </Link>
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(client.uid)}
                    className="w-12 h-12 bg-white border border-slate-100 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all flex items-center justify-center active:scale-95"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                <Briefcase size={32} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum contratante localizado.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Edição - Premium White Theme */}
      {editingClient && (
        <div className="fixed inset-0 z-[100] p-4 md:p-12 overflow-y-auto animate-fade-in flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setEditingClient(null)}></div>
          
          <div className="relative bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl border border-white overflow-hidden animate-scale-in">
            <header className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
                  <Edit2 size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Ajustar Cadastro</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Sincronização de dados de faturamento.</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingClient(null)} 
                className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 transition-all active:scale-95 shadow-sm"
              >
                <X size={28} />
              </button>
            </header>

            <form onSubmit={handleSaveEdit} className="p-10 md:p-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Acesso (Role)</label>
                    <select 
                      value={editFormData.role}
                      onChange={e => setEditFormData({...editFormData, role: e.target.value as UserRole})}
                      className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.5rem] outline-none text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all appearance-none"
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                    <input 
                      value={editFormData.phoneNumber || ''}
                      onChange={e => setEditFormData({...editFormData, phoneNumber: e.target.value})}
                      className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.5rem] outline-none text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documento (CPF)</label>
                    <input 
                      value={editFormData.pixKey || ''}
                      onChange={e => setEditFormData({...editFormData, pixKey: e.target.value})}
                      className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.5rem] outline-none text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Comercial</label>
                    <textarea 
                      rows={3}
                      value={editFormData.endereco || ''}
                      onChange={e => setEditFormData({...editFormData, endereco: e.target.value})}
                      className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.5rem] outline-none text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all resize-none leading-relaxed"
                      placeholder="Rua, Número, Cidade - UF"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-16 flex flex-col md:flex-row gap-6 pt-10 border-t border-slate-50">
                <button type="button" onClick={() => setEditingClient(null)} className="flex-1 py-6 bg-white text-slate-400 border border-slate-200 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-all active:scale-95">Descartar</button>
                <button 
                  type="submit" 
                  disabled={isUpdating} 
                  className="flex-[2] py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  <span>{isUpdating ? 'Processando...' : 'Confirmar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
