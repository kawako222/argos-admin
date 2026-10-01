import { useState } from 'react';
import { Users, CreditCard, Menu, X, LayoutDashboard, LogOut, Kanban, Lightbulb } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Pagos from './pages/Pagos';
import Pipeline from './pages/Pipeline';
import Marketing from './pages/Marketing';
import Login from './pages/Login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('argos_token') !== null;
  });
  
  const [tab, setTab] = useState('directorio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('argos_token');
    localStorage.removeItem('argos_user');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans overflow-hidden">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out shadow-xl md:shadow-none md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white">ARGOS</h2>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">Admin Panel</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white transition-colors p-2 -mr-2"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          <p className="px-4 mt-2 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Gestion Principal
          </p>

          <button
            onClick={() => handleTabChange('directorio')}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              tab === 'directorio'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={20} className={tab === 'directorio' ? 'text-white' : 'text-slate-400'} /> 
            Directorio y Metricas
          </button>

          <button
            onClick={() => handleTabChange('pipeline')}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              tab === 'pipeline'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Kanban size={20} className={tab === 'pipeline' ? 'text-white' : 'text-slate-400'} /> 
            Pipeline CRM
          </button>

          <button
            onClick={() => handleTabChange('marketing')}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              tab === 'marketing'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Lightbulb size={20} className={tab === 'marketing' ? 'text-white' : 'text-slate-400'} /> 
            Marketing y Eventos
          </button>

          <button
            onClick={() => handleTabChange('pagos')}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              tab === 'pagos'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CreditCard size={20} className={tab === 'pagos' ? 'text-white' : 'text-slate-400'} /> 
            Pagos (Dia 13)
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 shadow-inner">
              AD
            </div>
            <div>
              <p className="text-sm font-bold text-white">Administracion</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">Argos Academy</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-colors"
          >
            <LogOut size={18} /> Cerrar Sesion
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 min-w-0 flex flex-col h-screen relative">
        <header className="bg-white/80 backdrop-blur-md shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-serif font-bold text-gray-800 tracking-tight hidden sm:block">
              {tab === 'directorio' && 'Directorio Operativo'}
              {tab === 'pipeline' && 'Embudo de Ventas (Pipeline)'}
              {tab === 'marketing' && 'Marketing y Eventos'}
              {tab === 'pagos' && 'Control Financiero'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 hidden md:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
              <LayoutDashboard size={14} className="text-gray-400" /> Sistema Argos v1.0
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {tab === 'directorio' && <Dashboard />}
            {tab === 'pipeline' && <Pipeline />}
            {tab === 'marketing' && <Marketing />}
            {tab === 'pagos' && <Pagos />}
          </div>
        </div>
      </main>
    </div>
  );
}