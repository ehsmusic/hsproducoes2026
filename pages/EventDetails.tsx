
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { doc, updateDoc, onSnapshot, collection, query, where, getDocs, writeBatch, setDoc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { HSEvent, EventStatus, UserRole, UserProfile, HSEventContratacao, HSEquipment, HSEquipmentAllocation, HSEventFinance } from '../types';
import { 
  ChevronLeft, Loader2, Sparkles, Edit2, X, Plus, Save, Speaker, CheckCircle2
} from 'lucide-react';

// Widgets
import EventInfoWidget from '../widgets/EventInfoWidget';
import EventEquipeWidget from '../widgets/EventEquipeWidget';
import EventEstruturaWidget from '../widgets/EventEstruturaWidget';
import EventOrcamentoWidget from '../widgets/EventOrcamentoWidget';
import EventFinanceiroWidget from '../widgets/EventFinanceiroWidget';
import EventFormWidget from '../widgets/EventFormWidget';

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

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['info', 'equipe', 'estrutura', 'financeiro', 'orcamento'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchBasics = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => d.data() as UserProfile);
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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  if (!event) return null;

  const showGenerateBudgetBtn = isAdmin && event.status === EventStatus.EM_ANALISE && (financeDoc?.valorEvento || 0) > 0;
  const showOrcamentoTab = [EventStatus.ORCAMENTO_GERADO, EventStatus.ACEITO, EventStatus.RECUSADO, EventStatus.CONFIRMADO, EventStatus.CONCLUIDO].includes(event.status);

  const canEditEvent = isAdmin || (isContratante && event.status === EventStatus.SOLICITADO);

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

  const orcEquipamentos = allocations
    .map(a => allEquipment.find(e => e.id === a.equipamentoId)?.displayName)
    .filter((name): name is string => name !== undefined && name !== null);

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
          {canEditEvent && (
            <button onClick={() => setIsEditModalOpen(true)} className="flex items-center space-x-2 px-6 py-3 bg-slate-800 border border-slate-800 text-white rounded-2xl text-xs font-black uppercase transition-all shadow-xl">
              <Edit2 size={16} /><span>Editar Evento</span>
            </button>
          )}
          <div className="px-6 py-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{event.status}</div>
        </div>
      </div>

      {/* Tabs */}
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

        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8 shadow-2xl">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Workflow</h3>
            <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
              {['Solicitado', 'Em análise', 'Orçamento gerado', 'Aceito', 'Confirmado'].map((s) => (
                <div key={s} className="relative flex items-start space-x-5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-slate-900 relative z-10 transition-colors ${event.status === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                    {event.status === s ? <CheckCircle2 size={16} /> : <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />}
                  </div>
                  <p className={`text-sm font-black uppercase tracking-widest transition-colors ${event.status === s ? 'text-white' : 'text-slate-600'}`}>{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && canEditEvent && (
        <EventFormWidget 
          title="Editar Show"
          data={editFormData}
          setData={setEditFormData}
          onSubmit={handleUpdateEvent}
          onCancel={() => setIsEditModalOpen(false)}
          isSubmitting={isUpdating}
          isAdmin={isAdmin}
          clients={clients}
          submitLabel="Atualizar Evento"
        />
      )}
      
      {showMemberSelector && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="fixed inset-0" onClick={() => setShowMemberSelector(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 flex-shrink-0">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Escalar Membro</h3>
              <button onClick={() => setShowMemberSelector(false)} className="text-slate-400 hover:text-white transition-all p-2 rounded-xl hover:bg-slate-800"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-4 custom-scrollbar flex-1">
              {integrantes.filter(m => !localContratacoes.some(lc => lc.integranteId === m.uid)).map(member => (
                <button key={member.uid} onClick={() => { const newCont: HSEventContratacao = { showId: id!, integranteId: member.uid, cache: 0, confirmacao: false, note: '', createdAt: new Date().toISOString() }; setLocalContratacoes([...localContratacoes, newCont]); setShowMemberSelector(false); }} className="w-full flex items-center space-x-5 p-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500 transition-all text-left group">
                  <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0"><img src={member.photoURL || "/avatar.png"} className="w-full h-full object-cover" /></div>
                  <div className="flex-1"><h4 className="font-black text-white">{member.displayName}</h4><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{member.funcao}</p></div>
                  <Plus size={20} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showEquipSelector && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="fixed inset-0" onClick={() => setShowEquipSelector(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 flex-shrink-0">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Alocar Item</h3>
              <button onClick={() => setShowEquipSelector(false)} className="text-slate-400 hover:text-white transition-all p-2 rounded-xl hover:bg-slate-800"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-4 custom-scrollbar flex-1">
              {allEquipment.filter(e => !localAllocations.some(la => la.equipamentoId === e.id)).map(equip => (
                <button key={equip.id} onClick={() => { const newAlloc: HSEquipmentAllocation = { showId: id!, equipamentoId: equip.id!, valorAlocacao: 0, note: '', createdAt: new Date().toISOString() }; setLocalAllocations([...localAllocations, newAlloc]); setShowEquipSelector(false); }} className="w-full flex items-center space-x-5 p-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500 transition-all text-left group">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-slate-600 flex-shrink-0">{equip.photoUrlEquipamento ? <img src={equip.photoUrlEquipamento} className="w-full h-full object-cover" /> : <Speaker size={24} />}</div>
                  <div className="flex-1"><h4 className="font-black text-white">{equip.displayName}</h4></div>
                  <Plus size={20} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
