import { useState, useEffect } from 'react';
import { Users, DollarSign, UserPlus, CheckCircle2, AlertCircle, Edit2, Trash2, X } from 'lucide-react';
import { getAlumnas, getPaquetes, createAlumna, updateAlumna, deleteAlumna } from '../services/api';

export default function Dashboard() {
  const [alumnas, setAlumnas] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para Formulario de Alta
  const [form, setForm] = useState({ 
    nombre_completo: '', 
    telefono_contacto: '', 
    paquete_id: '', 
    porcentaje_beca: 0 
  });
  
  // Estado para el Modal de Edición
  const [editingAlumna, setEditingAlumna] = useState(null);

  // 1. Carga Inicial (Segura para el linter)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [dataAlumnas, dataPaquetes] = await Promise.all([getAlumnas(), getPaquetes()]);
        setAlumnas(dataAlumnas);
        setPaquetes(dataPaquetes);
        
        if (dataPaquetes.length > 0) {
          setForm(prev => ({ ...prev, paquete_id: dataPaquetes[0].id }));
        }
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // 2. Recarga de tabla post-acciones
  const refreshTable = async () => {
    try {
      const data = await getAlumnas();
      setAlumnas(data);
    } catch (err) {
      console.error('Error recargando la tabla:', err);
    }
  };

  // --- CÁLCULO DE MÉTRICAS ---
  const totalActivas = alumnas.filter(a => a.estatus === 'activa').length;
  const ingresosEstimados = alumnas
    .filter(a => a.estatus === 'activa')
    .reduce((acc, curr) => acc + (Number(curr.precio || 0) * (1 - (curr.porcentaje_beca || 0) / 100)), 0);

  // --- MANEJADORES DE EVENTOS (CRUD) ---
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAlumna(form);
      setForm({ 
        nombre_completo: '', 
        telefono_contacto: '', 
        paquete_id: paquetes[0]?.id || '', 
        porcentaje_beca: 0 
      });
      await refreshTable();
    } catch (err) {
      console.error('Error al registrar:', err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateAlumna(editingAlumna.id, editingAlumna);
      setEditingAlumna(null);
      await refreshTable();
    } catch (err) {
      console.error('Error al actualizar:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('⚠️ ¿Estás completamente seguro de borrar a esta alumna? Se eliminará de la base de datos junto con todo su historial de pagos.')) {
      try {
        await deleteAlumna(id);
        await refreshTable();
      } catch (err) {
        console.error('Error al eliminar:', err);
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 relative">
      <header>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 tracking-tight">Directorio Operativo</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Gestión de alumnas y administración de becas.</p>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">
            <Users size={20} className="text-blue-600" /> Alumnas Activas
          </div>
          <div className="text-4xl font-bold text-gray-900">{totalActivas}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">
            <DollarSign size={20} className="text-green-600" /> Ingreso Mensual (Con becas)
          </div>
          <div className="text-4xl font-bold text-gray-900">${ingresosEstimados.toLocaleString()} <span className="text-xl text-gray-400">MXN</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* TABLA DE ALUMNAS */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Directorio General</h2>
          </div>
          
          <div className="overflow-x-auto w-full">
            {loading ? (
              <p className="p-8 text-center text-gray-500">Cargando directorio...</p>
            ) : alumnas.length === 0 ? (
              <p className="p-8 text-center text-gray-500">No hay alumnas registradas.</p>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nombre</th>
                    <th className="px-6 py-4 font-medium">Paquete</th>
                    <th className="px-6 py-4 font-medium">Beca</th>
                    <th className="px-6 py-4 font-medium">Estatus</th>
                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alumnas.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{a.nombre_completo}</td>
                      <td className="px-6 py-4 text-gray-600">{a.paquete}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {a.porcentaje_beca > 0 ? (
                          <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-md text-xs font-bold border border-purple-200">
                            {a.porcentaje_beca}% OFF
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin Beca</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${a.estatus === 'activa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {a.estatus === 'activa' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} 
                          {a.estatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingAlumna(a)} 
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(a.id)} 
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* FORMULARIO DE ALTA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" /> Nueva Alumna
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input 
                type="text" 
                required 
                value={form.nombre_completo} 
                onChange={e => setForm({ ...form, nombre_completo: e.target.value })} 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp)</label>
              <input 
                type="text" 
                required 
                value={form.telefono_contacto} 
                onChange={e => setForm({ ...form, telefono_contacto: e.target.value })} 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paquete Asignado</label>
              <select 
                value={form.paquete_id} 
                onChange={e => setForm({ ...form, paquete_id: e.target.value })} 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
              >
                {paquetes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beca Aplicable</label>
              <select 
                value={form.porcentaje_beca} 
                onChange={e => setForm({ ...form, porcentaje_beca: e.target.value })} 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
              >
                <option value={0}>Sin Beca</option>
                <option value={25}>25% Descuento</option>
                <option value={50}>50% Descuento</option>
                <option value={100}>100% Beca Completa</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors mt-2 shadow-sm">
              Registrar Alumna
            </button>
          </form>
        </div>
      </div>

      {/* MODAL DE EDICIÓN FLOTANTE */}
      {editingAlumna && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setEditingAlumna(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20}/>
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Editar Información</h2>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required 
                  value={editingAlumna.nombre_completo} 
                  onChange={e => setEditingAlumna({ ...editingAlumna, nombre_completo: e.target.value })} 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar Paquete</label>
                <select 
                  value={editingAlumna.paquete_id} 
                  onChange={e => setEditingAlumna({ ...editingAlumna, paquete_id: e.target.value })} 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                >
                  {paquetes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ajustar Beca</label>
                <select 
                  value={editingAlumna.porcentaje_beca || 0} 
                  onChange={e => setEditingAlumna({ ...editingAlumna, porcentaje_beca: e.target.value })} 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                >
                  <option value={0}>Sin Beca</option>
                  <option value={25}>25% Descuento</option>
                  <option value={50}>50% Descuento</option>
                  <option value={100}>100% Beca Completa</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingAlumna(null)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}