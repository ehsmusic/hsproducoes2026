
import React, { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate, useLocation } from 'react-router';
import { Chrome, Mail, Lock, Loader2, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from '@firebase/auth';
import { auth } from '../firebase';

// Caminho relativo à raiz do servidor para a pasta assets
const LOGO_URL = "./assets/logo.png";

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
      if (err.code === 'auth/unauthorized-domain') {
        setError('Este domínio não está autorizado no Firebase. Adicione-o no console do Firebase.');
      } else {
        setError('Erro ao autenticar com Google. Verifique se o pop-up foi bloqueado.');
      }
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
      setError('Erro ao enviar e-mail de recuperação. Verifique se o e-mail está correto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 p-6">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        
        {/* Lado Esquerdo - Branding */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600/10 to-transparent">
          <div>
            <img 
              src={LOGO_URL} 
              alt="HS Produções" 
              className="w-48 mb-12 drop-shadow-2xl object-contain" 
              onError={(e) => {
                // Fallback caso o caminho assets/logo.png falhe por cache ou erro de carregamento
                console.error("Erro ao carregar logo local");
              }}
            />
            <h1 className="text-4xl font-black text-white leading-tight mb-6">
              Gerencie seus shows com <span className="text-blue-500">precisão cirúrgica.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm font-medium">
              Acesso exclusivo para contratantes, músicos e equipe de produção da HS Produções.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-slate-500 text-sm font-bold">
            <ShieldCheck className="text-blue-500" size={20} />
            <span>AMBIENTE SEGURO HS BACKSTAGE</span>
          </div>
        </div>

        {/* Lado Direito - Form */}
        <div className="p-8 sm:p-12 md:p-16 flex flex-col justify-center">
          <div className="md:hidden flex justify-center mb-10">
            <img src={LOGO_URL} alt="HS Logo" className="w-32 object-contain" />
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-white mb-2">
              {isRegister ? 'Solicitar Acesso' : 'Entrar no Sistema'}
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              {isRegister ? 'Crie sua conta HS Oficial' : 'Faça login para gerenciar seus eventos'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center animate-shake leading-relaxed">
              {error}
            </div>
          )}

          {resetSent && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center space-x-3 animate-fade-in">
              <CheckCircle2 size={18} />
              <span>E-mail de recuperação enviado! Verifique sua caixa.</span>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-blue-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-white placeholder-slate-800 font-bold transition-all"
                  placeholder="exemplo@hsproducoes.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center pr-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                {!isRegister && (
                  <button 
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-white placeholder-slate-800 font-bold transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <span>{isRegister ? 'Criar Nova Conta' : 'Acessar Backstage'}</span>}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.4em]"><span className="px-4 bg-slate-950 text-slate-600 rounded-full">Ou continue com</span></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-8 w-full flex justify-center items-center py-5 bg-white text-slate-950 hover:bg-slate-100 border border-slate-200 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 active:scale-[0.98] shadow-xl"
          >
            {loading ? (
              <Loader2 className="animate-spin text-blue-600" size={20} />
            ) : (
              <>
                <Chrome className="mr-3 text-red-500" size={20} />
                Entrar com o Google
              </>
            )}
          </button>

          <p className="mt-10 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {isRegister ? 'Já possui acesso?' : 'Ainda não tem conta?'}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="ml-2 text-blue-500 hover:text-blue-400 transition-all underline decoration-2 underline-offset-4"
            >
              {isRegister ? 'Fazer Login' : 'Solicitar Cadastro'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
