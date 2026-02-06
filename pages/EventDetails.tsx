
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { doc, updateDoc, onSnapshot, collection, query, where, getDocs, writeBatch, setDoc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { HSEvent, EventStatus, UserRole, UserProfile, HSEventContratacao, HSEquipment, HSEquipmentAllocation, HSEventFinance } from '../types';
import { 
  ChevronLeft, Loader2, Sparkles, Edit2, X, Plus, Save, Speaker, CheckCircle2, 
  Layout, ShieldCheck, Clock, MapPin, Activity
} from 'lucide-react';

// Widgets
import EventInfoWidget from '../widgets/EventInfoWidget';
import EventEquipeWidget from '../widgets/EventEquipeWidget';
import EventEstruturaWidget from '../widgets/EventEstruturaWidget';
import EventOrcamentoWidget from '../widgets/EventOrcamentoWidget';
import EventFinanceiroWidget from '../widgets/EventFinanceiroWidget';
import EventFormWidget from '../widgets/EventFormWidget';
import EventContratoWidget from '../widgets/EventContratoWidget';

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userProfile } = useAuth();
  
  const [event, setEvent] = useState<HSEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'equipe' | 'estrutura' | 'financeiro' | 'orcamento' | 'contrato'>('info');
  
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

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['info', 'equipe', 'estrutura', 'financeiro', 'orcamento', 'contrato'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchBasics = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile));
      setIntegrantes(allUsers);
      setClients(allUsers.filter(u => u.role === UserRole.CONTRATANTE));
      
      const equipSnap = await getDocs(collection(db, 'equipamentos'));
      setAllEquipment(equipSnap.docs.map(d => ({ ...d.data(), id: d.id } as HSEquipment)));
    };
    fetchBasics();
  }, []);

  useEffect(() => {
    if (!id) return;

    const unsubEvent = onSnapshot(doc(db, 'events', id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const eventData = { ...data, id: snapshot.id } as HSEvent;
        setEvent(eventData);
        setEditFormData(eventData);
      } else {
        navigate('/events');
      }
      setLoading(false);
    });

    const unsubFinance = onSnapshot(doc(db, 'financeiro', id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as HSEventFinance;
        setFinanceDoc(data);
        setFinanceInputs({
          valorAlimentacao: data.valorAlimentacao || 0,
          valorTransporte: data.valorTransporte || 0,
          valorOutros: data.valorOutros || 0
        });
      }
    });

    const unsubCont = onSnapshot(query(collection(db, 'contratacao'), where('showId', '==', id)), (snap: QuerySnapshot<DocumentData>) => {
      const data = snap.docs.map((d) => ({ ...d.data(), id: d.id } as HSEventContratacao));
      setContratacoes(data);
      setLocalContratacoes(data);
    });

    const unsubAlloc = onSnapshot(query(collection(db, 'alocacao'), where('showId', '==', id)), (snap: QuerySnapshot<DocumentData>) => {
      const data = snap.docs.map((d) => ({ ...d.data(), id: d.id } as HSEquipmentAllocation));
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

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsUpdating(true);
    try {
      const { id: _, ...dataToUpdate } = editFormData;
      await updateDoc(doc(db, 'events', id), dataToUpdate);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Erro ao atualizar evento:", err);
      alert("Ocorreu um erro ao salvar as alterações do evento.");
    } finally {
      setIsUpdating(false);
    }
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
          batch.update(doc(db, 'contratacao', loc.id), { cache: loc.cache, confirmacao: loc.confirmacao, note: loc.note || '' });
        } else {
          const { id: _, ...dataToSave } = loc;
          batch.set(doc(collection(db, 'contratacao')), dataToSave);
        }
      });
      await batch.commit();
      alert("Equipe salva com sucesso!");
    } catch (err) { console.error("Erro ao salvar equipe:", err); alert("Erro ao salvar escala da equipe."); } finally { setIsSavingEquipe(false); }
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
          batch.update(doc(db, 'alocacao', loc.id), { valorAlocacao: loc.valorAlocacao, note: loc.note || '' });
        } else {
          const { id: _, ...dataToSave } = loc;
          batch.set(doc(collection(db, 'alocacao')), dataToSave);
        }
      });
      await batch.commit();
      alert("Estrutura técnica salva!");
    } catch (err) { console.error("Erro ao salvar estrutura:", err); alert("Erro ao salvar alocação de equipamentos."); } finally { setIsSavingEstrutura(false); }
  };

  const handleSaveFinance = async () => {
    if (!id || !event) return;
    setIsSavingFinance(true);
    try {
      const vEquipe = localContratacoes.filter(c => c.confirmacao).reduce((a, b) => a + (b.cache || 0), 0);
      const vEquip = localAllocations.reduce((a, b) => a + (b.valorAlocacao || 0), 0);
      const vTotal = vEquipe + vEquip + (financeInputs.valorAlimentacao || 0) + (financeInputs.valorTransporte || 0) + (financeInputs.valorOutros || 0);
      const vPago = financeDoc?.valorPago || 0;
      const newFinData = {
        createdAt: financeDoc?.createdAt || new Date().toISOString(),
        valorEquipe: vEquipe, valorEquipamento: vEquip, valorAlimentacao: financeInputs.valorAlimentacao || 0,
        valorTransporte: financeInputs.valorTransporte || 0, valorOutros: financeInputs.valorOutros || 0,
        valorEvento: vTotal, valorPago: vPago, saldoPendente: Math.max(0, vTotal - vPago), 
        statusPagamento: (vTotal - vPago) <= 0 ? 'Quitado' : 'Em aberto'
      };
      await setDoc(doc(db, 'financeiro', id), newFinData);
      alert("Financeiro atualizado!");
    } catch (err) { console.error("Erro financeiro:", err); alert("Erro ao atualizar dados financeiros."); } finally { setIsSavingFinance(false); }
  };

  const orcMusicos = useMemo(() => {
    return contratacoes
      .map(c => integrantes.find(i => i.uid === c.integranteId))
      .filter(u => u && (u.tipoIntegrante === 'Músico' || u.tipoIntegrante === undefined))
      .map(u => u?.funcao || 'Músico');
  }, [contratacoes, integrantes]);

  const orcBailarinas = useMemo(() => {
    return contratacoes.filter(c => {
      const u = integrantes.find(i => i.uid === c.integranteId);
      return u?.tipoIntegrante === 'Dançarina';
    }).length;
  }, [contratacoes, integrantes]);

  const orcEquipamentos = useMemo(() => {
    return allocations
      .map(a => allEquipment.find(e => e.id === a.equipamentoId)?.displayName)
      .filter((name): name is string => name !== undefined && name !== null);
  }, [allocations, allEquipment]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Backstage...</p>
    </div>
  );
  
  if (!event || !userProfile) return null;

  const showGenerateBudgetBtn = isAdmin && event.status === EventStatus.EM_ANALISE && (financeDoc?.valorEvento || 0) > 0;
  const showOrcamentoTab = [EventStatus.ORCAMENTO_GERADO, EventStatus.ACEITO, EventStatus.RECUSADO, EventStatus.CONFIRMADO, EventStatus.CONCLUIDO].includes(event.status);

  const canSeeContract = !isIntegrante && (
    isAdmin ? [EventStatus.ACEITO, EventStatus.CONFIRMADO, EventStatus.CONCLUIDO].includes(event.status)
           : (isContratante && [EventStatus.CONFIRMADO, EventStatus.CONCLUIDO].includes(event.status))
  );

  const canEditEvent = isAdmin || (isContratante && event.status === EventStatus.SOLICITADO);

  const tabs = [
    { id: 'info', label: 'Dados do Show', visible: true },
    { id: 'equipe', label: 'Equipe', visible: isAdmin || isIntegrante },
    { id: 'estrutura', label: 'Estrutura', visible: isAdmin || isIntegrante },
    { id: 'orcamento', label: 'Orçamento', visible: showOrcamentoTab && (isAdmin || isContratante) },
    { id: 'contrato', label: 'Contrato', visible: canSeeContract },
    { id: 'financeiro', label: 'Financeiro', visible: isAdmin || isContratante },
  ].filter(t => t.visible);

  const calcTotal = financeDoc?.valorEvento || 0;
  const progressPercent = calcTotal > 0 ? Math.min(Math.round(((financeDoc?.valorPago || 0) / calcTotal) * 100), 100) : 0;

  return (
    <div className="space-y-10 animate-fade-in pb-20 px-1 md:px-0">
      
      {/* Header Premium Style */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-8">
        <button 
          onClick={() => navigate(-1)} 
          className="w-14 h-14 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-widest">{event.tipo}</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Criado em {new Date(event.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter truncate leading-none uppercase italic">{event.titulo}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {showGenerateBudgetBtn && (
             <button 
               onClick={() => handleUpdateStatus(EventStatus.ORCAMENTO_GERADO)} 
               className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"
             >
               <Sparkles size={18} />
               <span>Gerar Orçamento</span>
             </button>
          )}
          {canEditEvent && (
            <button 
              onClick={() => setIsEditModalOpen(true)} 
              className="flex items-center space-x-3 px-8 py-4 bg-white border border-slate-100 text-slate-900 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm hover:border-blue-200"
            >
              <Edit2 size={18} className="text-blue-600" />
              <span>Editar Evento</span>
            </button>
          )}
          <div className="px-8 py-4 bg-slate-50 border border-slate-100 text-slate-500 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
            {event.status}
          </div>
        </div>
      </div>

      {/* Tabs - Glass Clean White */}
      <div className="flex flex-wrap gap-2 p-2 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-slate-100 max-w-4xl overflow-x-auto scrollbar-hide shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 px-8 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                : 'text-slate-400 hover:text-slate-900 hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'info' && <EventInfoWidget event={event} />}

          {activeTab === 'equipe' && (isAdmin || isIntegrante) && (
            <EventEquipeWidget 
              isAdmin={isAdmin}
              localContratacoes={localContratacoes}
              integrantes={integrantes}
              isSavingEquipe={isSavingEquipe}
              onAdd={() => setShowMemberSelector(true)}
              onSave={handleSaveEquipe}
              onRemove={(uid) => setLocalContratacoes(localContratacoes.filter(c => c.integranteId !== uid))}
              onUpdate={(uid, updates) => setLocalContratacoes(localContratacoes.map(c => c.integranteId === uid ? {...c, ...updates} : c))}
            />
          )}

          {activeTab === 'estrutura' && (isAdmin || isIntegrante) && (
            <EventEstruturaWidget 
              isAdmin={isAdmin}
              localAllocations={localAllocations}
              allEquipment={allEquipment}
              isSavingEstrutura={isSavingEstrutura}
              onAdd={() => setShowEquipSelector(true)}
              onSave={handleSaveEstrutura}
              onRemove={(eid) => setLocalAllocations(localAllocations.filter(a => a.equipamentoId !== eid))}
              onUpdate={(eid, updates) => setLocalAllocations(localAllocations.map(a => a.equipamentoId === eid ? {...a, ...updates} : a))}
            />
          )}

          {activeTab === 'orcamento' && (isAdmin || isContratante) && (
            <EventOrcamentoWidget 
              event={event}
              financeDoc={financeDoc}
              orcMusicos={orcMusicos}
              orcBailarinas={orcBailarinas}
              orcEquipamentos={orcEquipamentos}
              isContratante={isContratante}
              handleUpdateStatus={handleUpdateStatus}
            />
          )}

          {activeTab === 'contrato' && canSeeContract && (
            <EventContratoWidget 
              event={event}
              userProfile={userProfile}
              financeDoc={financeDoc}
              equipeNomes={orcMusicos}
              onSignComplete={() => setActiveTab('info')}
            />
          )}

          {activeTab === 'financeiro' && (isAdmin || isContratante) && (
            <EventFinanceiroWidget 
              isAdmin={isAdmin}
              isContratante={isContratante}
              calcTotal={calcTotal}
              financeDoc={financeDoc}
              progressPercent={progressPercent}
              financeInputs={financeInputs}
              setFinanceInputs={setFinanceInputs}
              handleSaveFinance={handleSaveFinance}
              isSavingFinance={isSavingFinance}
            />
          )}
        </div>

        {/* Sidebar Workflow - Premium White */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)]">
            <div className="flex items-center space-x-3 text-slate-900 border-b border-slate-50 pb-6">
               <Activity size={20} className="text-blue-600" />
               <h3 className="text-xs font-black uppercase tracking-[0.3em]">Fluxo Operacional</h3>
            </div>
            
            <div className="space-y-10 relative before:absolute before:inset-y-0 before:left-[1.125rem] before:w-px before:bg-slate-100">
              {['Solicitado', 'Em análise', 'Orçamento gerado', 'Aceito', 'Confirmado'].map((s) => {
                const isActive = event.status === s;
                return (
                  <div key={s} className="relative flex items-center space-x-6 group">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ring-8 ring-white relative z-10 transition-all duration-500 shadow-sm ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-slate-50 text-slate-300'}`}>
                      {isActive ? <CheckCircle2 size={18} /> : <div className="w-2 h-2 bg-slate-200 rounded-full" />}
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>{s}</p>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-slate-900 p-10 rounded-[3rem] space-y-6 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                <ShieldCheck size={80} className="text-white" />
             </div>
             <h4 className="text-xl font-black text-white uppercase italic tracking-tight relative z-10">Segurança de Dados</h4>
             <p className="text-[11px] text-slate-400 font-medium leading-relaxed relative z-10">
               Todas as modificações de escala e alocação técnica são auditadas em tempo real para garantir a integridade da logística HS Produções.
             </p>
          </div>
        </div>
      </div>

      {/* MODAL: EDIT EVENT */}
      {isEditModalOpen && canEditEvent && (
        <div className="fixed inset-0 z-[100] p-4 md:p-12 overflow-y-auto animate-fade-in">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative max-w-5xl mx-auto z-10">
            <EventFormWidget 
              title="Editar Detalhes do Show"
              data={editFormData}
              setData={setEditFormData}
              onSubmit={handleUpdateEvent}
              onCancel={() => setIsEditModalOpen(false)}
              isSubmitting={isUpdating}
              isAdmin={isAdmin}
              clients={clients}
              submitLabel="Atualizar Evento"
            />
          </div>
        </div>
      )}
      
      {/* MODAL: SELECIONAR INTEGRANTE - PREMIUM WHITE THEME */}
      {showMemberSelector && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => setShowMemberSelector(false)}></div>
          <div className="relative bg-white border border-slate-100 rounded-[3rem] w-full max-w-2xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-white flex-shrink-0">
              <div>
                <div className="flex items-center space-x-2 text-blue-600 mb-1">
                  <Plus size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Escala Técnica</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Vincular Integrante</h3>
              </div>
              <button 
                onClick={() => setShowMemberSelector(false)} 
                className="w-14 h-14 flex items-center justify-center text-slate-300 hover:text-slate-900 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 transition-all active:scale-95 shadow-sm"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto space-y-4 scrollbar-hide flex-1 bg-slate-50/30">
              {integrantes
                .filter(m => (m.role === UserRole.INTEGRANTE || m.role === UserRole.ADMIN) && !localContratacoes.some(lc => lc.integranteId === m.uid))
                .map(member => (
                  <button 
                    key={member.uid} 
                    onClick={() => { 
                      const newCont: HSEventContratacao = { 
                        showId: id!, 
                        integranteId: member.uid, 
                        cache: 0, 
                        confirmacao: false, 
                        note: '', 
                        createdAt: new Date().toISOString() 
                      }; 
                      setLocalContratacoes([...localContratacoes, newCont]); 
                      setShowMemberSelector(false); 
                    }} 
                    className="w-full flex items-center space-x-6 p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left group active:scale-[0.98]"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 p-1 border border-slate-100 overflow-hidden flex-shrink-0 shadow-sm">
                      <img src={member.photoURL || "/avatar.png"} className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 text-xl tracking-tight leading-tight">{member.displayName}</h4>
                      <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">
                        {member.funcao || member.tipoIntegrante || 'Equipe HS'}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-90 transition-all">
                      <Plus size={20} />
                    </div>
                  </button>
              ))}
              
              {integrantes.filter(m => (m.role === UserRole.INTEGRANTE || m.role === UserRole.ADMIN) && !localContratacoes.some(lc => lc.integranteId === m.uid)).length === 0 && (
                <div className="py-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                      <ShieldCheck size={32} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Todo o elenco já foi escalado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SELECIONAR EQUIPAMENTO - PREMIUM WHITE THEME */}
      {showEquipSelector && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => setShowEquipSelector(false)}></div>
          <div className="relative bg-white border border-slate-100 rounded-[3rem] w-full max-w-2xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-white flex-shrink-0">
               <div>
                <div className="flex items-center space-x-2 text-blue-600 mb-1">
                  <Layout size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Recursos Técnicos</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Alocar Patrimônio</h3>
              </div>
              <button 
                onClick={() => setShowEquipSelector(false)} 
                className="w-14 h-14 flex items-center justify-center text-slate-300 hover:text-slate-900 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 transition-all active:scale-95 shadow-sm"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto space-y-4 scrollbar-hide flex-1 bg-slate-50/30">
              {allEquipment.filter(e => !localAllocations.some(la => la.equipamentoId === e.id)).map(equip => (
                <button 
                  key={equip.id} 
                  onClick={() => { 
                    const newAlloc: HSEquipmentAllocation = { 
                      showId: id!, 
                      equipamentoId: equip.id!, 
                      valorAlocacao: 0, 
                      note: '', 
                      createdAt: new Date().toISOString() 
                    }; 
                    setLocalAllocations([...localAllocations, newAlloc]); 
                    setShowEquipSelector(false); 
                  }} 
                  className="w-full flex items-center space-x-6 p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left group active:scale-[0.98]"
                >
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center text-slate-300 flex-shrink-0 shadow-sm p-1">
                    {equip.photoUrlEquipamento ? <img src={equip.photoUrlEquipamento} className="w-full h-full object-cover rounded-xl" /> : <Speaker size={32} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 text-xl tracking-tight leading-tight">{equip.displayName}</h4>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Patrimônio HS • Operacional</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-90 transition-all">
                    <Plus size={20} />
                  </div>
                </button>
              ))}
              
              {allEquipment.filter(e => !localAllocations.some(la => la.equipamentoId === e.id)).length === 0 && (
                <div className="py-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                      <Layout size={32} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Todos os itens de inventário já alocados.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
