import { useState, useEffect } from 'react';
import { UserPlus, ArrowRight, ArrowLeft, Trash2, MessageCircle, X, GraduationCap, CheckCircle } from 'lucide-react';
import { getProspectos, getPaquetes, createProspecto, updateProspecto, deleteProspecto, convertirProspecto } from '../services/api';

const COLUMNAS = [
  { key: 'nuevo', label: 'Nuevos', color: 'border-blue-500' },
  { key: 'agendado', label: 'Clase Agendada', color: 'border-yellow-500' },
  { key: 'asistio', label: 'Asistieron', color: 'border-purple-500' },
  { key: 'inscrito', label: 'Inscritos', color: 'border-emerald-500' },
  { key: 'perdido', label: 'Perdidos', color: 'border-rose-500' },
];

export default function Pipeline() {
  const [prospectos, setProspectos] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ nombre: '', telefono: '', notas: '' });

  // Estado para conversión a alumna oficial
  const [convertingProspecto, setConvertingProspecto] = useState(null);
  const [convertForm, setConvertForm] = useState({ paquete_id: '', porcentaje_beca: 0 });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [dataProspectos, dataPaquetes] = await Promise.all([getProspectos(), getPaquetes()]);
        setProspectos(dataProspectos);
        setPaquetes(dataPaquetes);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const refreshProspectos = async () => {
    try {
      const data = await getProspectos();
      setProspectos(data);
    } catch (err) {
      console.error('Error recargando prospectos:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProspecto(form);
      setForm({ nombre: '', telefono: '', notas: '' });
      setIsModalOpen(false);
      await refreshProspectos();
    } catch (err) {
      console.error('Error creando prospecto:', err);
    }
  };

  const handleMoverEtapa = async (prospecto, nuevoEstado) => {
    try {
      await updateProspecto(prospecto.id, {
        nombre: prospecto.nombre,
        telefono: prospecto.telefono,
        estado: nuevoEstado,
        notas: prospecto.notas
      });
      await refreshProspectos();
    } catch (err) {
      console.error('Error actualizando etapa:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('⚠️ ¿Confirmar eliminación definitiva de este prospecto?')) {
      try {
        await deleteProspecto(id);
        await refreshProspectos();
      } catch (err) {
        console.error('Error eliminando:', err);
      }
    }
  };

  // Convertir a Alumna Oficial
  const handleConvertir = async (e) => {
    e.preventDefault();
    try {
      await convertirProspecto(convertingProspecto.id, convertForm);
      setConvertingProspecto(null);
      await refreshProspectos();
    } catch (err) {
      console.error('Error convirtiendo:', err);
      alert('Hubo un error al convertir el prospecto.');
    }
  };

  const total = prospectos.length;
  const agendados = prospectos.filter(p => ['agendado', 'asistio', 'inscrito'].includes(p.estado)).length;
  const asistieron = prospectos.filter(p => ['asistio', 'inscrito'].includes(p.estado)).length;
  const inscritos = prospectos.filter(p => p.estado === 'inscrito').length;

  const tasaAsistencia = agendados > 0 ? ((asistieron / agendados) * 100).toFixed(1) : 0;
  const tasaCierre = asistieron > 0 ? ((inscritos / asistieron) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 tracking-tight">
            Pipeline de Ventas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Seguimiento de prospectos y conversión de inscripciones.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm"
        >
          <UserPlus size={16} /> Capturar Prospecto
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Contactos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inscritos</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{inscritos}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tasa Asistencia</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{tasaAsistencia}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tasa Cierre</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{tasaCierre}%</p>
        </div>
      </div>

      {loading ? (
        <p className="p-8 text-center text-gray-500">Cargando tablero...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {COLUMNAS.map((col, colIdx) => {
            const items = prospectos.filter(p => p.estado === col.key);

            return (
              <div key={col.key} className="bg-gray-100/70 rounded-2xl p-3 border border-gray-200/60 flex flex-col min-h-[500px]">
                <div className={`border-l-4 ${col.color} pl-3 py-1 mb-3 flex items-center justify-between`}>
                  <h2 className="font-semibold text-sm text-gray-800">{col.label}</h2>
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {items.map(p => (
                    <div key={p.id} className={`bg-white p-4 rounded-xl shadow-sm border ${p.convertido ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200/70'} hover:shadow transition-all`}>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <p className="font-semibold text-sm text-gray-900 leading-snug">{p.nombre}</p>
                        <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-rose-600 p-0.5 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <a
                          href={`https://wa.me/521${p.telefono.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-md border border-gray-200 transition-colors"
                        >
                          <MessageCircle size={12} className="text-emerald-600" />
                          {p.telefono}
                        </a>
                      </div>

                      {p.notas && <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mb-3">{p.notas}</p>}

                      {/* Controles de Kanban */}
                      {!p.convertido && (
                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs mb-2">
                          {colIdx > 0 ? (
                            <button onClick={() => handleMoverEtapa(p, COLUMNAS[colIdx - 1].key)} className="text-gray-500 hover:text-gray-800 p-1">
                              <ArrowLeft size={13} />
                            </button>
                          ) : <div />}

                          {colIdx < COLUMNAS.length - 1 && (
                            <button onClick={() => handleMoverEtapa(p, COLUMNAS[colIdx + 1].key)} className="text-slate-800 hover:text-blue-600 font-medium flex items-center gap-1 p-1">
                              {COLUMNAS[colIdx + 1].label} <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Botón de Conversión para Inscritos */}
                      {col.key === 'inscrito' && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          {p.convertido ? (
                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 py-1.5 rounded-lg w-full">
                              <CheckCircle size={14} /> Alumna Oficial
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setConvertForm({ paquete_id: paquetes[0]?.id || '', porcentaje_beca: 0 });
                                setConvertingProspecto(p);
                              }}
                              className="flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 py-2 rounded-lg w-full transition-colors shadow-sm"
                            >
                              <GraduationCap size={14} /> Dar de Alta
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center text-xs text-gray-400">
                      Sin registros
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Conversión */}
      {convertingProspecto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setConvertingProspecto(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700"><GraduationCap size={24} /></div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Inscripción Oficial</h2>
                <p className="text-sm text-gray-500">{convertingProspecto.nombre}</p>
              </div>
            </div>
            
            <form onSubmit={handleConvertir} className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mb-4">
                <p className="text-xs text-gray-500 font-medium">Al completar este paso:</p>
                <ul className="text-xs text-gray-600 mt-1 space-y-1 list-disc list-inside">
                  <li>Se agregará a {convertingProspecto.nombre} al Directorio.</li>
                  <li>Se generará su primer recibo de pago automático.</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paquete Contratado</label>
                <select 
                  value={convertForm.paquete_id} 
                  onChange={e => setConvertForm({ ...convertForm, paquete_id: e.target.value })} 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white"
                >
                  {paquetes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beca Aplicable</label>
                <select 
                  value={convertForm.porcentaje_beca} 
                  onChange={e => setConvertForm({ ...convertForm, porcentaje_beca: e.target.value })} 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white"
                >
                  <option value={0}>Sin Beca</option>
                  <option value={25}>25% Descuento</option>
                  <option value={50}>50% Descuento</option>
                  <option value={100}>100% Beca Completa</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors mt-2 shadow-sm">
                Confirmar Alta y Crear Recibo
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* (El Modal de Capturar Nuevo se omite por brevedad, asume que está aquí igual que en la versión anterior) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Capturar Prospecto</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nombre Completo</label>
                <input type="text" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Telefono</label>
                <input type="text" required value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Notas de Interes</label>
                <textarea rows={3} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none" />
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-sm">Guardar en Pipeline</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}