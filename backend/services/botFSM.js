const { enviarMensaje } = require('./whatsapp');
const pool = require('../config/db');

const procesarFlujoBot = async (prospecto, textoUsuario) => {
  const texto = textoUsuario.trim().toLowerCase();
  const id = prospecto.id;
  const telefono = prospecto.telefono;
  const nombre = prospecto.nombre !== 'Prospecto WhatsApp' ? prospecto.nombre : null;

  // 1. Amnesia Útil: Si pasaron más de 14 días desde su último mensaje, reiniciamos el embudo
  const fechaUltimo = new Date(prospecto.fecha_ultimo_mensaje);
  const diasInactivo = (new Date() - fechaUltimo) / (1000 * 60 * 60 * 24);
  let faseActual = prospecto.fase_bot;
  
  if (diasInactivo > 14 && faseActual !== 'inicio' && faseActual !== 'atencion_humana') {
    faseActual = 'inicio';
  }

  // 2. Botón de Pánico: Detección de necesidad humana en CUALQUIER fase
  const palabrasEscape = ['duda', 'pregunta', 'asesor', 'humano', 'persona', 'info', 'ayuda'];
  const requiereHumano = palabrasEscape.some(palabra => texto.includes(palabra));

  if (requiereHumano && faseActual !== 'atencion_humana') {
    await pool.query("UPDATE prospectos SET fase_bot = 'atencion_humana', fecha_ultimo_mensaje = CURRENT_TIMESTAMP WHERE id = $1", [id]);
    await enviarMensaje(telefono, `Entiendo. Para resolver tus dudas a detalle, te transferiré con un coordinador de la academia. 🩰\n\nEn breve leerán tu mensaje y te responderán personalmente por este medio.`);
    return; // Cortamos la ejecución del bot aquí
  }

  let respuesta = '';
  let nuevaFase = faseActual;
  let nuevoEstado = prospecto.estado;
  let disciplina = prospecto.disciplina_interes;

  switch (faseActual) {
    case 'inicio':
      if (!nombre) {
        respuesta = `¡Hola! Bienvenida a Argos Academy. 🩰 Para darte una atención personalizada, ¿cuál es tu nombre y para quién buscas informes (para ti o para una pequeña)?`;
        nuevaFase = 'esperando_nombre';
      } else {
        respuesta = `¡Hola, ${nombre}! Bienvenida a Argos Academy. 🩰\n\n¿Qué disciplina te gustaría consultar?\n1. Pre-Ballet (3 a 6 años)\n2. Ballet Infantil / Formación\n3. Ballet Adultos\n4. Acondicionamiento y Flexibilidad\n\nRespóndeme con el número de tu interés.`;
        nuevaFase = 'esperando_disciplina';
      }
      break;

    case 'esperando_nombre':
      const nombreLimpio = textoUsuario.trim();
      await pool.query('UPDATE prospectos SET nombre = $1 WHERE id = $2', [nombreLimpio, id]);
      
      respuesta = `¡Un gusto, ${nombreLimpio}! ✨\n\n¿Qué nivel o disciplina te gustaría consultar?\n1. Pre-Ballet (3 a 6 años)\n2. Ballet Infantil / Formación\n3. Ballet Adultos\n4. Acondicionamiento y Flexibilidad\n\nRespóndeme con el número de tu interés.`;
      nuevaFase = 'esperando_disciplina';
      break;

    case 'esperando_disciplina':
      if (texto.includes('1') || texto.includes('pre')) {
        disciplina = 'Pre-Ballet';
        respuesta = `Excelente. En *Pre-Ballet* trabajamos coordinación, musicalidad y postura mediante el juego.\n\nHorarios: Lunes y Miércoles 4:00 PM - 5:00 PM.\nMensualidad: $950 MXN (Inscripción: $750).\n\n🎁 *Promoción:* Si agendas tu clase muestra esta semana, te queda en *$50 MXN* (en lugar de $150), y si te inscribes ese día, se bonifican a tu inscripción.\n\n¿Te gustaría apartar lugar para este Lunes o Miércoles?`;
        nuevaFase = 'esperando_agenda';
      } else if (texto.includes('2') || texto.includes('infantil')) {
        disciplina = 'Ballet Infantil';
        respuesta = `En *Ballet Infantil* desarrollamos técnica clásica y disciplina.\n\nHorarios: Martes y Jueves 4:30 PM - 6:00 PM.\nMensualidad: $1,200 MXN (Inscripción: $750).\n\n🎁 *Promoción:* Clase muestra a solo *$50 MXN* apartando para esta semana.\n\n¿Qué día prefieres asistir: Martes o Jueves?`;
        nuevaFase = 'esperando_agenda';
      } else if (texto.includes('3') || texto.includes('adulto')) {
        disciplina = 'Ballet Adultos';
        respuesta = `¡Nunca es tarde! En *Ballet Adultos* vemos colocación, fuerza y técnica desde cero.\n\nHorarios: Lunes, Miércoles y Viernes 7:00 PM - 8:30 PM.\nMensualidad: $1,200 MXN.\n\n🎁 *Promoción:* Clase muestra en *$50 MXN* apartando lugar esta semana.\n\n¿Te reservamos cupo para este Lunes o Miércoles?`;
        nuevaFase = 'esperando_agenda';
      } else if (texto.includes('4') || texto.includes('flex')) {
        disciplina = 'Acondicionamiento y Flexibilidad';
        respuesta = `Perfecto para mejorar fuerza articular y líneas.\n\nHorarios: Sábados 10:00 AM - 12:00 PM.\nMensualidad: $800 MXN.\n\nCupo limitado. ¿Te gustaría apartar tu lugar para este sábado?`;
        nuevaFase = 'esperando_agenda';
      } else {
        respuesta = `Por favor elige una opción marcando el número del 1 al 4, o escribe "duda" si necesitas ayuda de un coordinador.`;
      }
      break;

    case 'esperando_agenda':
      // Validación inteligente de respuesta positiva
      const palabrasPositivas = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'sí', 'si', 'claro', 'hoy', 'mañana', 'perfecto', 'ok'];
      const palabrasNegativas = ['no', 'después', 'despues', 'luego', 'gracias', 'checo', 'reviso'];
      
      const esPositivo = palabrasPositivas.some(p => texto.includes(p));
      const esNegativo = palabrasNegativas.some(p => texto.includes(p));

      if (esNegativo) {
        respuesta = `¡No te preocupes! Si decides animarte más adelante, aquí estaremos para recibirte. Si tienes alguna otra duda, avísanos. ✨`;
        nuevaFase = 'pausa_bot';
      } else if (esPositivo) {
        respuesta = `¡Listo! He registrado tu interés para tu clase muestra. 🎉\n\nUno de nuestros coordinadores confirmará tu acceso en recepción para aplicarte la promoción al llegar.\n\nUbicación: [Inserta tu Dirección Aquí].\n\nSi tienes dudas con la vestimenta, escribe "duda" y te atenderemos personalmente. ¡Nos vemos en clase!`;
        nuevaFase = 'agendado_confirmado';
        nuevoEstado = 'agendado'; // Mueve la tarjeta Kanban
      } else {
        respuesta = `Para apartar tu lugar, ¿qué día te queda mejor asistir? (o escribe "no por ahora" si deseas pensarlo).`;
      }
      break;

    case 'atencion_humana':
    case 'pausa_bot':
    case 'agendado_confirmado':
    default:
      // El bot guarda silencio para dejar que el humano hable, 
      // a menos que pasen los 14 días y el embudo se reinicie automáticamente arriba.
      break;
  }

  // Actualizar base de datos
  await pool.query(
    `UPDATE prospectos 
     SET fase_bot = $1, estado = $2, disciplina_interes = $3, fecha_ultimo_mensaje = CURRENT_TIMESTAMP 
     WHERE id = $4`,
    [nuevaFase, nuevoEstado, disciplina, id]
  );

  // Enviar mensaje por WhatsApp
  if (respuesta) {
    await enviarMensaje(telefono, respuesta);
  }
};

module.exports = { procesarFlujoBot };