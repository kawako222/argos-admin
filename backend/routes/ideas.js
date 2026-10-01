const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Obtener todas las ideas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM banco_ideas ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agregar una nueva idea
router.post('/', async (req, res) => {
  const { tipo, contenido } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO banco_ideas (tipo, contenido) VALUES ($1, $2) RETURNING *",
      [tipo, contenido]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una idea
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM banco_ideas WHERE id = $1", [id]);
    res.json({ mensaje: "Idea eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
