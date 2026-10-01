const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { registrarAlumnaOficial } = require('../services/alumnasService');

// Obtener todas las alumnas
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT a.id, a.nombre_completo, a.telefono_contacto, a.estatus, a.porcentaje_beca, 
             a.motivo_baja, a.fecha_baja, p.id as paquete_id, p.nombre AS paquete, p.precio,
             (SELECT COUNT(*) FROM pagos pg WHERE pg.alumna_id = a.id AND pg.estado IN ('pendiente', 'vencido_con_recargo')) as adeudos_pendientes
      FROM alumnas a
      LEFT JOIN paquetes p ON a.paquete_id = p.id
      ORDER BY a.estatus ASC, a.fecha_registro DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear alumna (Usando el servicio centralizado)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Pasamos el cliente y el body al motor central
    const nuevaAlumna = await registrarAlumnaOficial(client, req.body);
    
    await client.query('COMMIT');
    res.status(201).json(nuevaAlumna);
  } catch (err) {
    await client.query('ROLLBACK');
    // Enviamos el mensaje de error limpio al frontend (ej: "Teléfono duplicado")
    res.status(400).json({ error: err.message }); 
  } finally {
    client.release();
  }
});

// Actualizar alumna
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, paquete_id, porcentaje_beca } = req.body;
  try {
    const becaNum = Number(porcentaje_beca);
    if (isNaN(becaNum) || becaNum < 0 || becaNum > 100) {
      return res.status(400).json({ error: 'Beca inválida.' });
    }

    const result = await pool.query(
      'UPDATE alumnas SET nombre_completo = $1, paquete_id = $2, porcentaje_beca = $3 WHERE id = $4 RETURNING *',
      [nombre_completo, paquete_id, becaNum, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Baja
router.post('/:id/baja', async (req, res) => {
  const { id } = req.params;
  const { motivo_baja } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE alumnas SET estatus = 'inactiva', motivo_baja = $1, fecha_baja = CURRENT_DATE WHERE id = $2 RETURNING *`,
      [motivo_baja, id]
    );
    await client.query(
      `UPDATE pagos SET estado = 'cancelado' WHERE alumna_id = $1 AND estado IN ('pendiente', 'vencido_con_recargo')`,
      [id]
    );
    await client.query('COMMIT');
    res.json({ mensaje: 'Alumna dada de baja', alumna: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Reactivar
router.post('/:id/reactivar', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE alumnas SET estatus = 'activa', motivo_baja = NULL, fecha_baja = NULL WHERE id = $1 RETURNING *`,
      [id]
    );
    res.json({ mensaje: 'Alumna reactivada', alumna: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
