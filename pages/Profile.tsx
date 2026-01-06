
import React, { useState, useEffect } from 'react';
import { useAuth, DEFAULT_AVATAR } from '../App';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole, TipoIntegrante } from '../types';
import { 
  UserCircle, Mail, MapPin, Shield, Save, 
  Loader2, CheckCircle, Camera, Music, Star, 
  Phone, Hash
} from 'lucide-react';

const CLOUD_NAME = "dvq0tmbil";
const UPLOAD_PRESET = "hsoficial";

const Profile: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    endereco: '',
    photoURL: '',
    phoneNumber: '',
    pixKey: '', // Usado para o CPF conforme solicitado
    tipoIntegrante: 'Músico' as TipoIntegrante,
    funcao: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        endereco: userProfile.endereco || '',
        photoURL: userProfile.photoURL || '',
        phoneNumber: userProfile.phoneNumber || '',
        pixKey: userProfile.pixKey || '',
        tipoIntegrante: userProfile.tipoIntegrante || 'Músico',
        funcao: userProfile.funcao || ''
      });
    }
  }, [userProfile]);

  // Máscaras de entrada
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    data.append("cloud_name", CLOUD_NAME);

    try {
      const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data
      });
      const fileData = await resp.json();
      if (fileData.secure_url) {
        setFormData(prev => ({ ...prev, photoURL: fileData.secure_url }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Erro ao subir imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setLoading(true);
    setSuccess(false);

    try {
      const isIntegrante = userProfile.role === UserRole.INTEGRANTE;
      const finalFuncao = formData.tipoIntegrante === 'Dançarina' ? 'Dançarina' : formData.funcao;
      
      const updateData: any = {
        displayName: formData.displayName,
        endereco: formData.endereco,
        photoURL: formData.photoURL,
        phoneNumber: formData.phoneNumber,
        pixKey: formData.pixKey,
      };

      if (isIntegrante) {
        updateData.tipoIntegrante = formData.tipoIntegrante;
        updateData.funcao = finalFuncao;
      }

      await updateDoc(doc(db, 'users', userProfile.uid), updateData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const isIntegrante = userProfile?.role === UserRole.INTEGRANTE;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 text-blue-500 mb-2">
            <UserCircle size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Gerenciamento de Identidade</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Meu Perfil</h1>
          <p className="text-slate-500 font-bold mt-2 text-sm">Atualize suas informações profissionais no ecossistema HS.</p>
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Banner Area */}
        <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-950 h-48 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 to-transparent"></div>
          
          {/* Avatar Position */}
          <div className="absolute -bottom-16 left-8 md:left-12 group">
            <div className="relative w-40 h-40 rounded-[2.5rem] bg-slate-950 p-1.5 border-4 border-slate-900 shadow-2xl overflow-hidden">
              {uploading && (
                <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
              )}
              <img 
                src={formData.photoURL || DEFAULT_AVATAR} 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-[2rem] transition-transform duration-700 group-hover:scale-110" 
              />
              <label className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]">
                <Camera size={24} className="text-white mb-2" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Alterar Foto</span>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="pt-24 p-8 md:p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Nome Completo */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Nome Completo *</label>
              <input 
                required
                type="text" 
                value={formData.displayName}
                onChange={e => setFormData({...formData, displayName: e.target.value})}
                className="w-full px-6 py-5 bg-slate-950/50 border border-slate-800 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold transition-all"
                placeholder="Seu nome artístico ou oficial"
              />
            </div>

            {/* E-mail (Read Only) */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">E-mail de Acesso</label>
              <div className="relative">
                <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" />
                <input 
                  type="email" 
                  disabled
                  value={userProfile?.email}
                  className="w-full pl-14 pr-6 py-5 bg-slate-950/20 border border-slate-900 rounded-[1.5rem] text-slate-600 font-bold cursor-not-allowed italic"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Whatsapp */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">WhatsApp</label>
              <div className="relative">
                <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" />
                <input 
                  type="text" 
                  value={formData.phoneNumber}
                  onChange={e => setFormData({...formData, phoneNumber: maskPhone(e.target.value)})}
                  className="w-full pl-14 pr-6 py-5 bg-slate-950/50 border border-slate-800 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {/* CPF */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">CPF (Fins Contratuais)</label>
              <div className="relative">
                <Hash size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" />
                <input 
                  type="text" 
                  value={formData.pixKey}
                  onChange={e => setFormData({...formData, pixKey: maskCPF(e.target.value)})}
                  className="w-full pl-14 pr-6 py-5 bg-slate-950/50 border border-slate-800 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold transition-all"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Endereço Residencial</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" />
              <input 
                type="text" 
                placeholder="Rua, Número, Bairro, Cidade - UF"
                value={formData.endereco}
                onChange={e => setFormData({...formData, endereco: e.target.value})}
                className="w-full pl-14 pr-6 py-5 bg-slate-950/50 border border-slate-800 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold transition-all"
              />
            </div>
          </div>

          {/* Integrante Logic Section */}
          {isIntegrante && (
            <div className="p-8 md:p-10 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] space-y-8 animate-fade-in">
              <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.3em] flex items-center">
                <Music size={18} className="mr-3" /> Especialização HS
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Tipo de Integrante</label>
                  <select 
                    value={formData.tipoIntegrante}
                    onChange={e => setFormData({...formData, tipoIntegrante: e.target.value as TipoIntegrante})}
                    className="w-full px-6 py-5 bg-slate-950/50 border border-slate-800 rounded-[1.5rem] outline-none text-white font-bold appearance-none cursor-pointer focus:border-blue-500"
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
                      className="w-full px-6 py-5 bg-slate-950/50 border border-slate-800 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold transition-all placeholder-slate-800"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-slate-800">
            <div className="w-full sm:w-auto">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 mb-2 block">Nível de Acesso</label>
              <div className="flex items-center space-x-3 bg-slate-800/30 px-6 py-3 rounded-2xl border border-slate-800">
                <Shield size={16} className="text-amber-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                  {userProfile?.role}
                </span>
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={loading || uploading}
              className={`w-full sm:w-auto flex items-center justify-center space-x-4 px-16 py-6 rounded-[2rem] font-black text-xl transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 ${
                success ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : success ? (
                <CheckCircle size={24} />
              ) : (
                <Save size={24} />
              )}
              <span>{success ? 'Perfil Atualizado' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
