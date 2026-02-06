
import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useLocation,
  Link
} from 'react-router-dom';
import { onAuthStateChanged, signOut, signInWithPopup } from '@firebase/auth';
import type { User } from '@firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { UserRole, UserProfile } from './types';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserCircle, 
  LogOut, 
  Menu, 
  X,
  Briefcase,
  Speaker,
  DollarSign,
  Music,
  CheckCircle2
} from 'lucide-react';

// Components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Integrantes from './pages/Integrantes';
import Equipment from './pages/Equipment';
import Finance from './pages/Finance';
import FinanceDetail from './pages/FinanceDetail';
import Profile from './pages/Profile';
import Confirmacoes from './pages/Confirmacoes';

export const LOGO_URL = "https://res.cloudinary.com/dvq0tmbil/image/upload/v1770346599/logoHSBlack_affzmc.png";
export const DEFAULT_AVATAR = "https://i.ibb.co/pjTnM2NQ/avatar-Sucesso.png";

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user as User | null);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Novo Usuário',
            role: UserRole.CONTRATANTE,
            photoURL: user.photoURL || DEFAULT_AVATAR
          };
          await setDoc(doc(db, 'users', user.uid), newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-slate-50">
      <img src={LOGO_URL} alt="Loading" className="w-32 animate-pulse mb-4" />
      <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
        <div className="w-1/2 h-full bg-blue-600 animate-slide-loading"></div>
      </div>
    </div>
  );
  if (!userProfile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.CONTRATANTE, UserRole.INTEGRANTE] },
    { name: 'Meus Shows', path: '/events', icon: Music, roles: [UserRole.ADMIN, UserRole.CONTRATANTE] },
    { name: 'Confirmações', path: '/confirmacoes', icon: CheckCircle2, roles: [UserRole.INTEGRANTE] },
    { name: 'Clientes', path: '/clients', icon: Briefcase, roles: [UserRole.ADMIN] },
    { name: 'Integrantes', path: '/integrantes', icon: Users, roles: [UserRole.ADMIN] },
    { name: 'Equipamentos', path: '/equipment', icon: Speaker, roles: [UserRole.ADMIN] },
    { name: 'Financeiro', path: '/finance', icon: DollarSign, roles: [UserRole.ADMIN, UserRole.CONTRATANTE, UserRole.INTEGRANTE] },
    { name: 'Meu Perfil', path: '/profile', icon: UserCircle, roles: [UserRole.ADMIN, UserRole.CONTRATANTE, UserRole.INTEGRANTE] },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 text-slate-900 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="p-10 flex flex-col items-center">
          <img 
            src={LOGO_URL} 
            alt="HS Logo" 
            className="w-40 drop-shadow-sm hover:scale-105 transition-transform duration-300" 
          />
          <div className="mt-4 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
            <p className="text-[10px] text-blue-600 uppercase tracking-[0.3em] font-black">Backstage HS</p>
          </div>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-1 overflow-y-auto">
          {links.filter(link => !link.roles || (userProfile && link.roles.includes(userProfile.role))).map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => onClose()}
                className={`flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
              >
                <link.icon size={19} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`} />
                <span className={`text-sm font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-90'}`}>{link.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3 mb-6 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
              <img src={userProfile?.photoURL || DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate text-slate-900 uppercase tracking-tight">{userProfile?.displayName}</p>
              <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">{userProfile?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600 transition-all duration-300 group shadow-sm"
          >
            <LogOut size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Encerrar Sessão</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex selection:bg-blue-100 selection:text-blue-600">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 lg:ml-72 flex flex-col">
        <header className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <Menu size={28} />
          </button>
          <img src={LOGO_URL} alt="HS Logo" className="h-10" />
          <div className="w-10"></div>
        </header>
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
            <Route path="/confirmacoes" element={<ProtectedRoute allowedRoles={[UserRole.INTEGRANTE]}><Confirmacoes /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><Clients /></ProtectedRoute>} />
            <Route path="/clients/:id" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><ClientDetail /></ProtectedRoute>} />
            <Route path="/integrantes" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><Integrantes /></ProtectedRoute>} />
            <Route path="/equipment" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><Equipment /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CONTRATANTE, UserRole.INTEGRANTE]}><Finance /></ProtectedRoute>} />
            <Route path="/finance/:id" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CONTRATANTE, UserRole.INTEGRANTE]}><FinanceDetail /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-500" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
