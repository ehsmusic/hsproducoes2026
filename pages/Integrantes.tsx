
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, UserRole, TipoIntegrante } from '../types';
import { Users, Loader2, Music, Shield, Phone, Star, Edit2, X, Save, MapPin, Hash, ShieldCheck, Calendar, Briefcase } from 'lucide-react';
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
    <div className="space-y-12 animate-fade-in pb-20 px-1 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center space-x-3 text-blue-600 mb-2">
            <Users size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Time & Elenco HS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Equipe</h1>
          <p className="text-slate-500 font-bold mt-2">Músicos, Dançarinas e Produção Executiva.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Elenco...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map(member => (
            <div key={member.uid} className="bg-white border border-slate-100 rounded-[3rem] p-8 hover:border-blue-500/30 transition-all shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_60px_-15px_rgba(59,130,246,0.15)] relative overflow-hidden group flex flex-col justify-between h-full">
              <div className="absolute -top-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                <Music size={140} className="text-slate-900" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 p-1 border border-slate-100 shadow-sm overflow-hidden flex-shrink-0">
                      <img src={member.photoURL || "/avatar.png"} alt="" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{member.displayName}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          member.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => handleEditClick(member)}
                      className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-blue-600 hover:bg-white border border-slate-100 rounded-xl transition-all active:scale-90 shadow-sm"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>

                <div className="mb-8 p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-50 relative z-10">
                  <div className="flex items-center text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">
                    <Star size={12} className="mr-2" />
                    {member.tipoIntegrante || 'Pendente'}
                    {member.funcao && member.tipoIntegrante !== 'Dançarina' && (
                      <>
                        <span className="mx-2 text-slate-200">|</span>
                        <span className="text-slate-600">{member.funcao}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4 mb-10 relative z-10">
                  <div className="flex items-center text-xs font-bold text-slate-500">
                    <Phone size={16} className="mr-3 text-blue-500/40" /> {member.phoneNumber || "Sem WhatsApp"}
                  </div>
                  <div className="flex items-center text-xs font-bold text-slate-500">
                    <MapPin size={16} className="mr-3 text-blue-500/40" /> <span className="truncate">{member.endereco || "Não informado"}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 relative z-10 pt-6 border-t border-slate-50">
                <button className="flex-1 py-4 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm">Agenda</button>
                <button className="flex-1 py-4 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm">Cachês</button>
              </div>
            </div>
          ))}

          {members.length === 0 && !loading && (
            <div className="col-span-full py-32 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                <Users size={32} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum integrante cadastrado.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Edição - Premium White Theme */}
      {editingMember && (
        <div className="fixed inset-0 z-[100] p-4 md:p-12 overflow-y-auto animate-fade-in flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setEditingMember(null)}></div>
          
          <div className="relative bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl border border-white overflow-hidden animate-scale-in">
            <header className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                  <Edit2 size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Ajustar Perfil</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Sincronização de dados técnicos e escalas.</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingMember(null)} 
                className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 transition-all active:scale-95 shadow-sm"
              >
                <X size={28} />
              </button>
            </header>

            <form onSubmit={handleSaveEdit} className="p-10 md:p-16 max-h-[75vh] overflow-y-auto custom-scrollbar-light">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Acesso (Role)</label>
                    <select 
                      value={editFormData.role}
                      onChange={e => setEditFormData({...editFormData, role: e.target.value as UserRole})}
                      className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] outline-none text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all appearance-none"
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Contato</label>
                    <input 
                      value={editFormData.phoneNumber || ''}
                      onChange={e => setEditFormData({...editFormData, phoneNumber: e.target.value})}
                      className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] outline-none text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF para Pagamentos</label>
                    <input 
                      value={editFormData.pixKey || ''}
                      onChange={e => setEditFormData({...editFormData, pixKey: e.target.value})}
                      className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] outline-none text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Tipo de Integrante</label>
                    <select 
                      value={editFormData.tipoIntegrante}
                      onChange={e => setEditFormData({...editFormData, tipoIntegrante: e.target.value as TipoIntegrante})}
                      className="w-full px-8 py-6 bg-blue-50/30 border border-blue-100 rounded-[1.8rem] outline-none text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all appearance-none"
                    >
                      <option value="Músico">Músico</option>
                      <option value="Dançarina">Dançarina</option>
                      <option value="Produção">Produção</option>
                    </select>
                  </div>

                  {editFormData.tipoIntegrante !== 'Dançarina' && (
                    <div className="space-y-3 animate-fade-in">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Função / Instrumento</label>
                      <input 
                        value={editFormData.funcao || ''}
                        onChange={e => setEditFormData({...editFormData, funcao: e.target.value})}
                        className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] outline-none text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all"
                        placeholder="Ex: Tecladista, Guitarrista..."
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Residencial</label>
                    <textarea 
                      rows={3}
                      value={editFormData.endereco || ''}
                      onChange={e => setEditFormData({...editFormData, endereco: e.target.value})}
                      className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] outline-none text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all resize-none leading-relaxed"
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-16 flex flex-col md:flex-row gap-6 pt-10 border-t border-slate-50 bg-white sticky bottom-0">
                <button type="button" onClick={() => setEditingMember(null)} className="flex-1 py-6 bg-white text-slate-400 border border-slate-200 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-all active:scale-95 shadow-sm">Descartar</button>
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

export default Integrantes;
