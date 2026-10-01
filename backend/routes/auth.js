const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// RUTA TEMPORAL: Crear el primer administrador (Ejecutar solo una vez)
router.post('/setup', async (req, res) => {
  try {
    const check = await pool.query('SELECT * FROM administradores');
    if (check.rows.length > 0) return res.status(400).json({ error: 'El admin ya existe.' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('argos2026', salt); // Contraseña por defecto

    await pool.query(
      'INSERT INTO administradores (nombre, email, password_hash) VALUES ($1, $2, $3)',
      ['Directora Argos', 'admin@argos.com', hash]
    );
    res.json({ mensaje: 'Administrador creado. Correo: admin@argos.com / Pass: argos2026' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login real
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM administradores WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = result.rows[0];
    const passwordValido = await bcrypt.compare(password, user.password_hash);
    if (!passwordValido) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Generar llave maestra de 8 horas
    const token = jwt.sign(
      { id: user.id, rol: user.rol }, 
      process.env.JWT_SECRET || 'argos_secreto_prod_2026', 
      { expiresIn: '8h' }
    );
    
    res.json({ token, user: { nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
