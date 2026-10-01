const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { registrarAlumnaOficial } = require('../services/alumnasService');

// Obtener prospectos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM prospectos ORDER BY fecha_contacto DESC, id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear prospecto
router.post('/', async (req, res) => {
  const { nombre, telefono, notas } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO prospectos (nombre, telefono, notas) VALUES ($1, $2, $3) RETURNING *",
      [nombre, telefono, notas || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar etapa
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, estado, notas } = req.body;
  try {
    const result = await pool.query(
      "UPDATE prospectos SET nombre = $1, telefono = $2, estado = $3, notas = $4 WHERE id = $5 RETURNING *",
      [nombre, telefono, estado, notas || '', id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EL NUEVO MOTOR: Convertir Prospecto en Alumna Oficial (Usando servicio centralizado)
router.post('/:id/convertir', async (req, res) => {
  const { id } = req.params;
  const { paquete_id, porcentaje_beca = 0 } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Validar prospecto
    const prospectoRes = await client.query('SELECT * FROM prospectos WHERE id = $1', [id]);
    if (prospectoRes.rows.length === 0) throw new Error('Prospecto no encontrado');
    const prospecto = prospectoRes.rows[0];
    if (prospecto.convertido) throw new Error('Este prospecto ya es una alumna oficial');

    // 2. Usar el motor central para registrar a la alumna y generar sus pagos (mensualidad + inscripción)
    const datosParaRegistro = {
      nombre_completo: prospecto.nombre,
      telefono_contacto: prospecto.telefono,
      paquete_id,
      porcentaje_beca
    };
    
    const nuevaAlumna = await registrarAlumnaOficial(client, datosParaRegistro);

    // 3. Marcar al prospecto como convertido en el pipeline
    await client.query("UPDATE prospectos SET convertido = true, estado = 'inscrito' WHERE id = $1", [id]);

    await client.query('COMMIT');
    res.status(200).json({ mensaje: 'Alumna dada de alta exitosamente', alumna: nuevaAlumna });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Eliminar
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM prospectos WHERE id = $1", [id]);
    res.json({ mensaje: "Eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
