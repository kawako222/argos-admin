require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const pool = require('./config/db');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

// Importar rutas
const alumnasRoutes = require('./routes/alumnas');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- CRON JOBS ---
// Generar pagos considerando la beca
cron.schedule('0 1 1 * *', async () => {
  try {
    await pool.query(`
      INSERT INTO pagos (alumna_id, mes_correspondiente, monto_base, estado)
      SELECT a.id, DATE_TRUNC('month', CURRENT_DATE)::DATE, 
             p.precio - (p.precio * (COALESCE(a.porcentaje_beca, 0) / 100.0)), 
             'pendiente'
      FROM alumnas a
      JOIN paquetes p ON a.paquete_id = p.id
      WHERE a.estatus = 'activa'
        AND NOT EXISTS (
          SELECT 1 FROM pagos pg 
          WHERE pg.alumna_id = a.id 
            AND pg.mes_correspondiente = DATE_TRUNC('month', CURRENT_DATE)::DATE
        );
    `);
  } catch (err) {
    console.error('Error generando pagos:', err);
  }
});

cron.schedule('1 0 14 * *', async () => {
  try {
    await pool.query(`UPDATE pagos SET recargo = 150.00, estado = 'vencido_con_recargo' WHERE estado = 'pendiente' AND mes_correspondiente = DATE_TRUNC('month', CURRENT_DATE)::DATE;`);
  } catch (err) {
    console.error('Error en recargos:', err);
  }
});

// 1. Rutas públicas (No requieren token)
app.use('/api/auth', authRoutes);

// --- RUTAS API ---
app.use('/api/alumnas', alumnasRoutes);


// Catálogos simples
app.get('/api/paquetes', async (req, res) => {
  const result = await pool.query('SELECT * FROM paquetes ORDER BY precio ASC');
  res.json(result.rows);
});

// Arrancar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Backend estructurado corriendo en puerto ${port}`);
});
