
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { HSEquipment, EquipmentStatus, UserRole } from '../types';
import { Speaker, Search, Plus, Wrench, Package, Info, Loader2, Camera, X, Save, Trash2, Edit2, CheckCircle } from 'lucide-react';
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
    // Fix: Cast snapshot to any to ensure docs access if typing is loose
    const unsub = onSnapshot(q, (snapshot: any) => {
      // Fix: Cast doc.data() as object to avoid spread type error
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
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 text-blue-500 mb-2">
            <Speaker size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Logística Patrimonial</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Equipamentos</h1>
          <p className="text-slate-500 font-bold mt-1">Inventário técnico e estado de conservação.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/30 active:scale-95"
          >
            <Plus size={20} />
            <span>Novo Item</span>
          </button>
        )}
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md p-5 rounded-[2.5rem] border border-slate-800 relative group max-w-2xl">
        <Search className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Pesquisar por nome do equipamento..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-6 py-4 bg-slate-950/50 border border-slate-800 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-white font-bold"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden group hover:border-blue-500/30 transition-all shadow-2xl flex flex-col">
              <div className="h-48 bg-slate-950 relative overflow-hidden">
                {item.photoUrlEquipamento ? (
                  <img src={item.photoUrlEquipamento} alt={item.displayName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800">
                    <Speaker size={64} />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md ${
                    item.statusEquipamento === EquipmentStatus.OPERANDO 
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                      : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                  }`}>
                    {item.statusEquipamento}
                  </span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <h4 className="text-xl font-black text-white tracking-tight leading-tight">{item.displayName}</h4>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">Patrimônio HS • {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>

                {isAdmin && (
                  <div className="flex gap-3 pt-4 border-t border-slate-800/50">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center space-x-2 py-3 bg-slate-800 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Edit2 size={14} /> <span>Editar</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id!)}
                      className="p-3 bg-slate-950 border border-slate-800 text-slate-600 hover:text-red-500 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-32 text-center bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-900">
              <Package size={64} className="mx-auto text-slate-800 mb-6" />
              <h3 className="text-2xl font-black text-white">Nenhum equipamento</h3>
              <p className="text-slate-500 mt-3 font-medium">Itens de inventário aparecerão aqui.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Novo/Editar Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={closeModal}></div>
          <div className="relative bg-slate-900 rounded-[3rem] w-full max-w-2xl shadow-2xl border border-white/5 overflow-hidden animate-fade-in my-auto">
            <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{editingId ? 'Editar Item' : 'Novo Equipamento'}</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão de patrimônio técnico da banda.</p>
              </div>
              <button onClick={closeModal} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-white rounded-2xl bg-slate-800 border border-slate-700 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-[2rem] bg-slate-950/50 group relative overflow-hidden">
                  {formData.photoUrlEquipamento ? (
                    <div className="w-full h-48 relative rounded-2xl overflow-hidden">
                      <img src={formData.photoUrlEquipamento} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, photoUrlEquipamento: ''})}
                        className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-xl hover:scale-110 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer">
                      <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-all border border-slate-800">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Camera size={32} />}
                      </div>
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Subir Foto</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isSubmitting} />
                    </label>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Nome do Equipamento</label>
                  <input 
                    required 
                    value={formData.displayName} 
                    onChange={e => setFormData({...formData, displayName: e.target.value})} 
                    placeholder="Ex: Mesa de Som Digital"
                    className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Status Operacional</label>
                  <select 
                    value={formData.statusEquipamento} 
                    onChange={e => setFormData({...formData, statusEquipamento: e.target.value as EquipmentStatus})}
                    className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white font-bold appearance-none"
                  >
                    <option value={EquipmentStatus.OPERANDO}>Operando Normalmente</option>
                    <option value={EquipmentStatus.MANUTENCAO}>Em Manutenção / Técnico</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 flex gap-4">
                <button type="button" onClick={closeModal} className="flex-1 py-5 bg-slate-800 text-slate-400 rounded-[2rem] font-black text-lg hover:text-white transition-all">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !formData.displayName} 
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg hover:bg-blue-500 transition-all shadow-2xl flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                  <span>{editingId ? 'Salvar Alterações' : 'Cadastrar Item'}</span>
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
