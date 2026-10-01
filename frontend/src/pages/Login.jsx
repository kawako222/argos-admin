import { useState } from 'react';
import { login } from '../services/api';
import { Lock } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login({ email, password });
      localStorage.setItem('argos_token', data.token);
      localStorage.setItem('argos_user', JSON.stringify(data.user));
      onLoginSuccess();
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 md:p-12 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="text-blue-600" size={32} />
        </div>
        
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Acceso Admin</h1>
        <p className="text-gray-500 mb-8">Ingresa tus credenciales de Argos Academy para continuar.</p>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="admin@argos.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
            Entrar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}