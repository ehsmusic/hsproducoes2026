
import React, { useState, useEffect } from 'react';
import { useAuth, DEFAULT_AVATAR } from '../App';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole, TipoIntegrante } from '../types';
import { 
  UserCircle, Mail, MapPin, Shield, Save, 
  Loader2, CheckCircle, Camera, Music, Star, 
  Phone, Hash, ChevronRight
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
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="flex items-center space-x-3 text-blue-600 mb-2">
            <UserCircle size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Gestão de Identidade HS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Meu Perfil</h1>
          <p className="text-slate-500 font-bold mt-2 text-sm">Atualize suas credenciais e informações de contato.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)]">
        {/* Banner Area (Clean Light) */}
        <div className="bg-gradient-to-r from-blue-50 via-white to-slate-50 h-56 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 to-transparent"></div>
          
          {/* Avatar Position */}
          <div className="absolute -bottom-16 left-8 md:left-16 group">
            <div className="relative w-44 h-44 rounded-[2.5rem] bg-white p-2 border border-slate-100 shadow-2xl overflow-hidden">
              {uploading && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
              )}
              <img 
                src={formData.photoURL || DEFAULT_AVATAR} 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-[2rem] transition-transform duration-700 group-hover:scale-110" 
              />
              <label className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]">
                <Camera size={24} className="text-white mb-2" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Alterar Foto</span>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="pt-24 p-8 md:p-16 space-y-12">
          {/* Nome e Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo Artístico</label>
              <input 
                required
                type="text" 
                value={formData.displayName}
                onChange={e => setFormData({...formData, displayName: e.target.value})}
                className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none text-slate-900 font-bold transition-all text-base placeholder-slate-300"
                placeholder="Ex: Helder Santos"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo (Login)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-slate-300">
                  <Mail size={22} />
                </div>
                <input 
                  type="email" 
                  disabled
                  value={userProfile?.email}
                  className="w-full pl-16 pr-8 py-6 bg-slate-100/50 border border-slate-200 rounded-[1.8rem] text-slate-400 font-bold cursor-not-allowed italic text-base"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp e CPF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp para Logística</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-600 transition-colors">
                  <Phone size={22} />
                </div>
                <input 
                  type="text" 
                  value={formData.phoneNumber}
                  onChange={e => setFormData({...formData, phoneNumber: maskPhone(e.target.value)})}
                  className="w-full pl-16 pr-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none text-slate-900 font-bold transition-all text-base placeholder-slate-300"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF (Obrigatório p/ Contratos)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-600 transition-colors">
                  <Hash size={22} />
                </div>
                <input 
                  type="text" 
                  value={formData.pixKey}
                  onChange={e => setFormData({...formData, pixKey: maskCPF(e.target.value)})}
                  className="w-full pl-16 pr-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none text-slate-900 font-bold transition-all text-base placeholder-slate-300"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Residencial</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-600 transition-colors">
                <MapPin size={22} />
              </div>
              <input 
                type="text" 
                placeholder="Rua, Número, Bairro, Cidade - UF"
                value={formData.endereco}
                onChange={e => setFormData({...formData, endereco: e.target.value})}
                className="w-full pl-16 pr-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none text-slate-900 font-bold transition-all text-base placeholder-slate-300"
              />
            </div>
          </div>

          {/* Seção Integrante (Destaque Suave) */}
          {isIntegrante && (
            <div className="p-10 bg-blue-50 border border-blue-100 rounded-[2.5rem] space-y-10 animate-fade-in">
              <div className="flex items-center space-x-3 text-blue-600">
                <Music size={18} />
                <h3 className="text-xs font-black uppercase tracking-[0.3em]">Perfil Técnico HS</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Tipo de Membro</label>
                  <select 
                    value={formData.tipoIntegrante}
                    onChange={e => setFormData({...formData, tipoIntegrante: e.target.value as TipoIntegrante})}
                    className="w-full px-8 py-6 bg-white border border-blue-200 rounded-[1.5rem] outline-none text-slate-900 font-bold appearance-none cursor-pointer focus:border-blue-500 shadow-sm"
                  >
                    <option value="Músico">Músico</option>
                    <option value="Dançarina">Dançarina</option>
                    <option value="Produção">Produção</option>
                  </select>
                </div>

                {formData.tipoIntegrante !== 'Dançarina' && (
                  <div className="space-y-3 animate-fade-in">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Função Artística</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Baterista, Guitarrista..."
                      value={formData.funcao}
                      onChange={e => setFormData({...formData, funcao: e.target.value})}
                      className="w-full px-8 py-6 bg-white border border-blue-200 rounded-[1.5rem] outline-none focus:border-blue-500 text-slate-900 font-bold transition-all placeholder-slate-300 shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer e Salvamento */}
          <div className="pt-12 flex flex-col sm:flex-row items-center justify-between gap-10 border-t border-slate-100">
            <div className="w-full sm:w-auto">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Autorização de Sistema</label>
              <div className="flex items-center space-x-3 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                <Shield size={16} className="text-blue-600" />
                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-600">
                  {userProfile?.role}
                </span>
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={loading || uploading}
              className={`w-full sm:w-auto flex items-center justify-center space-x-4 px-16 py-7 rounded-[2rem] font-black text-lg transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 ${
                success ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : success ? (
                <CheckCircle size={24} />
              ) : (
                <Save size={24} />
              )}
              <span>{success ? 'Dados Atualizados' : 'Confirmar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Informativo Premium */}
      <div className="bg-slate-900 p-12 rounded-[3.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Star size={80} className="text-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h4 className="text-2xl font-black text-white tracking-tighter mb-4">Integridade de Dados</h4>
          <p className="text-slate-400 font-medium leading-relaxed">
            As informações deste perfil são utilizadas para a geração automática de contratos jurídicos e escalas de show. Mantenha seu WhatsApp e CPF sempre atualizados para evitar atrasos na logística e pagamentos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
