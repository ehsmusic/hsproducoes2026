
import React, { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate, useLocation } from 'react-router-dom';
import { Chrome, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react';
// Fix: Use scoped package @firebase/auth to resolve "no exported member" errors in environments with subpath resolution issues
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@firebase/auth';
import { auth } from '../firebase';

const LOGO_URL = "https://i.ibb.co/2YpCydGT/Logo-HS-Metal-3-D-cor-fundo-transparente.png";

const Login: React.FC = () => {
  const { loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  if (currentUser) {
    navigate(from, { replace: true });
    return null;
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError('Erro ao autenticar com Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError('Credenciais inválidas ou erro de conexão.');
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
            <img src={LOGO_URL} alt="HS Produções" className="w-48 mb-12 drop-shadow-2xl" />
            <h1 className="text-4xl font-black text-white leading-tight mb-6">
              A excelência na gestão de <span className="text-blue-500">grandes eventos.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Sistema exclusivo HS Produções para controle de shows, contratos e logística da banda Helder Santos.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-slate-500 text-sm font-bold">
            <ShieldCheck className="text-blue-500" size={20} />
            <span>ACESSO RESTRITO E SEGURO</span>
          </div>
        </div>

        {/* Lado Direito - Form */}
        <div className="p-8 sm:p-12 md:p-16 flex flex-col justify-center">
          <div className="md:hidden flex justify-center mb-10">
            <img src={LOGO_URL} alt="HS Logo" className="w-32" />
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-white mb-2">
              {isRegister ? 'Solicitar Acesso' : 'Entrar no Sistema'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isRegister ? 'Crie sua conta para solicitar shows.' : 'Identifique-se para continuar.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl flex items-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-white placeholder-slate-600 transition-all"
                  placeholder="admin@hsproducoes.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-white placeholder-slate-600 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <span>{isRegister ? 'Criar Cadastro' : 'Acessar Painel'}</span>}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <div className="relative flex justify-center text-xs uppercase font-bold tracking-[0.3em]"><span className="px-4 bg-transparent text-slate-600">Ou</span></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-8 w-full flex justify-center items-center py-4 bg-slate-950 border border-slate-800 hover:border-slate-600 rounded-2xl font-bold text-slate-300 transition-all duration-300 active:scale-[0.98]"
          >
            <Chrome className="mr-3 text-red-500" size={20} />
            Entrar com Google
          </button>

          <p className="mt-10 text-center text-sm font-bold text-slate-500">
            {isRegister ? 'Já possui acesso?' : 'Ainda não tem conta?'}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="ml-2 text-blue-500 hover:text-blue-400 decoration-2 hover:underline transition-all"
            >
              {isRegister ? 'Faça login' : 'Solicitar Registro'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;