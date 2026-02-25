
import React, { useState } from 'react';
import { useAuth, LOGO_URL } from '../App';
import { useNavigate, useLocation } from 'react-router';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from '@firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc, setDoc, doc } from 'firebase/firestore';
import { UserRole, EventStatus, ShowType, HSEvent, UserProfile } from '../types';
import { DEFAULT_AVATAR } from '../App';
import { 
  Chrome, Mail, Lock, Loader2, ShieldCheck, CheckCircle2, 
  Calendar, Clock, MapPin, Music, Phone, User, X, Send, Sparkles, Info 
} from 'lucide-react';

const Login: React.FC = () => {
  const { loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isRequestShow, setIsRequestShow] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [requestShowData, setRequestShowData] = useState({
    email: '',
    displayName: '',
    telefone: '',
    data: '',
    hora: '',
    tipo: 'Casamento' as ShowType,
    local: '',
    duracao: 2,
    som: true
  });

  const from = location.state?.from?.pathname || '/';

  if (currentUser && !showSuccessModal) {
    navigate(from, { replace: true });
    return null;
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError('Erro ao autenticar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSent(false);
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Ocorreu um erro na autenticação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, digite seu e-mail no campo acima para resetar a senha.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      setError('Erro ao enviar e-mail de recuperação. Verifique o e-mail informado.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Verificar se o usuário já existe na coleção 'users'
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', requestShowData.email));
      const querySnapshot = await getDocs(q);
      
      let uid = '';
      const password = generatePassword();

      if (querySnapshot.empty) {
        // Criar novo usuário no Auth
        const userCredential = await createUserWithEmailAndPassword(auth, requestShowData.email, password);
        uid = userCredential.user.uid;

        // Criar perfil na coleção 'users'
        const newProfile: UserProfile = {
          uid,
          email: requestShowData.email,
          displayName: requestShowData.displayName,
          role: UserRole.CONTRATANTE,
          photoURL: DEFAULT_AVATAR,
          phoneNumber: requestShowData.telefone,
          pixKey: '',
          endereco: ''
        };
        await setDoc(doc(db, 'users', uid), newProfile);
      } else {
        // Usuário já existe, mas não podemos logar ele sem senha.
        setError('Este e-mail já possui uma conta. Por favor, faça login para solicitar o show.');
        setLoading(false);
        return;
      }

      // 2. Criar o Evento
      const eventData: Partial<HSEvent> = {
        createdAt: new Date().toISOString(),
        titulo: `Show: ${requestShowData.displayName}`,
        tipo: requestShowData.tipo,
        duracao: requestShowData.duracao,
        dataEvento: requestShowData.data,
        horaEvento: requestShowData.hora,
        local: requestShowData.local,
        enderecoEvento: '',
        publicoEstimado: 0,
        somContratado: requestShowData.som,
        alimentacaoInclusa: false,
        observacoes: 'Solicitação via formulário rápido sem login.',
        contratanteId: uid,
        status: EventStatus.SOLICITADO,
        integrantesIds: [],
        confirmedIntegrantes: [],
        payments: []
      };

      await addDoc(collection(db, 'events'), eventData);

      // 3. Sucesso
      setGeneratedPassword(password);
      setIsRequestShow(false);
      setShowSuccessModal(true);
      
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Por favor, faça login.');
      } else {
        setError('Erro ao processar solicitação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    return "HS" + Math.random().toString(36).slice(-6).toUpperCase();
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50 to-slate-50 p-6">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white/70 backdrop-blur-2xl rounded-[3rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden">
        
        {/* Lado Esquerdo - Branding (Light Version) */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600/[0.03] to-white/50 border-r border-slate-100">
          <div>
            <div className="inline-block mb-12">
              <img 
                src={LOGO_URL} 
                alt="HS Produções" 
                className="w-56 object-contain" 
              />
            </div>
            <h1 className="text-4xl font-black text-slate-900 leading-tight mb-6 tracking-tighter">
              A excelência começa nos <span className="text-blue-600">bastidores.</span>
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed max-w-sm font-medium">
              Plataforma de gestão inteligente para a elite da música e produção de eventos.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-slate-400 text-sm font-black uppercase tracking-widest">
            <ShieldCheck className="text-blue-600" size={20} />
            <span>HS BACKSTAGE ENCRYPTED</span>
          </div>
        </div>

        {/* Lado Direito - Form (Clean White) */}
        <div className="p-8 sm:p-12 md:p-16 flex flex-col justify-center bg-white/40">
          <div className="md:hidden flex justify-center mb-10">
            <img src={LOGO_URL} alt="HS Logo" className="w-32 object-contain" />
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">
              {isRegister ? 'Criar Nova Conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
              {isRegister ? 'Inicie sua jornada na HS Produções' : 'Acesse seu painel de controle HS'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center animate-shake leading-relaxed shadow-sm">
              {error}
            </div>
          )}

          {resetSent && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center space-x-3 animate-fade-in shadow-sm">
              <CheckCircle2 size={18} />
              <span>Instruções enviadas para seu e-mail!</span>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação / E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-600 transition-colors">
                  <Mail size={24} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-16 pr-8 py-7 bg-slate-100/60 border border-slate-200 rounded-[2rem] focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none text-slate-900 placeholder-slate-300 font-bold transition-all text-lg"
                  placeholder="seuemail@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center pr-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave de Acesso</label>
                {!isRegister && (
                  <button 
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
                  >
                    Esqueci minha chave
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={24} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-16 pr-8 py-7 bg-slate-100/60 border border-slate-200 rounded-[2rem] focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none text-slate-900 placeholder-slate-300 font-bold transition-all text-lg"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-7 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-[13px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-[0.98] mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <span>{isRegister ? 'Finalizar Cadastro' : 'Entrar no Sistema'}</span>}
            </button>
          </form>

          <div className="mt-10 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.5em]"><span className="px-4 bg-white/0 text-slate-300">Autenticação Social</span></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-8 w-full flex justify-center items-center py-7 bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-300 active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            {loading ? (
              <Loader2 className="animate-spin text-blue-600" size={24} />
            ) : (
              <>
                <Chrome className="mr-3 text-red-500" size={24} />
                Continuar com Google
              </>
            )}
          </button>

          <p className="mt-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {isRegister ? 'Já é parte da equipe?' : 'Novo no ecossistema?'}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="ml-2 text-blue-600 hover:text-blue-700 transition-all underline decoration-2 underline-offset-4"
            >
              {isRegister ? 'Fazer Login' : 'Solicitar Acesso'}
            </button>
          </p>

          <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col items-center">
            <button
              onClick={() => setIsRequestShow(true)}
              className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-[0.3em] transition-all flex items-center space-x-2 group"
            >
              <Sparkles size={14} className="group-hover:animate-pulse" />
              <span>Solicitar Show sem Login</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Solicitação Rápida */}
      {isRequestShow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={() => setIsRequestShow(false)}></div>
          
          <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-white overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
            <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-white flex-shrink-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Solicitação Rápida</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Reserve sua data em segundos</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRequestShow(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-900 rounded-xl bg-slate-50 hover:bg-white border border-slate-100 transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-10 scrollbar-hide">
              <form id="request-show-form" onSubmit={handleRequestShow} className="space-y-10">
                
                {/* Identificação */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 text-slate-900 mb-2">
                    <User size={18} className="text-blue-600" />
                    <h4 className="text-xs font-black uppercase tracking-widest">Sua Identificação</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail *</label>
                      <input 
                        required
                        type="email"
                        value={requestShowData.email}
                        onChange={e => setRequestShowData({...requestShowData, email: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo *</label>
                      <input 
                        required
                        value={requestShowData.displayName}
                        onChange={e => setRequestShowData({...requestShowData, displayName: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                        placeholder="Como devemos te chamar?"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp / Telefone *</label>
                      <input 
                        required
                        value={requestShowData.telefone}
                        onChange={e => setRequestShowData({...requestShowData, telefone: maskPhone(e.target.value)})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </div>

                {/* Dados do Show */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 text-slate-900 mb-2">
                    <Music size={18} className="text-blue-600" />
                    <h4 className="text-xs font-black uppercase tracking-widest">Dados do Show</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data do Evento *</label>
                      <input 
                        required
                        type="date"
                        value={requestShowData.data}
                        onChange={e => setRequestShowData({...requestShowData, data: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Horário *</label>
                      <input 
                        required
                        type="time"
                        value={requestShowData.hora}
                        onChange={e => setRequestShowData({...requestShowData, hora: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Evento *</label>
                      <select 
                        required
                        value={requestShowData.tipo}
                        onChange={e => setRequestShowData({...requestShowData, tipo: e.target.value as ShowType})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold appearance-none"
                      >
                        <option value="Casamento">Casamento</option>
                        <option value="Aniversário">Aniversário</option>
                        <option value="Formatura">Formatura</option>
                        <option value="Confraternização">Confraternização</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Duração (Horas)</label>
                      <input 
                        type="number"
                        step="0.5"
                        value={requestShowData.duracao}
                        onChange={e => setRequestShowData({...requestShowData, duracao: Number(e.target.value)})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Local do Evento *</label>
                      <input 
                        required
                        value={requestShowData.local}
                        onChange={e => setRequestShowData({...requestShowData, local: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                        placeholder="Nome do Buffet, Chácara ou Espaço"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <button 
                        type="button"
                        onClick={() => setRequestShowData({...requestShowData, som: !requestShowData.som})}
                        className={`w-full flex items-center p-6 rounded-2xl border transition-all text-left ${requestShowData.som ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${requestShowData.som ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                          {requestShowData.som ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                        </div>
                        <div className="ml-4">
                          <p className="text-[10px] font-black uppercase tracking-widest">Sonorização HS</p>
                          <p className={`text-[8px] font-bold uppercase mt-0.5 tracking-widest ${requestShowData.som ? 'text-blue-100' : 'text-slate-400'}`}>
                            {requestShowData.som ? 'Equipamento Incluso' : 'Já possuo sonorização'}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <footer className="p-8 border-t border-slate-50 bg-white flex flex-col sm:flex-row gap-4 flex-shrink-0">
              <button 
                type="button"
                onClick={() => setIsRequestShow(false)}
                className="flex-1 py-5 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="request-show-form"
                disabled={loading}
                className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center space-x-3 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                <span>{loading ? 'Processando...' : 'Solicitar Show Agora'}</span>
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Modal de Sucesso com Senha */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in"></div>
          
          <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl border border-white overflow-hidden animate-fade-in p-10 text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                <CheckCircle2 size={48} />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Show Solicitado!</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                Sua solicitação foi enviada com sucesso. Criamos uma conta para você acompanhar o status do seu evento.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sua Chave de Acesso Provisória</p>
              <div className="flex flex-col items-center space-y-4">
                <div className="text-4xl font-black text-blue-600 tracking-[0.2em] font-mono select-all">
                  {generatedPassword}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                    alert("Senha copiada para a área de transferência!");
                  }}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center space-x-2"
                >
                  <span>Copiar Senha</span>
                </button>
              </div>
              <div className="flex items-center justify-center space-x-2 text-amber-600 bg-amber-50 py-2 px-4 rounded-full">
                <Info size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Guarde esta senha com segurança!</span>
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => navigate(from, { replace: true })}
                className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-slate-800 transition-all active:scale-95"
              >
                Acessar meu Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
