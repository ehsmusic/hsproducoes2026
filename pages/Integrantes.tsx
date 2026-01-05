
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, UserRole, TipoIntegrante } from '../types';
import { Users, Loader2, Music, Shield, Phone, Star, Edit2, X, Save, MapPin, Hash } from 'lucide-react';
import { useAuth } from '../App';

const Integrantes: React.FC = () => {
  const { userProfile: currentUser } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), where('role', 'in', [UserRole.INTEGRANTE, UserRole.ADMIN]));
      const querySnapshot = await getDocs(q);
      setMembers(querySnapshot.docs.map(doc => doc.data() as UserProfile));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const handleEditClick = (member: UserProfile) => {
    setEditingMember(member);
    setEditFormData(member);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsUpdating(true);
    try {
      const finalFuncao = editFormData.tipoIntegrante === 'Dançarina' ? 'Dançarina' : editFormData.funcao;
      const dataToUpdate = {
        ...editFormData,
        funcao: finalFuncao
      };
      await updateDoc(doc(db, 'users', editingMember.uid), dataToUpdate);
      await fetchMembers();
      setEditingMember(null);
    } catch (err) {
      console.error("Erro ao atualizar integrante:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 text-blue-500 mb-2">
            <Users size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Time & Elenco</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Equipe</h1>
          <p className="text-slate-500 font-bold mt-1">Músicos, Dançarinas e Produção HS.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map(member => (
            <div key={member.uid} className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 hover:border-blue-500/30 transition-all shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Music size={120} className="text-blue-500" />
              </div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-slate-800 border border-slate-700 overflow-hidden shadow-2xl">
                    <img src={member.photoURL || "/avatar.png"} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">{member.displayName}</h3>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        member.role === UserRole.ADMIN ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => handleEditClick(member)}
                    className="p-3 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-2xl border border-slate-700 transition-all active:scale-90"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
              </div>

              <div className="mb-8 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/50 relative z-10">
                <div className="flex items-center text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  <Star size={12} className="mr-2" />
                  {member.tipoIntegrante || 'Pendente'}
                  {member.funcao && member.tipoIntegrante !== 'Dançarina' && (
                    <>
                      <span className="mx-2 text-slate-700">•</span>
                      <span className="text-slate-300">{member.funcao}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-4 mb-8 relative z-10">
                <div className="flex items-center text-xs font-bold text-slate-500">
                  <Phone size={14} className="mr-3 text-slate-700" /> {member.phoneNumber || "Sem WhatsApp"}
                </div>
                <div className="flex items-center text-xs font-bold text-slate-500">
                  <MapPin size={14} className="mr-3 text-slate-700" /> {member.endereco || "Endereço não informado"}
                </div>
              </div>

              <div className="flex gap-4 relative z-10">
                <button className="flex-1 py-3.5 bg-slate-800 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all border border-slate-700">Agenda Pessoal</button>
                <button className="flex-1 py-3.5 bg-slate-800 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all border border-slate-700">Pagamentos</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição de Integrante (Admin Only) */}
      {editingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setEditingMember(null)}></div>
          
          <div className="relative bg-slate-900 rounded-[3rem] w-full max-w-4xl shadow-2xl border border-white/5 overflow-hidden my-auto animate-fade-in">
            <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Editar Integrante</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Gerenciamento de dados técnicos e pessoais.</p>
              </div>
              <button onClick={() => setEditingMember(null)} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-white rounded-2xl bg-slate-800 border border-slate-700 transition-all active:scale-95"><X size={24} /></button>
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

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Chave PIX</label>
                    <input 
                      value={editFormData.pixKey}
                      onChange={e => setEditFormData({...editFormData, pixKey: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] ml-2">Tipo de Integrante</label>
                    <select 
                      value={editFormData.tipoIntegrante}
                      onChange={e => setEditFormData({...editFormData, tipoIntegrante: e.target.value as TipoIntegrante})}
                      className="w-full px-6 py-4 bg-slate-950 border border-amber-500/20 rounded-2xl outline-none text-white font-bold appearance-none"
                    >
                      <option value="Músico">Músico</option>
                      <option value="Dançarina">Dançarina</option>
                      <option value="Produção">Produção</option>
                    </select>
                  </div>

                  {editFormData.tipoIntegrante !== 'Dançarina' && (
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Função / Instrumento</label>
                      <input 
                        value={editFormData.funcao}
                        onChange={e => setEditFormData({...editFormData, funcao: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white font-bold"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Endereço Completo</label>
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
                <button type="button" onClick={() => setEditingMember(null)} className="flex-1 py-5 bg-slate-800 text-slate-400 rounded-[2rem] font-black text-lg hover:text-white transition-all">Descartar</button>
                <button type="submit" disabled={isUpdating} className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg hover:bg-blue-500 transition-all shadow-2xl flex items-center justify-center space-x-3">
                  {isUpdating ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrantes;
