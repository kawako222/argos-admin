import { useState, useEffect } from 'react';
import { Users, DollarSign, UserPlus, CheckCircle2, AlertCircle, Edit2, UserMinus, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { getAlumnas, getPaquetes, createAlumna, updateAlumna, darBajaAlumna, reactivarAlumna } from '../services/api';

export default function Dashboard() {
  const [alumnas, setAlumnas] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({ nombre_completo: '', telefono_contacto: '', paquete_id: '', porcentaje_beca: 0 });
  
  // Estados de Modales
  const [editingAlumna, setEditingAlumna] = useState(null);
  const [bajaAlumna, setBajaAlumna] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [dataAlumnas, dataPaquetes] = await Promise.all([getAlumnas(), getPaquetes()]);
        setAlumnas(dataAlumnas);
        setPaquetes(dataPaquetes);
        if (dataPaquetes.length > 0) setForm(prev => ({ ...prev, paquete_id: dataPaquetes[0].id }));
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const refreshTable = async () => {
    try {
      const data = await getAlumnas();
      setAlumnas(data);
    } catch (err) {
      console.error('Error recargando la tabla:', err);
    }
  };

  // --- CÁLCULO DE MÉTRICAS ---
  const alumnasActivas = alumnas.filter(a => a.estatus === 'activa');
  const totalActivas = alumnasActivas.length;
  const enRiesgo = alumnasActivas.filter(a => a.adeudos_pendientes >= 2).length;
  const ingresosEstimados = alumnasActivas.reduce((acc, curr) => acc + (Number(curr.precio || 0) * (1 - (curr.porcentaje_beca || 0) / 100)), 0);

  // --- MANEJADORES ---
  const handleCreate = async (e) => {
    e.preventDefault();
    await createAlumna(form);
    setForm({ nombre_completo: '', telefono_contacto: '', paquete_id: paquetes[0]?.id || '', porcentaje_beca: 0 });
    await refreshTable();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateAlumna(editingAlumna.id, editingAlumna);
    setEditingAlumna(null);
    await refreshTable();
  };

  const handleBaja = async (e) => {
    e.preventDefault();
    if (!motivoBaja) return alert('Por favor selecciona un motivo de baja.');
    await darBajaAlumna(bajaAlumna.id, motivoBaja);
    setBajaAlumna(null);
    setMotivoBaja('');
    await refreshTable();
  };

  const handleReactivar = async (id) => {
    if (window.confirm('¿Deseas reactivar a esta alumna?')) {
      await reactivarAlumna(id);
      await refreshTable();
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 relative">
      <header>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 tracking-tight">Directorio Operativo</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Gestión de alumnas, becas y prevención de retención.</p>
      </header>

      {/* Métricas con Alerta de Riesgo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">
            <Users size={20} className="text-blue-600" /> Activas
          </div>
          <div className="text-4xl font-bold text-gray-900">{totalActivas}</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-amber-600 text-sm font-medium uppercase tracking-wider mb-2">
            <AlertTriangle size={20} /> Riesgo Abandono
          </div>
          <div className="text-4xl font-bold text-amber-600 flex items-end gap-2">
            {enRiesgo} <span className="text-sm text-gray-500 font-medium mb-1">alumnas con +2 adeudos</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">
            <DollarSign size={20} className="text-green-600" /> Ingreso Mensual
          </div>
          <div className="text-4xl font-bold text-gray-900">${ingresosEstimados.toLocaleString()} <span className="text-xl text-gray-400">MXN</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* TABLA DE ALUMNAS */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-bold text-gray-900">Directorio General</h2></div>
          <div className="overflow-x-auto w-full max-h-[600px] overflow-y-auto">
            {loading ? (
              <p className="p-8 text-center text-gray-500">Cargando directorio...</p>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nombre</th>
                    <th className="px-6 py-4 font-medium">Paquete</th>
                    <th className="px-6 py-4 font-medium">Estatus</th>
                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alumnas.map((a) => (
                    <tr key={a.id} className={`transition-colors ${a.estatus === 'inactiva' ? 'bg-gray-50 opacity-75' : 'hover:bg-blue-50/30'}`}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{a.nombre_completo}</div>
                        {a.adeudos_pendientes >= 2 && a.estatus === 'activa' && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded-md w-max border border-amber-200">
                            <AlertTriangle size={12} /> Riesgo: {a.adeudos_pendientes} meses sin pagar
                          </div>
                        )}
                        {a.estatus === 'inactiva' && (
                          <div className="text-xs text-gray-500 mt-1">Baja: {a.motivo_baja}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {a.paquete}
                        {a.porcentaje_beca > 0 && <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">{a.porcentaje_beca}% OFF</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          a.estatus === 'activa' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {a.estatus === 'activa' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} 
                          {a.estatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        {a.estatus === 'activa' ? (
                          <>
                            <button onClick={() => setEditingAlumna(a)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Editar"><Edit2 size={16} /></button>
                            <button onClick={() => setBajaAlumna(a)} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition" title="Dar de baja"><UserMinus size={16} /></button>
                          </>
                        ) : (
                          <button onClick={() => handleReactivar(a.id)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition flex items-center gap-1 text-xs font-bold" title="Reactivar">
                            <RefreshCw size={14} /> Reactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* FORMULARIO DE ALTA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><UserPlus size={20} className="text-blue-600" /> Nueva Alumna</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input type="text" required value={form.nombre_completo} onChange={e => setForm({ ...form, nombre_completo: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp)</label>
              <input type="text" required value={form.telefono_contacto} onChange={e => setForm({ ...form, telefono_contacto: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paquete</label>
              <select value={form.paquete_id} onChange={e => setForm({ ...form, paquete_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white focus:ring-2 focus:ring-blue-500">
                {paquetes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beca Aplicable</label>
              <select value={form.porcentaje_beca} onChange={e => setForm({ ...form, porcentaje_beca: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white focus:ring-2 focus:ring-blue-500">
                <option value={0}>Sin Beca</option>
                <option value={25}>25% Descuento</option>
                <option value={50}>50% Descuento</option>
                <option value={100}>100% Beca Completa</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors mt-2 shadow-sm">Registrar Alumna</button>
          </form>
        </div>
      </div>

      {/* MODAL DE EDICIÓN */}
      {editingAlumna && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setEditingAlumna(null)} className="absolute top-4 right-4 text-gray-400 hover:bg-gray-100 rounded-full p-1 transition-colors"><X size={20}/></button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Editar Alumna</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" required value={editingAlumna.nombre_completo} onChange={e => setEditingAlumna({ ...editingAlumna, nombre_completo: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar Paquete</label>
                <select value={editingAlumna.paquete_id} onChange={e => setEditingAlumna({ ...editingAlumna, paquete_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white focus:ring-2 focus:ring-blue-500">
                  {paquetes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beca</label>
                <select value={editingAlumna.porcentaje_beca || 0} onChange={e => setEditingAlumna({ ...editingAlumna, porcentaje_beca: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white focus:ring-2 focus:ring-blue-500">
                  <option value={0}>Sin Beca</option>
                  <option value={25}>25% Descuento</option>
                  <option value={50}>50% Descuento</option>
                  <option value={100}>100% Beca Completa</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingAlumna(null)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE BAJA ADMINISTRATIVA */}
      {bajaAlumna && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setBajaAlumna(null)} className="absolute top-4 right-4 text-gray-400 hover:bg-gray-100 rounded-full p-1 transition-colors"><X size={20}/></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-rose-100 p-3 rounded-xl text-rose-600"><UserMinus size={24} /></div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Baja de Alumna</h2>
                <p className="text-sm text-gray-500">{bajaAlumna.nombre_completo}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              La alumna no será eliminada de la base de datos, pero pasará a estado inactivo y <b>se cancelarán sus cobros pendientes</b>. Podrás reactivarla en cualquier momento.
            </p>
            <form onSubmit={handleBaja} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Motivo principal de la baja:</label>
                <select 
                  required
                  value={motivoBaja} 
                  onChange={e => setMotivoBaja(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white focus:ring-2 focus:ring-rose-500"
                >
                  <option value="" disabled>Selecciona el motivo...</option>
                  <option value="Motivos Económicos">Motivos Económicos / Precio</option>
                  <option value="Incompatibilidad de Horario">Incompatibilidad de Horario</option>
                  <option value="Mudanza / Distancia">Mudanza / Distancia</option>
                  <option value="Falta de Interés">Falta de Interés / Desmotivación</option>
                  <option value="Problemas de Salud / Lesión">Problemas de Salud / Lesión</option>
                  <option value="Deuda Incobrable (>3 meses)">Deuda Incobrable (Más de 3 meses)</option>
                  <option value="Otro">Otro (Sin especificar)</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl hover:bg-rose-700 transition-colors shadow-sm mt-4">
                Confirmar Baja
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}