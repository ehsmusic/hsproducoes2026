
import React, { useState } from 'react';
import { useAuth, LOGO_URL } from '../App';
import { useNavigate, useLocation } from 'react-router';
import { Chrome, Mail, Lock, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from '@firebase/auth';
import { auth } from '../firebase';

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

  const from = location.state?.from?.pathname || '/';

  if (currentUser) {
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
        </div>
      </div>
    </div>
  );
};

export default Login;
