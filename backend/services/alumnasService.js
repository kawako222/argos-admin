const pool = require('../config/db');

/**
 * Registra una alumna nueva, valida datos y genera sus pagos iniciales (Inscripción + Mensualidad)
 */
const registrarAlumnaOficial = async (client, datosAlumna) => {
  const { nombre_completo, telefono_contacto, paquete_id, porcentaje_beca = 0 } = datosAlumna;

  // 1. Validar Beca
  const becaNum = Number(porcentaje_beca);
  if (isNaN(becaNum) || becaNum < 0 || becaNum > 100) {
    throw new Error('El porcentaje de beca debe ser un número entre 0 y 100.');
  }

  // 2. Validar Teléfono Duplicado (Solo alumnas activas)
  const telefonoLimpio = telefono_contacto.replace(/\D/g, '');
  const checkDuplicado = await client.query(
    `SELECT id, nombre_completo FROM alumnas WHERE telefono_contacto LIKE $1 AND estatus = 'activa'`,
    [`%${telefonoLimpio}%`]
  );
  
  if (checkDuplicado.rows.length > 0) {
    throw new Error(`El teléfono ya está registrado en la alumna activa: ${checkDuplicado.rows[0].nombre_completo}`);
  }

  // 3. Crear Alumna
  const alumnaRes = await client.query(
    `INSERT INTO alumnas (nombre_completo, telefono_contacto, paquete_id, porcentaje_beca) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [nombre_completo, telefonoLimpio, paquete_id, becaNum]
  );
  const nuevaAlumna = alumnaRes.rows[0];

  // 4. Calcular Mensualidad con Beca Validada
  const paqueteRes = await client.query('SELECT precio FROM paquetes WHERE id = $1', [paquete_id]);
  const precioBase = paqueteRes.rows[0]?.precio || 0;
  const precioMensualidad = precioBase - (precioBase * (becaNum / 100));

  // 5. Generar Cargos Iniciales
  // A) Cargo de Mensualidad
  await client.query(
    `INSERT INTO pagos (alumna_id, mes_correspondiente, monto_base, estado, notas)
     VALUES ($1, DATE_TRUNC('month', CURRENT_DATE)::DATE, $2, 'pendiente', 'Mensualidad inicial')`,
    [nuevaAlumna.id, precioMensualidad]
  );

  // B) Cargo de Inscripción (Monto fijo $750)
  await client.query(
    `INSERT INTO pagos (alumna_id, mes_correspondiente, monto_base, estado, notas)
     VALUES ($1, DATE_TRUNC('month', CURRENT_DATE)::DATE, $2, 'pendiente', 'Pago de Inscripción Anual')`,
    [nuevaAlumna.id, 750] // Aquí configuras el precio de tu inscripción
  );

  return nuevaAlumna;
};

module.exports = { registrarAlumnaOficial };
