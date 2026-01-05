
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { Briefcase, Search, MoreVertical, Loader2, User, Phone, Mail, Trash2, Edit2, X, Save, MapPin } from 'lucide-react';
import { useAuth } from '../App';

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
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 text-blue-500 mb-2">
            <Briefcase size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Carteira de Clientes</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Contratantes</h1>
          <p className="text-slate-500 font-bold mt-1">Gestão de parceiros e solicitantes de shows.</p>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md p-5 rounded-[2.5rem] border border-slate-800 relative group">
        <Search className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Pesquisar por nome ou e-mail..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-6 py-4 bg-slate-950/50 border border-slate-800 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-white font-bold"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(client => (
            <div key={client.uid} className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 hover:border-blue-500/30 transition-all group shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden shadow-inner">
                    <img src={client.photoURL || "/avatar.png"} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">{client.displayName}</h3>
                    <div className="flex items-center text-xs font-black text-blue-500 uppercase tracking-widest mt-1">
                      <Briefcase size={12} className="mr-1.5" /> Cliente Ativo
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => handleEditClick(client)}
                    className="p-3 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-2xl border border-slate-700 transition-all active:scale-90"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-sm font-bold text-slate-500">
                  <Mail size={16} className="mr-3 text-slate-700" /> {client.email}
                </div>
                <div className="flex items-center text-sm font-bold text-slate-500">
                  <Phone size={16} className="mr-3 text-slate-700" /> {client.phoneNumber || "Não informado"}
                </div>
                <div className="flex items-center text-sm font-bold text-slate-500">
                  <MapPin size={16} className="mr-3 text-slate-700" /> {client.endereco || "Endereço não informado"}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-800/50">
                <button className="flex-1 py-3 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Ver Histórico</button>
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(client.uid)}
                    className="p-3 bg-slate-950 border border-slate-800 text-slate-500 hover:text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição de Contratante (Admin Only) */}
      {editingClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setEditingClient(null)}></div>
          
          <div className="relative bg-slate-900 rounded-[3rem] w-full max-w-4xl shadow-2xl border border-white/5 overflow-hidden my-auto animate-fade-in">
            <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Editar Contratante</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Atualização de dados de faturamento e contato.</p>
              </div>
              <button onClick={() => setEditingClient(null)} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-white rounded-2xl bg-slate-800 border border-slate-700 transition-all active:scale-95"><X size={24} /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-10 max-h-[75vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] ml-2">Nível de Acesso (Role)</label>
                    <select 
                      value={editFormData.role}
                      onChange={e => setEditFormData({...editFormData, role: e.target.value as UserRole})}
                      className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white font-bold appearance-none"
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">WhatsApp</label>
                    <input 
                      value={editFormData.phoneNumber}
                      onChange={e => setEditFormData({...editFormData, phoneNumber: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Chave PIX</label>
                    <input 
                      value={editFormData.pixKey}
                      onChange={e => setEditFormData({...editFormData, pixKey: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Endereço Residencial/Comercial</label>
                    <textarea 
                      rows={3}
                      value={editFormData.endereco}
                      onChange={e => setEditFormData({...editFormData, endereco: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white font-bold resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12 sticky bottom-0 pt-6 bg-slate-900 flex gap-4">
                <button type="button" onClick={() => setEditingClient(null)} className="flex-1 py-5 bg-slate-800 text-slate-400 rounded-[2rem] font-black text-lg hover:text-white transition-all">Descartar</button>
                <button type="submit" disabled={isUpdating} className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg hover:bg-blue-500 transition-all shadow-2xl flex items-center justify-center space-x-3">
                  {isUpdating ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                  <span>Salvar Atualizações</span>
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
