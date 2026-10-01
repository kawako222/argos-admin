const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Obtener todas las alumnas
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT a.id, a.nombre_completo, a.telefono_contacto, a.estatus, a.porcentaje_beca, p.id as paquete_id, p.nombre AS paquete, p.precio
      FROM alumnas a
      LEFT JOIN paquetes p ON a.paquete_id = p.id
      ORDER BY a.fecha_registro DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear alumna (con cálculo de beca para el pago inicial)
router.post('/', async (req, res) => {
  const { nombre_completo, telefono_contacto, paquete_id, porcentaje_beca = 0 } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Insertar alumna
    const alumnaRes = await client.query(
      'INSERT INTO alumnas (nombre_completo, telefono_contacto, paquete_id, porcentaje_beca) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre_completo, telefono_contacto, paquete_id, porcentaje_beca]
    );
    const nuevaAlumna = alumnaRes.rows[0];

    // 2. Obtener precio y calcular descuento
    const paqueteRes = await client.query('SELECT precio FROM paquetes WHERE id = $1', [paquete_id]);
    const precioBase = paqueteRes.rows[0]?.precio || 0;
    const precioFinal = precioBase - (precioBase * (porcentaje_beca / 100));

    // 3. Generar primer pago
    await client.query(
      `INSERT INTO pagos (alumna_id, mes_correspondiente, monto_base, estado)
       VALUES ($1, DATE_TRUNC('month', CURRENT_DATE)::DATE, $2, 'pendiente')`,
      [nuevaAlumna.id, precioFinal]
    );

    await client.query('COMMIT');
    res.status(201).json(nuevaAlumna);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Actualizar alumna
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, paquete_id, porcentaje_beca } = req.body;
  try {
    const result = await pool.query(
      'UPDATE alumnas SET nombre_completo = $1, paquete_id = $2, porcentaje_beca = $3 WHERE id = $4 RETURNING *',
      [nombre_completo, paquete_id, porcentaje_beca, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar alumna
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM alumnas WHERE id = $1', [id]);
    res.json({ mensaje: 'Alumna eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
