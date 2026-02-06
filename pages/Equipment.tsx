
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { HSEquipment, EquipmentStatus, UserRole } from '../types';
import { Speaker, Search, Plus, Wrench, Package, Info, Loader2, Camera, X, Save, Trash2, Edit2, CheckCircle, Layout } from 'lucide-react';
import { useAuth } from '../App';

const CLOUD_NAME = "dvq0tmbil";
const UPLOAD_PRESET = "hsoficial";

const Equipment: React.FC = () => {
  const { userProfile } = useAuth();
  const [items, setItems] = useState<HSEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    displayName: '',
    statusEquipamento: EquipmentStatus.OPERANDO,
    photoUrlEquipamento: ''
  });

  const isAdmin = userProfile?.role === UserRole.ADMIN;

  useEffect(() => {
    const q = query(collection(db, 'equipamentos'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot: any) => {
      setItems(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() as object } as HSEquipment)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
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
      setFormData(prev => ({ ...prev, photoUrlEquipamento: fileData.secure_url }));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Erro ao subir imagem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, 'equipamentos', editingId), {
          displayName: formData.displayName,
          statusEquipamento: formData.statusEquipamento,
          photoUrlEquipamento: formData.photoUrlEquipamento
        });
      } else {
        await addDoc(collection(db, 'equipamentos'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      closeModal();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: HSEquipment) => {
    setEditingId(item.id || null);
    setFormData({
      displayName: item.displayName,
      statusEquipamento: item.statusEquipamento,
      photoUrlEquipamento: item.photoUrlEquipamento || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remover este item do inventário permanentemente?")) return;
    try {
      await deleteDoc(doc(db, 'equipamentos', id));
    } catch (err) {
      console.error(err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ displayName: '', statusEquipamento: EquipmentStatus.OPERANDO, photoUrlEquipamento: '' });
  };

  const filteredItems = items.filter(i => i.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-12 animate-fade-in pb-20 px-1 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center space-x-3 text-blue-600 mb-2">
            <Speaker size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Logística Patrimonial</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Equipamentos</h1>
          <p className="text-slate-500 font-bold mt-2">Inventário técnico e estado de conservação.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center space-x-3 bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>Novo Item</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 p-5 rounded-[2.5rem] relative group shadow-sm max-w-2xl">
        <Search className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Pesquisar por nome do equipamento..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-8 py-4 bg-slate-50/50 border border-slate-100 rounded-[2rem] focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-bold"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditoria de Patrimônio...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden group hover:border-blue-500/30 transition-all shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_60px_-15px_rgba(59,130,246,0.15)] flex flex-col">
              <div className="h-48 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                {item.photoUrlEquipamento ? (
                  <img src={item.photoUrlEquipamento} alt={item.displayName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <Speaker size={64} />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm ${
                    item.statusEquipamento === EquipmentStatus.OPERANDO 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-amber-50 text-amber-600 border-amber-100"
                  }`}>
                    {item.statusEquipamento}
                  </span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between space-y-8">
                <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">{item.displayName}</h4>
                  <div className="flex items-center space-x-2 mt-3">
                    <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Patrimônio HS • {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex gap-3 pt-6 border-t border-slate-50">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center space-x-2 py-3 bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-500/20 text-slate-400 hover:text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      <Edit2 size={14} /> <span>Editar</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id!)}
                      className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
              <Package size={64} className="mx-auto text-slate-200 mb-6" />
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Nenhum equipamento</h3>
              <p className="text-slate-400 mt-2 font-black uppercase text-[10px] tracking-widest">Os itens cadastrados aparecerão aqui.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Novo/Editar Item - Premium White */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={closeModal}></div>
          
          <div className="relative bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border border-white overflow-hidden animate-scale-in my-auto">
            <header className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                  {editingId ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{editingId ? 'Editar Item' : 'Novo Ativo'}</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Gestão de patrimônio técnico da banda.</p>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 transition-all active:scale-95 shadow-sm"
              >
                <X size={28} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-10 space-y-10">
              <div className="space-y-8">
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50 group relative overflow-hidden transition-all hover:border-blue-500/30">
                  {formData.photoUrlEquipamento ? (
                    <div className="w-full h-56 relative rounded-[2rem] overflow-hidden shadow-sm">
                      <img src={formData.photoUrlEquipamento} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, photoUrlEquipamento: ''})}
                        className="absolute top-4 right-4 bg-red-600 text-white p-3 rounded-2xl shadow-xl hover:scale-110 hover:bg-red-700 transition-all active:scale-95"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-6">
                      <div className="w-20 h-20 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-all shadow-sm">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Camera size={32} />}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Vincular Identidade Visual</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isSubmitting} />
                    </label>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação do Equipamento</label>
                  <input 
                    required 
                    value={formData.displayName} 
                    onChange={e => setFormData({...formData, displayName: e.target.value})} 
                    placeholder="Ex: Mesa de Som Digital Yamaha"
                    className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] outline-none text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all text-base"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado Operacional</label>
                  <div className="relative">
                    <select 
                      value={formData.statusEquipamento} 
                      onChange={e => setFormData({...formData, statusEquipamento: e.target.value as EquipmentStatus})}
                      className="w-full px-8 py-6 bg-slate-50/50 border border-slate-200 rounded-[1.8rem] outline-none text-slate-900 font-bold appearance-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value={EquipmentStatus.OPERANDO}>Disponível / Operando</option>
                      <option value={EquipmentStatus.MANUTENCAO}>Indisponível / Manutenção</option>
                    </select>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Layout size={18} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row gap-6">
                <button type="button" onClick={closeModal} className="flex-1 py-6 bg-white text-slate-400 border border-slate-200 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-all active:scale-95 shadow-sm">Descartar</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !formData.displayName} 
                  className="flex-[2] py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  <span>{editingId ? 'Atualizar Inventário' : 'Confirmar Cadastro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipment;
