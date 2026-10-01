import { useState, useEffect } from 'react';
import { Lightbulb, CalendarHeart, Trash2, Plus, Sparkles } from 'lucide-react';
import { getIdeas, createIdea, deleteIdea } from '../services/api';

export default function Marketing() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ tipo: 'marketing_semanal', contenido: '' });

  // 1. Carga Inicial Segura (El linter aprueba esto)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await getIdeas();
        setIdeas(data);
      } catch (err) {
        console.error('Error cargando ideas iniciales:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // 2. Función de recarga post-acciones (Crear/Borrar)
  const refreshIdeas = async () => {
    try {
      const data = await getIdeas();
      setIdeas(data);
    } catch (err) {
      console.error('Error recargando ideas:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.contenido.trim()) return;
    
    try {
      await createIdea(form);
      setForm({ ...form, contenido: '' }); // Mantiene el tipo seleccionado, limpia el texto
      await refreshIdeas();
    } catch (err) {
      console.error('Error creando idea:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta idea del banco?')) {
      try {
        await deleteIdea(id);
        await refreshIdeas();
      } catch (err) {
        console.error('Error eliminando idea:', err);
      }
    }
  };

  const ideasMarketing = ideas.filter(i => i.tipo === 'marketing_semanal');
  const ideasEventos = ideas.filter(i => i.tipo === 'evento_mes');

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 tracking-tight">Marketing y Eventos</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">
          Banco de ideas para notificaciones automáticas a Dirección.
        </p>
      </header>

      {/* FORMULARIO DE CAPTURA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-amber-500" /> Agregar al Banco de Ideas
        </h2>
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/4">
            <select 
              value={form.tipo} 
              onChange={e => setForm({ ...form, tipo: e.target.value })} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all font-medium text-sm text-gray-700"
            >
              <option value="marketing_semanal">Marketing Semanal (Lunes)</option>
              <option value="evento_mes">Evento del Mes (Día 15)</option>
            </select>
          </div>
          <div className="flex-1 flex gap-2">
            <input 
              type="text" 
              required 
              placeholder="Ej. Grabar un trend de TikTok con las alumnas de Pre Ballet..." 
              value={form.contenido} 
              onChange={e => setForm({ ...form, contenido: e.target.value })} 
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm"
            />
            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2">
              <Plus size={18} /> Guardar
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COLUMNA: MARKETING SEMANAL */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
            <h2 className="text-md font-bold text-blue-900 flex items-center gap-2">
              <Lightbulb size={18} className="text-blue-600" /> Ideas Semanales (Lunes)
            </h2>
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">{ideasMarketing.length}</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-gray-50/30">
            {loading ? <p className="text-sm text-center text-gray-400">Cargando...</p> : ideasMarketing.length === 0 ? <p className="text-sm text-center text-gray-400 py-4 border-2 border-dashed rounded-xl">Sin ideas de marketing</p> : null}
            {ideasMarketing.map(idea => (
              <div key={idea.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start gap-4 hover:border-blue-200 transition-colors">
                <p className="text-sm text-gray-700 leading-relaxed">{idea.contenido}</p>
                <button onClick={() => handleDelete(idea.id)} className="text-gray-300 hover:text-rose-500 transition-colors mt-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA: EVENTO DEL MES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
            <h2 className="text-md font-bold text-purple-900 flex items-center gap-2">
              <CalendarHeart size={18} className="text-purple-600" /> Eventos del Mes (Día 15)
            </h2>
            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full">{ideasEventos.length}</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-gray-50/30">
            {loading ? <p className="text-sm text-center text-gray-400">Cargando...</p> : ideasEventos.length === 0 ? <p className="text-sm text-center text-gray-400 py-4 border-2 border-dashed rounded-xl">Sin propuestas de eventos</p> : null}
            {ideasEventos.map(idea => (
              <div key={idea.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start gap-4 hover:border-purple-200 transition-colors">
                <p className="text-sm text-gray-700 leading-relaxed">{idea.contenido}</p>
                <button onClick={() => handleDelete(idea.id)} className="text-gray-300 hover:text-rose-500 transition-colors mt-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}