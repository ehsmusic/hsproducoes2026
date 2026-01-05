
import React, { useState, useEffect } from 'react';
import { useAuth, DEFAULT_AVATAR } from '../App';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole, TipoIntegrante } from '../types';
import { UserCircle, Mail, Phone, Hash, Shield, Save, Loader2, CheckCircle, Music, Star, MapPin } from 'lucide-react';

const Profile: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    pixKey: '',
    endereco: '',
    role: UserRole.CONTRATANTE,
    tipoIntegrante: 'Músico' as TipoIntegrante,
    funcao: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        phoneNumber: userProfile.phoneNumber || '',
        pixKey: userProfile.pixKey || '',
        endereco: userProfile.endereco || '',
        role: userProfile.role || UserRole.CONTRATANTE,
        tipoIntegrante: userProfile.tipoIntegrante || 'Músico',
        funcao: userProfile.funcao || ''
      });
    }
  }, [userProfile]);

  const isAdmin = userProfile?.role === UserRole.ADMIN;
  const isIntegrante = formData.role === UserRole.INTEGRANTE || isAdmin;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setLoading(true);
    setSuccess(false);

    try {
      const finalFuncao = formData.tipoIntegrante === 'Dançarina' ? 'Dançarina' : formData.funcao;
      
      const updateData: any = {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        pixKey: formData.pixKey,
        endereco: formData.endereco,
      };

      if (isAdmin) {
        updateData.role = formData.role;
      }

      if (isIntegrante) {
        updateData.tipoIntegrante = formData.tipoIntegrante;
        updateData.funcao = finalFuncao;
      }

      await updateDoc(doc(db, 'users', userProfile.uid), updateData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 text-blue-500 mb-2">
            <UserCircle size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Configurações da Conta</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Meu Perfil</h1>
          <p className="text-slate-500 font-bold mt-2">Dados profissionais e de contato no sistema.</p>
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-950 h-48 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 to-transparent"></div>
          <div className="absolute -bottom-16 left-12 group">
            <div className="w-36 h-36 rounded-[2rem] bg-slate-950 p-1.5 border-4 border-slate-900 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
              <img src={userProfile?.photoURL || DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover rounded-[1.5rem]" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="pt-24 p-12 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Nome Completo</label>
              <input 
                type="text" 
                value={formData.displayName}
                onChange={e => setFormData({...formData, displayName: e.target.value})}
                className="w-full px-6 py-5 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">E-mail</label>
              <input 
                type="email" 
                disabled
                value={userProfile?.email}
                className="w-full px-6 py-5 bg-slate-950/20 border border-slate-900 rounded-2xl text-slate-600 font-bold cursor-not-allowed"
              />
            </div>
          </div>

          {isIntegrante && (
            <div className="p-10 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] space-y-10">
              <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.3em] flex items-center">
                <Music size={18} className="mr-3" /> Especialização Técnica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Tipo de Integrante</label>
                  <select 
                    value={formData.tipoIntegrante}
                    onChange={e => setFormData({...formData, tipoIntegrante: e.target.value as TipoIntegrante})}
                    className="w-full px-6 py-5 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none text-white font-bold appearance-none"
                  >
                    <option value="Músico">Músico</option>
                    <option value="Dançarina">Dançarina</option>
                    <option value="Produção">Produção</option>
                  </select>
                </div>

                {formData.tipoIntegrante !== 'Dançarina' && (
                  <div className="space-y-3 animate-fade-in">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Função / Instrumento</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Baterista, Técnico de Som..."
                      value={formData.funcao}
                      onChange={e => setFormData({...formData, funcao: e.target.value})}
                      className="w-full px-6 py-5 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold transition-all placeholder-slate-700"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Endereço Residencial</label>
            <input 
              type="text" 
              placeholder="Rua, Número, Bairro, Cidade - UF"
              value={formData.endereco}
              onChange={e => setFormData({...formData, endereco: e.target.value})}
              className="w-full px-6 py-5 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none text-white font-bold transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">WhatsApp</label>
              <input 
                type="text" 
                placeholder="(00) 00000-0000"
                value={formData.phoneNumber}
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full px-6 py-5 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none text-white font-bold"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Chave PIX</label>
              <input 
                type="text" 
                placeholder="E-mail ou CPF"
                value={formData.pixKey}
                onChange={e => setFormData({...formData, pixKey: e.target.value})}
                className="w-full px-6 py-5 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none text-white font-bold"
              />
            </div>
          </div>

          <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-slate-800">
            <div className="w-full sm:w-auto">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 mb-2 block">Nível de Acesso</label>
              {isAdmin ? (
                <div className="relative">
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                    className="pl-12 pr-10 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-xs font-black uppercase tracking-widest outline-none appearance-none"
                  >
                    {Object.values(UserRole).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                </div>
              ) : (
                <div className="flex items-center space-x-3 bg-slate-800/30 px-6 py-3 rounded-2xl border border-slate-800">
                  <Shield size={18} className="text-blue-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Perfil: <span className="text-blue-400">{formData.role}</span></span>
                </div>
              )}
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto flex items-center justify-center space-x-3 px-14 py-5 rounded-[2rem] font-black text-lg transition-all shadow-2xl active:scale-95 ${
                success ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : success ? <CheckCircle size={24} /> : <Save size={24} />}
              <span>{success ? 'Perfil Atualizado' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
