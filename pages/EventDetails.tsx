
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, updateDoc, onSnapshot, collection, query, where, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, DEFAULT_AVATAR } from '../App';
import { HSEvent, EventStatus, UserRole, UserProfile, HSEventContratacao, HSEquipment, HSEquipmentAllocation, HSEventFinance } from '../types';
import { 
  ChevronLeft, Calendar, MapPin, DollarSign, CheckCircle2, 
  Clock, Users, Loader2, Utensils, Music, Sparkles, Edit2, X, Plus, Trash2, Save, Speaker, Box, TrendingUp, Truck, Star, Instagram, Globe, Mail, Hash, AlignLeft, ThumbsUp, ThumbsDown
} from 'lucide-react';

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();
  
  const [event, setEvent] = useState<HSEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'equipe' | 'estrutura' | 'financeiro' | 'orcamento'>('info');
  
  const [integrantes, setIntegrantes] = useState<UserProfile[]>([]);
  const [contratacoes, setContratacoes] = useState<HSEventContratacao[]>([]);
  const [localContratacoes, setLocalContratacoes] = useState<HSEventContratacao[]>([]);
  const [allEquipment, setAllEquipment] = useState<HSEquipment[]>([]);
  const [allocations, setAllocations] = useState<HSEquipmentAllocation[]>([]);
  const [localAllocations, setLocalAllocations] = useState<HSEquipmentAllocation[]>([]);
  const [clients, setClients] = useState<UserProfile[]>([]);
  
  const [financeDoc, setFinanceDoc] = useState<HSEventFinance | null>(null);
  const [isSavingFinance, setIsSavingFinance] = useState(false);
  const [financeInputs, setFinanceInputs] = useState({ valorAlimentacao: 0, valorTransporte: 0, valorOutros: 0 });

  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [showEquipSelector, setShowEquipSelector] = useState(false);
  const [isSavingEquipe, setIsSavingEquipe] = useState(false);
  const [isSavingEstrutura, setIsSavingEstrutura] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<HSEvent>>({});

  const isAdmin = userProfile?.role === UserRole.ADMIN;
  const isContratante = userProfile?.role === UserRole.CONTRATANTE;
  const isIntegrante = userProfile?.role === UserRole.INTEGRANTE;

  // Carregamento da aba específica via URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['info', 'equipe', 'estrutura', 'financeiro', 'orcamento'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Carregamento de catálogos
  useEffect(() => {
    const fetchBasics = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => d.data() as UserProfile);
      setIntegrantes(allUsers);
      setClients(allUsers.filter(u => u.role === UserRole.CONTRATANTE));
      
      const equipSnap = await getDocs(collection(db, 'equipamentos'));
      setAllEquipment(equipSnap.docs.map(d => ({ id: d.id, ...d.data() } as HSEquipment)));
    };
    fetchBasics();
  }, []);

  // Listeners em tempo real
  useEffect(() => {
    if (!id) return;

    const unsubEvent = onSnapshot(doc(db, 'events', id), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as HSEvent;
        setEvent({ id: doc.id, ...data });
        setEditFormData(data);
      } else {
        navigate('/events');
      }
      setLoading(false);
    });

    const unsubFinance = onSnapshot(doc(db, 'financeiro', id), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as HSEventFinance;
        setFinanceDoc(data);
        setFinanceInputs({
          valorAlimentacao: data.valorAlimentacao || 0,
          valorTransporte: data.valorTransporte || 0,
          valorOutros: data.valorOutros || 0
        });
      }
    });

    const unsubCont = onSnapshot(query(collection(db, 'contratacao'), where('showId', '==', id)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as HSEventContratacao));
      setContratacoes(data);
      setLocalContratacoes(data);
    });

    const unsubAlloc = onSnapshot(query(collection(db, 'alocacao'), where('showId', '==', id)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as HSEquipmentAllocation));
      setAllocations(data);
      setLocalAllocations(data);
    });

    return () => {
      unsubEvent(); unsubFinance(); unsubCont(); unsubAlloc();
    };
  }, [id, navigate]);

  const handleUpdateStatus = async (newStatus: EventStatus) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'events', id), { status: newStatus });
      if (newStatus === EventStatus.ORCAMENTO_GERADO) setActiveTab('orcamento');
    } catch (err) { console.error(err); }
  };

  const handleSaveEquipe = async () => {
    if (!id) return;
    setIsSavingEquipe(true);
    try {
      const batch = writeBatch(db);
      const toDelete = contratacoes.filter(orig => !localContratacoes.some(loc => loc.id === orig.id));
      toDelete.forEach(c => { if (c.id) batch.delete(doc(db, 'contratacao', c.id)); });
      localContratacoes.forEach(loc => {
        if (loc.id) {
          batch.update(doc(db, 'contratacao', loc.id), { cache: loc.cache, confirmacao: loc.confirmacao });
        } else {
          batch.set(doc(collection(db, 'contratacao')), loc);
        }
      });
      await batch.commit();
      alert("Equipe salva!");
    } catch (err) { console.error(err); } finally { setIsSavingEquipe(false); }
  };

  const handleSaveEstrutura = async () => {
    if (!id) return;
    setIsSavingEstrutura(true);
    try {
      const batch = writeBatch(db);
      const toDelete = allocations.filter(orig => !localAllocations.some(loc => loc.id === orig.id));
      toDelete.forEach(a => { if (a.id) batch.delete(doc(db, 'alocacao', a.id)); });
      localAllocations.forEach(loc => {
        if (loc.id) {
          batch.update(doc(db, 'alocacao', loc.id), { valorAlocacao: loc.valorAlocacao });
        } else {
          batch.set(doc(collection(db, 'alocacao')), loc);
        }
      });
      await batch.commit();
      alert("Estrutura técnica salva!");
    } catch (err) { console.error(err); } finally { setIsSavingEstrutura(false); }
  };

  const handleSaveFinance = async () => {
    if (!id || !event) return;
    setIsSavingFinance(true);
    try {
      const vEquipe = localContratacoes.filter(c => c.confirmacao).reduce((a, b) => a + (b.cache || 0), 0);
      const vEquip = localAllocations.reduce((a, b) => a + (b.valorAlocacao || 0), 0);
      const vTotal = vEquipe + vEquip + financeInputs.valorAlimentacao + financeInputs.valorTransporte + financeInputs.valorOutros;
      const vPago = financeDoc?.valorPago || 0;
      
      const newFin: HSEventFinance = {
        id, createdAt: financeDoc?.createdAt || new Date().toISOString(),
        valorEquipe: vEquipe, valorEquipamento: vEquip, valorAlimentacao: financeInputs.valorAlimentacao,
        valorTransporte: financeInputs.valorTransporte, valorOutros: financeInputs.valorOutros,
        valorEvento: vTotal, valorPago: vPago, saldoPendente: vTotal - vPago, statusPagamento: (vTotal - vPago) <= 0 ? 'Quitado' : 'Em aberto'
      };
      await setDoc(doc(db, 'financeiro', id), newFin);
      alert("Financeiro atualizado!");
    } catch (err) { console.error(err); } finally { setIsSavingFinance(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  if (!event) return null;

  const showGenerateBudgetBtn = isAdmin && event.status === EventStatus.EM_ANALISE && (financeDoc?.valorEvento || 0) > 0;
  const showOrcamentoTab = [EventStatus.ORCAMENTO_GERADO, EventStatus.ACEITO, EventStatus.RECUSADO, EventStatus.CONFIRMADO, EventStatus.CONCLUIDO].includes(event.status);

  // Definição dinâmica das abas permitidas
  const tabs = [
    { id: 'info', label: 'Dados do Show', visible: true },
    { id: 'equipe', label: 'Equipe', visible: isAdmin || isIntegrante },
    { id: 'estrutura', label: 'Estrutura', visible: isAdmin || isIntegrante },
    { id: 'orcamento', label: 'Orçamento', visible: showOrcamentoTab && (isAdmin || isContratante) },
    { id: 'financeiro', label: 'Financeiro', visible: isAdmin || isContratante },
  ].filter(t => t.visible);

  const orcMusicos = contratacoes
    .map(c => {
      const u = integrantes.find(i => i.uid === c.integranteId);
      return { profile: u, status: c.confirmacao };
    })
    .filter(item => item.profile?.tipoIntegrante === 'Músico' && item.status === true)
    .map(item => item.profile?.funcao || 'Músico');

  const orcBailarinas = contratacoes.filter(c => {
    const u = integrantes.find(i => i.uid === c.integranteId);
    return u?.tipoIntegrante === 'Dançarina' && c.confirmacao === true;
  }).length;

  const orcProducao = contratacoes
    .map(c => integrantes.find(i => i.uid === c.integranteId))
    .filter(u => u?.tipoIntegrante === 'Produção')
    .map(u => u?.funcao || 'Produção');

  const orcEquipamentos = allocations.map(a => allEquipment.find(e => e.id === a.equipamentoId)?.displayName).filter(Boolean);

  const calcTotal = financeDoc?.valorEvento || 0;
  const progressPercent = calcTotal > 0 ? Math.min(Math.round(((financeDoc?.valorPago || 0) / calcTotal) * 100), 100) : 0;

  return (
    <div className="space-y-10 animate-fade-in pb-20 px-1 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">{event.tipo}</span>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">{new Date(event.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter truncate">{event.titulo}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {showGenerateBudgetBtn && (
             <button onClick={() => handleUpdateStatus(EventStatus.ORCAMENTO_GERADO)} className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"><Sparkles size={16} /><span>Gerar Orçamento</span></button>
          )}
          {isAdmin && (
            <button onClick={() => setIsEditModalOpen(true)} className="flex items-center space-x-2 px-6 py-3 bg-slate-800 border border-slate-700 text-white rounded-2xl text-xs font-black uppercase transition-all shadow-xl"><Edit2 size={16} /><span>Editar</span></button>
          )}
          <div className="px-6 py-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{event.status}</div>
        </div>
      </div>

      {/* Tabs Filtradas por Role */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/50 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] border border-slate-800 max-w-4xl overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 px-6 rounded-[1.25rem] md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-500 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          
          {activeTab === 'info' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 shadow-2xl">
                 <div className="space-y-8">
                    <div className="flex items-start space-x-5">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><Calendar size={24} /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Data e Hora</p>
                        <p className="text-xl font-black text-white">{event.dataEvento ? new Date(event.dataEvento).toLocaleDateString('pt-BR') : '--'} às {event.horaEvento || '--:--'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-5">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><Clock size={24} /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Duração do Show</p>
                        <p className="text-xl font-black text-white">{event.duracao} Horas</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-5">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><Users size={24} /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Público Estimado</p>
                        <p className="text-xl font-black text-white">{event.publicoEstimado || 0} Pessoas</p>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="flex items-start space-x-5">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><MapPin size={24} /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Local do Evento</p>
                        <p className="text-xl font-black text-white">{event.local}</p>
                        <p className="text-xs text-slate-500 font-bold mt-1">{event.enderecoEvento}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-5">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><Utensils size={24} /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Logística Inclusa</p>
                        <div className="flex gap-2 mt-2">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${event.somContratado ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>Som: {event.somContratado ? 'Sim' : 'Não'}</span>
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${event.alimentacaoInclusa ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>Refeição: {event.alimentacaoInclusa ? 'Sim' : 'Não'}</span>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>

              {(event.cerimonialista || event.localCerimonia) && (
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 space-y-8 shadow-2xl">
                   <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest flex items-center"><Sparkles size={18} className="mr-3" /> Detalhes da Cerimônia</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cerimonialista / Equipe</p>
                        <p className="text-lg font-black text-white">{event.cerimonialista || 'Não informado'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Local da Cerimônia</p>
                        <p className="text-lg font-black text-white">{event.localCerimonia || 'Mesmo local do show'}</p>
                      </div>
                   </div>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 space-y-6 shadow-2xl">
                 <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center"><AlignLeft size={18} className="mr-3" /> Observações e Briefing</h3>
                 <div className="bg-slate-950/40 p-8 rounded-3xl border border-slate-800 shadow-inner">
                    <p className="text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                      {event.observacoes || 'Nenhuma observação adicional registrada para este evento.'}
                    </p>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'equipe' && (isAdmin || isIntegrante) && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Escala de Elenco</h3>
                {isAdmin && (
                  <div className="flex gap-4">
                     <button onClick={() => setShowMemberSelector(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl"><Plus size={16} /><span>Adicionar</span></button>
                     <button onClick={handleSaveEquipe} disabled={isSavingEquipe} className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl">
                        {isSavingEquipe ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}<span>Salvar</span>
                      </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {localContratacoes.map(loc => {
                  const m = integrantes.find(i => i.uid === loc.integranteId);
                  if (!m) return null;
                  return (
                    <div key={loc.integranteId} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-6 shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img src={m.photoURL || DEFAULT_AVATAR} className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-lg" />
                          <div>
                            <h4 className="font-black text-white">{m.displayName}</h4>
                            <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{m.funcao}</p>
                          </div>
                        </div>
                        {isAdmin && <button onClick={() => setLocalContratacoes(localContratacoes.filter(c => c.integranteId !== loc.integranteId))} className="text-red-500"><Trash2 size={16} /></button>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{isAdmin ? 'Cachê (R$)' : 'Logística'}</label>
                          {isAdmin ? (
                            <input type="number" value={loc.cache} onChange={e => setLocalContratacoes(localContratacoes.map(c => c.integranteId === loc.integranteId ? {...c, cache: Number(e.target.value)} : c))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-black text-xs" />
                          ) : (
                            <div className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl p-3 text-slate-500 font-black text-[10px] uppercase">Registrado</div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmação</label>
                          <button disabled={!isAdmin} onClick={() => setLocalContratacoes(localContratacoes.map(c => c.integranteId === loc.integranteId ? {...c, confirmacao: !c.confirmacao} : c))} className={`w-full p-3 rounded-xl border text-[9px] font-black uppercase transition-all ${loc.confirmacao ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>{loc.confirmacao ? 'Confirmado' : 'Pendente'}</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'estrutura' && (isAdmin || isIntegrante) && (
            <div className="space-y-8 animate-fade-in">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Estrutura Técnica</h3>
                {isAdmin && (
                  <div className="flex gap-4">
                    <button onClick={() => setShowEquipSelector(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl"><Plus size={16} /><span>Adicionar</span></button>
                    <button onClick={handleSaveEstrutura} disabled={isSavingEstrutura} className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl">
                        {isSavingEstrutura ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}<span>Salvar</span>
                      </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {localAllocations.map(alloc => {
                  const eq = allEquipment.find(e => e.id === alloc.equipamentoId);
                  if (!eq) return null;
                  return (
                    <div key={alloc.equipamentoId} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-6 shadow-xl">
                       <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700 text-slate-600 shadow-inner flex-shrink-0">
                            {eq.photoUrlEquipamento ? <img src={eq.photoUrlEquipamento} className="w-full h-full object-cover" /> : <Speaker size={24} />}
                          </div>
                          <div className="min-w-0"><h4 className="font-black text-white tracking-tight truncate">{eq.displayName}</h4></div>
                        </div>
                        {isAdmin && <button onClick={() => setLocalAllocations(localAllocations.filter(a => a.equipamentoId !== alloc.equipamentoId))} className="text-red-500"><Trash2 size={16} /></button>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{isAdmin ? 'Custo de Alocação (R$)' : 'Patrimônio HS'}</label>
                        {isAdmin ? (
                          <input type="number" value={alloc.valorAlocacao} onChange={e => setLocalAllocations(localAllocations.map(a => a.equipamentoId === alloc.equipamentoId ? {...a, valorAlocacao: Number(e.target.value)} : a))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-black text-xs" />
                        ) : (
                          <div className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl p-3 text-blue-500 font-black text-[10px] uppercase">Alocado</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'orcamento' && (isAdmin || isContratante) && (
            <div className="animate-fade-in bg-slate-900 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl pb-20">
              <div className="w-full h-80 relative">
                <img src="https://i.ibb.co/67C8hq4M/banner.png" className="w-full h-full object-cover" alt="Helder Santos Banner" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
              </div>

              <div className="px-10 -mt-10 relative z-10 space-y-16">
                <div className="space-y-6">
                   <div className="flex items-center space-x-3 text-blue-500">
                      <Star size={20} />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">Proposta de Show</span>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight">Helder Santos</h2>
                    <p className="text-slate-400 font-medium leading-relaxed text-lg italic bg-slate-950/40 p-8 rounded-[2rem] border border-slate-800/50">"Helder Santos é sinônimo de carisma e energia, moldando cada apresentação para ser um momento único."</p>
                </div>
                
                <div className="space-y-10">
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter border-b border-slate-800 pb-6">Detalhes do Evento</h3>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                      <div className="space-y-1"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Show</p><p className="text-xl font-black text-white">{event.titulo}</p></div>
                      <div className="space-y-1"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Data</p><p className="text-xl font-black text-white">{new Date(event.dataEvento).toLocaleDateString('pt-BR')}</p></div>
                      <div className="space-y-1"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Duração</p><p className="text-xl font-black text-white">{event.duracao}h</p></div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800 space-y-8">
                         <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] flex items-center"><Users size={16} className="mr-3" /> Staff e Elenco</h4>
                         <div className="space-y-6">
                            {orcMusicos.length > 0 && (
                              <div className="flex flex-wrap gap-2">{orcMusicos.map((m, i) => <span key={i} className="text-xs font-bold text-white bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">{m}</span>)}</div>
                            )}
                            {orcBailarinas > 0 && (
                              <div className="p-5 bg-blue-600/5 border border-blue-500/10 rounded-[2rem] flex items-center space-x-4">
                                 <Sparkles className="text-blue-500" size={20} />
                                 <p className="text-xs font-bold text-slate-300">Presença de {orcBailarinas} bailarinas confirmadas.</p>
                              </div>
                            )}
                         </div>
                      </div>
                      <div className="bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800 space-y-8">
                         <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] flex items-center"><Box size={16} className="mr-3" /> Infraestrutura</h4>
                         <div className="space-y-1">{orcEquipamentos.length > 0 ? orcEquipamentos.map((e, i) => <div key={i} className="flex items-center text-xs font-bold text-slate-300"><CheckCircle2 size={12} className="mr-2 text-emerald-500" /> {e}</div>) : <p className="text-[10px] text-slate-500 italic">Estrutura Helder Santos inclusa.</p>}</div>
                      </div>
                   </div>
                   <div className="relative pt-10"><div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-14 rounded-[4rem] text-center space-y-4 shadow-2xl"><p className="text-xs font-black text-blue-500 uppercase tracking-[0.5em]">Investimento Total</p><p className="text-8xl font-black text-white tracking-tighter"><span className="text-4xl align-top mr-2 text-blue-500/50">R$</span>{financeDoc?.valorEvento.toLocaleString('pt-BR') || '0,00'}</p><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pt-4">Proposta Válida por 15 dias</span></div></div>
                </div>

                <div className="space-y-16 pt-10 border-t border-slate-800">
                   <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.5em] text-center">Contatos Oficiais HS</h3>
                   <div className="max-w-xl mx-auto space-y-8">
                      <div className="flex items-center space-x-6"><div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-xl"><Instagram size={24} /></div><div className="flex-1"><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Instagram</p><p className="text-xl font-black text-white">@heldersantoscantor</p></div></div>
                      <div className="flex items-center space-x-6"><div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-xl"><Globe size={24} /></div><div className="flex-1"><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Website</p><p className="text-xl font-black text-white">heldersantosoficial.com.br</p></div></div>
                      <div className="flex items-center space-x-6"><div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-xl"><Mail size={24} /></div><div className="flex-1"><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">E-mail Comercial</p><p className="text-xl font-black text-white">contato@heldersantosoficial.com.br</p></div></div>
                      <div className="flex items-center space-x-6"><div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-xl"><Hash size={24} /></div><div className="flex-1"><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Dados Jurídicos</p><p className="text-lg font-black text-white italic">CNPJ: 49.178.368/0001-33</p></div></div>
                   </div>
                   {event.status === EventStatus.ORCAMENTO_GERADO && isContratante && (
                     <div className="flex flex-col md:flex-row gap-6 justify-center pt-10"><button onClick={() => handleUpdateStatus(EventStatus.ACEITO)} className="flex-1 max-w-xs py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 shadow-2xl transition-all active:scale-95"><ThumbsUp size={28} className="inline mr-2" /> Aceitar</button><button onClick={() => handleUpdateStatus(EventStatus.RECUSADO)} className="flex-1 max-w-xs py-6 bg-slate-800 text-slate-400 rounded-[2.5rem] font-black text-xl hover:text-white border border-slate-700 transition-all active:scale-95"><ThumbsDown size={28} className="inline mr-2" /> Recusar</button></div>
                   )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financeiro' && (isAdmin || isContratante) && (
             <div className="space-y-10 animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-6 shadow-2xl relative overflow-hidden group">
                 <div className="absolute -right-10 -top-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000"><DollarSign size={240} /></div>
                 <div className="flex items-center justify-between relative z-10"><div><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Receita Prevista</p><p className="text-6xl font-black text-white tracking-tighter">R$ {calcTotal.toLocaleString('pt-BR')}</p></div><div className="text-right"><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Pagamento</p><span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${financeDoc?.statusPagamento === 'Quitado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{financeDoc?.statusPagamento || 'Em aberto'}</span></div></div>
                 <div className="space-y-3 pt-6 relative z-10"><div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]"><span className="text-slate-500">Fluxo Realizado</span><span className="text-blue-500">{progressPercent}%</span></div><div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-1 shadow-inner"><div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000 rounded-full" style={{ width: `${progressPercent}%` }}></div></div></div>
              </div>
              {isAdmin && (
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-10 shadow-2xl"><h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center ml-2"><TrendingUp size={18} className="mr-3 text-blue-500" /> Despesas Operacionais (Admin)</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-10"><div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center ml-2">Alimentação</label><input type="number" value={financeInputs.valorAlimentacao} onChange={e => setFinanceInputs({...financeInputs, valorAlimentacao: Number(e.target.value)})} className="w-full px-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white font-black text-lg focus:border-blue-500 shadow-inner" /></div><div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center ml-2">Transporte</label><input type="number" value={financeInputs.valorTransporte} onChange={e => setFinanceInputs({...financeInputs, valorTransporte: Number(e.target.value)})} className="w-full px-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white font-black text-lg focus:border-blue-500 shadow-inner" /></div><div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center ml-2">Outros</label><input type="number" value={financeInputs.valorOutros} onChange={e => setFinanceInputs({...financeInputs, valorOutros: Number(e.target.value)})} className="w-full px-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white font-black text-lg focus:border-blue-500 shadow-inner" /></div></div><div className="flex justify-end pt-4 border-t border-slate-800/50"><button onClick={handleSaveFinance} disabled={isSavingFinance} className="px-10 py-5 bg-slate-800 text-slate-300 rounded-[1.5rem] font-black text-xs uppercase hover:bg-slate-700 border border-slate-700 transition-all active:scale-95">{isSavingFinance ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="inline mr-2" />} Salvar Lançamentos</button></div></div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-8"><div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8 shadow-2xl"><h3 className="text-xl font-black text-white uppercase tracking-tighter">Workflow</h3><div className="space-y-8 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-800">{[EventStatus.SOLICITADO, EventStatus.EM_ANALISE, EventStatus.ORCAMENTO_GERADO, EventStatus.ACEITO, EventStatus.CONFIRMADO].map((s) => (<div key={s} className="relative flex items-start space-x-5"><div className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-slate-900 relative z-10 transition-colors ${event.status === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-600'}`}>{event.status === s ? <CheckCircle2 size={16} /> : <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />}</div><p className={`text-sm font-black uppercase tracking-widest transition-colors ${event.status === s ? 'text-white' : 'text-slate-600'}`}>{s}</p></div>))}</div></div></div>
      </div>

      {isEditModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-slate-900 rounded-[3rem] w-full max-w-4xl shadow-2xl border border-white/5 overflow-hidden my-auto animate-fade-in">
            <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 sticky top-0 z-10"><h2 className="text-3xl font-black text-white uppercase tracking-tighter">Editar Evento</h2><button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-all"><X size={24} /></button></div>
            <form onSubmit={async (e) => { e.preventDefault(); setIsUpdating(true); try { await updateDoc(doc(db, 'events', id!), editFormData); setIsEditModalOpen(false); } catch (err) { console.error(err); } finally { setIsUpdating(false); } }} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Título</label><input value={editFormData.titulo} onChange={e => setEditFormData({...editFormData, titulo: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none shadow-inner" /></div>
                <div className="space-y-4"><label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Status</label><select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value as EventStatus})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none appearance-none">{Object.values(EventStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-2">Contratante Principal</label>
                  <select value={editFormData.contratanteId} onChange={e => setEditFormData({...editFormData, contratanteId: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-amber-500/20 rounded-2xl text-white font-bold outline-none appearance-none">
                    <option value="">Selecione...</option>
                    {clients.map(c => <option key={c.uid} value={c.uid}>{c.displayName} ({c.email})</option>)}
                  </select>
                </div>

                <div className="space-y-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Público Estimado</label><input type="number" value={editFormData.publicoEstimado} onChange={e => setEditFormData({...editFormData, publicoEstimado: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none shadow-inner" /></div>
                <div className="space-y-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Duração (h)</label><input type="number" step="0.5" value={editFormData.duracao} onChange={e => setEditFormData({...editFormData, duracao: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none shadow-inner" /></div>
                <div className="space-y-4"><label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Cerimonialista</label><input value={editFormData.cerimonialista} onChange={e => setEditFormData({...editFormData, cerimonialista: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none shadow-inner" /></div>
                <div className="space-y-4"><label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Local Cerimônia</label><input value={editFormData.localCerimonia} onChange={e => setEditFormData({...editFormData, localCerimonia: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none shadow-inner" /></div>
              </div>
              <div className="space-y-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Observações</label><textarea rows={4} value={editFormData.observacoes} onChange={e => setEditFormData({...editFormData, observacoes: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none shadow-inner resize-none" /></div>
              <div className="flex gap-4 pt-8"><button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-5 bg-slate-800 text-slate-400 rounded-[2rem] font-black uppercase text-xs">Descartar</button><button type="submit" disabled={isUpdating} className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs hover:bg-blue-500 transition-all shadow-2xl flex items-center justify-center space-x-3">{isUpdating ? <Loader2 className="animate-spin" /> : <Save size={18} />}<span>Atualizar Evento</span></button></div>
            </form>
          </div>
        </div>
      )}

      {showMemberSelector && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6"><div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowMemberSelector(false)}></div><div className="relative bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in"><div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 sticky top-0"><h3 className="text-xl font-black text-white uppercase tracking-tighter">Escalar Membro</h3><button onClick={() => setShowMemberSelector(false)} className="text-slate-400 hover:text-white transition-all"><X size={24} /></button></div><div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">{integrantes.filter(m => !localContratacoes.some(lc => lc.integranteId === m.uid)).map(member => (<button key={member.uid} onClick={() => { const newCont: HSEventContratacao = { showId: id!, integranteId: member.uid, cache: 0, confirmacao: false, note: '', createdAt: new Date().toISOString() }; setLocalContratacoes([...localContratacoes, newCont]); setShowMemberSelector(false); }} className="w-full flex items-center space-x-5 p-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500 transition-all text-left group shadow-lg"><div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden"><img src={member.photoURL || DEFAULT_AVATAR} className="w-full h-full object-cover" /></div><div className="flex-1"><h4 className="font-black text-white">{member.displayName}</h4><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{member.funcao}</p></div><Plus size={20} className="text-slate-700 group-hover:text-blue-500 transition-colors" /></button>))}</div></div></div>
      )}

      {showEquipSelector && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6"><div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowEquipSelector(false)}></div><div className="relative bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in"><div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 sticky top-0"><h3 className="text-xl font-black text-white uppercase tracking-tighter">Alocar Item</h3><button onClick={() => setShowEquipSelector(false)} className="text-slate-400 hover:text-white transition-all"><X size={24} /></button></div><div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">{allEquipment.filter(e => !localAllocations.some(la => la.equipamentoId === e.id)).map(equip => (
          <button key={equip.id} onClick={() => { const newAlloc: HSEquipmentAllocation = { showId: id!, equipamentoId: equip.id!, valorAlocacao: 0, note: '', createdAt: new Date().toISOString() }; setLocalAllocations([...localAllocations, newAlloc]); setShowEquipSelector(false); }} className="w-full flex items-center space-x-5 p-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500 transition-all text-left group shadow-lg"><div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-slate-600">{equip.photoUrlEquipamento ? <img src={equip.photoUrlEquipamento} className="w-full h-full object-cover" /> : <Speaker size={24} />}</div><div className="flex-1"><h4 className="font-black text-white">{equip.displayName}</h4></div><Plus size={20} className="text-slate-700 group-hover:text-blue-500 transition-colors" /></button>))}</div></div></div>
      )}
    </div>
  );
};

export default EventDetails;
