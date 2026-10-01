const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');


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
