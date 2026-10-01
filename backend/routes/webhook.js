const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { procesarFlujoBot } = require('../services/botFSM');

const processedMessages = new Set();

// Verificación de Meta
router.get('/', (req, res) => {
  const verify_token = process.env.WEBHOOK_VERIFY_TOKEN || 'argos_secreto_2026';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verify_token) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Recepción y procesamiento continuo
router.post('/', async (req, res) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];
      const contact = changes?.value?.contacts?.[0];

      if (message && contact && message.type === 'text') {
        if (processedMessages.has(message.id)) {
          return res.sendStatus(200);
        }
        processedMessages.add(message.id);
        if (processedMessages.size > 500) {
          const firstItem = processedMessages.keys().next().value;
          processedMessages.delete(firstItem);
        }

        const telefonoFull = contact.wa_id;
        const telefonoLimpio = telefonoFull.replace(/^521?/, '');
        const nombreMeta = contact.profile?.name || 'Prospecto WhatsApp';
        const textoUsuario = message.text.body;

        // Validamos si ya es alumna oficial activa (si es así, no le mandamos embudo de venta)
        const alumnaCheck = await pool.query(
          `SELECT id FROM alumnas WHERE telefono_contacto LIKE $1 AND estatus = 'activa'`,
          [`%${telefonoLimpio}%`]
        );

        if (alumnaCheck.rows.length === 0) {
          // Buscamos o creamos el prospecto
          let prospectoRes = await pool.query(
            `SELECT * FROM prospectos WHERE telefono LIKE $1`,
            [`%${telefonoLimpio}%`]
          );

          let prospecto;
          if (prospectoRes.rows.length === 0) {
            const insertRes = await pool.query(
              `INSERT INTO prospectos (nombre, telefono, notas, fase_bot, estado) 
               VALUES ($1, $2, $3, 'inicio', 'nuevo') RETURNING *`,
              [nombreMeta, telefonoLimpio, `Primer contacto: "${textoUsuario}"`]
            );
            prospecto = insertRes.rows[0];
          } else {
            prospecto = prospectoRes.rows[0];
          }

          // Ejecutar máquina de estados del bot
          await procesarFlujoBot(prospecto, textoUsuario);
        }
      }
    } catch (error) {
      console.error('Error en webhook de WhatsApp:', error);
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

module.exports = router;
