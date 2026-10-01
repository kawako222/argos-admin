require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
const pool = require('./config/db');

// Importar rutas y seguridad
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const alumnasRoutes = require('./routes/alumnas');
const prospectosRoutes = require('./routes/prospectos');
const webhookRoutes = require('./routes/webhook');
const ideasRoutes = require('./routes/ideas');
const { enviarMensaje } = require('./services/whatsapp');

const app = express();
const port = process.env.PORT || 3000;

// Configurar IP real detrás de Docker / Cloudflare Tunnel
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

// --- PROTECCIÓN CONTRA FUERZA BRUTA ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Límite de 5 intentos por IP
  message: { error: 'Demasiados intentos fallidos. Sistema bloqueado temporalmente por seguridad (15 minutos).' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- CRON JOBS ---
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

cron.schedule('0 9 * * 1', async () => {
  try {
    const result = await pool.query("SELECT contenido FROM banco_ideas WHERE tipo = 'marketing_semanal' ORDER BY RANDOM() LIMIT 1");
    if (result.rows.length > 0) {
      const idea = result.rows[0].contenido;
      const mensaje = `💡 *Idea Semanal de Contenido:*\n\n${idea}\n\n¡A grabar esta semana! 🎬`;
      await enviarMensaje(process.env.TELEFONO_DIRECTORA, mensaje);
      await enviarMensaje(process.env.TELEFONO_DIRECTOR, mensaje);
    }
  } catch (err) {
    console.error('Error en cron de marketing:', err);
  }
});

cron.schedule('0 10 15 * *', async () => {
  try {
    const result = await pool.query("SELECT contenido FROM banco_ideas WHERE tipo = 'evento_mes' ORDER BY RANDOM() LIMIT 1");
    if (result.rows.length > 0) {
      const idea = result.rows[0].contenido;
      const mensaje = `🎭 *Propuesta para el Evento del Mes:*\n\n${idea}\n\n¿Empezamos a planearlo? ✨`;
      await enviarMensaje(process.env.TELEFONO_DIRECTORA, mensaje);
      await enviarMensaje(process.env.TELEFONO_DIRECTOR, mensaje);
    }
  } catch (err) {
    console.error('Error en cron de eventos:', err);
  }
});

// CRON: Re-enganche de prospectos indecisos (Todos los días a las 11:00 AM)
cron.schedule('0 11 * * *', async () => {
  try {
    const indecisos = await pool.query(`
      SELECT * FROM prospectos 
      WHERE fase_bot = 'esperando_agenda' 
        AND fecha_ultimo_mensaje < NOW() - INTERVAL '20 hours'
        AND fecha_ultimo_mensaje > NOW() - INTERVAL '44 hours'
    `);

    for (const p of indecisos.rows) {
      const mensajeInsistencia = `¡Hola, ${p.nombre}! 🩰 Notamos que te interesó la clase de *${p.disciplina_interes || 'Ballet'}*. 

Solo nos quedan 2 lugares disponibles para las clases muestra con el descuento de *$50 MXN* esta semana. ¿Te gustaría asegurar tu lugar antes de que cerremos el grupo?`;

      await enviarMensaje(p.telefono, mensajeInsistencia);

      // Cambiamos su fase para no spamearla más de una vez
      await pool.query(`UPDATE prospectos SET fase_bot = 'recordatorio_enviado' WHERE id = $1`, [p.id]);
    }
  } catch (err) {
    console.error('Error en cron de seguimiento de prospectos:', err);
  }
});

// --- RUTAS API ---

// 1. Públicas
app.use('/api/auth', loginLimiter, authRoutes); // <-- RUTA DE LOGIN BLINDADA
app.use('/api/webhook', webhookRoutes);

// 2. Protegidas con Token JWT
app.use('/api/alumnas', authMiddleware, alumnasRoutes);
app.use('/api/prospectos', authMiddleware, prospectosRoutes);
app.use('/api/ideas', authMiddleware, ideasRoutes);

app.get('/api/paquetes', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM paquetes ORDER BY precio ASC');
  res.json(result.rows);
});

// Rutas de Pagos
app.get('/api/pagos', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT p.id, p.alumna_id, a.nombre_completo AS alumna, a.telefono_contacto,
             p.mes_correspondiente, p.monto_base, p.recargo, (p.monto_base + p.recargo) AS total,
             p.estado, p.fecha_pago
      FROM pagos p
      JOIN alumnas a ON p.alumna_id = a.id
      ORDER BY p.mes_correspondiente DESC, p.id DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/pagos/:id/pagar', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`UPDATE pagos SET estado = 'pagado', fecha_pago = CURRENT_DATE WHERE id = $1 RETURNING *`, [id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pagos/forzar-corte-recargo', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`UPDATE pagos SET recargo = 150.00, estado = 'vencido_con_recargo' WHERE estado = 'pendiente'`);
    res.json({ mensaje: `Recargos aplicados a ${result.rowCount} pagos.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Backend estructurado corriendo en puerto ${port}`);
});
