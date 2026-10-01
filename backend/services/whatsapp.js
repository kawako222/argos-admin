const enviarMensaje = async (telefono, texto) => {
  try {
    const token = process.env.META_TOKEN;
    const phoneId = process.env.META_PHONE_ID;
    
    if (!token || !phoneId) {
      console.warn('⚠️️ Credenciales de Meta no configuradas. Simulando envío...');
      console.log(`[WhatsApp a ${telefono}]:\n${texto}\n`);
      return;
    }

    // 1. Dejar solo los números (elimina +, guiones, espacios)
    let numeroStr = String(telefono).replace(/\D/g, '');
    
    // 2. Si el número empieza con 52 o 521 (prefijo Meta/México), se lo quitamos
    numeroStr = numeroStr.replace(/^521?/, '');
    
    // 3. Ahora sí, construimos el destinatario con el 52 limpio asegurando que no se duplique
    const destinatario = `52${numeroStr}`;

    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: destinatario, 
        type: 'text',
        text: { body: texto }
      })
    });

    const data = await response.json();
    if (data.error) console.error(`Error de Meta al enviar a ${destinatario}:`, data.error);
    return data;
  } catch (error) {
    console.error('Error fatal enviando WhatsApp:', error);
  }
};

module.exports = { enviarMensaje };
