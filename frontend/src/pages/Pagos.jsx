import { useState, useEffect } from 'react';
import { DollarSign, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { getPagos, marcarPagoPagado, forzarRecargos } from '../services/api';

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshPagosTable = async () => {
    try {
      const data = await getPagos();
      setPagos(data);
    } catch (err) {
      console.error('Error recargando pagos:', err);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await getPagos();
        setPagos(data);
      } catch (err) {
        console.error('Error cargando pagos:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handlePagar = async (id) => {
    try {
      await marcarPagoPagado(id);
      await refreshPagosTable();
    } catch (err) {
      console.error('Error registrando pago:', err);
    }
  };

  const handleSimularCorte = async () => {
    if (!window.confirm('¿Deseas simular el corte del día 13 y aplicar $150 de recargo a los pendientes?')) return;
    try {
      await forzarRecargos();
      await refreshPagosTable();
    } catch (err) {
      console.error('Error aplicando corte:', err);
    }
  };

  const pendientes = pagos.filter(p => p.estado !== 'pagado');
  const totalPendiente = pendientes.reduce((acc, curr) => acc + Number(curr.total), 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* Header Flex: Responsive para acomodar el botón */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <header>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 tracking-tight">
            Control de Pagos
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Corte general los días 13. Recargo automático de $150.
          </p>
        </header>

        <button
          onClick={handleSimularCorte}
          className="flex justify-center items-center gap-2 bg-red-600 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-red-700 transition-colors shadow-sm w-full md:w-auto"
        >
          <RefreshCw size={18} /> Simular Corte Día 13
        </button>
      </div>

      {/* Tarjeta de Resumen */}
      <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100 max-w-sm">
        <div className="flex items-center gap-3 text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">
          <DollarSign size={20} className="text-red-600" /> Cartera por Cobrar
        </div>
        <div className="text-4xl font-bold text-gray-900">${totalPendiente.toLocaleString()} <span className="text-xl text-gray-400">MXN</span></div>
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          {loading ? (
            <p className="p-8 text-center text-gray-500">Cargando registros...</p>
          ) : pagos.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No hay registros de pago.</p>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Alumna</th>
                  <th className="px-6 py-4 font-medium">Mes</th>
                  <th className="px-6 py-4 font-medium">Base</th>
                  <th className="px-6 py-4 font-medium">Recargo</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagos.map((p) => {
                  const esMora = p.estado === 'vencido_con_recargo';
                  const esPagado = p.estado === 'pagado';

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{p.alumna}</td>
                      <td className="px-6 py-4 text-gray-600 capitalize">
                        {new Date(p.mes_correspondiente).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-gray-600">${p.monto_base}</td>
                      <td className={`px-6 py-4 ${Number(p.recargo) > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                        +${p.recargo}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">${p.total}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          esPagado ? 'bg-green-100 text-green-700' : esMora ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {esPagado ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                          {p.estado.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {!esPagado ? (
                          <button
                            onClick={() => handlePagar(p.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition-colors"
                          >
                            Marcar Pagado
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {new Date(p.fecha_pago).toLocaleDateString('es-MX')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}