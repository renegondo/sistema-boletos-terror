export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  autoSend: boolean;
}

export function getEvolutionConfig(): EvolutionConfig {
  const apiUrl = process.env.EVOLUTION_API_URL || 'https://api.bebot.click';
  const apiKey = process.env.EVOLUTION_API_KEY || 'NKofAZi4Gov+lJkzchqWmDn9ZNyuKaQRogOFVOvCwhGfXARtIG9e9pv9WZsbjoRqo/NEo777aEfEWp2CJvW3Rw==';
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'ayuntamiento';
  const autoSend = process.env.WHATSAPP_AUTO_SEND !== '0';

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''),
    apiKey: apiKey,
    instanceName: instanceName,
    autoSend: autoSend,
  };
}

export function cleanPhoneNumber(phone: string): string {
  // Remove spaces, dashes, plus signs, brackets
  let clean = phone.replace(/[^\d]/g, '');
  // If 10 digits (Mexican local mobile without country code), prepend 52
  if (clean.length === 10) {
    clean = `52${clean}`;
  }
  return clean;
}

export async function testEvolutionConnection(): Promise<{ success: boolean; state?: string; message: string }> {
  const config = getEvolutionConfig();

  if (!config.apiUrl || !config.apiKey || !config.instanceName) {
    return {
      success: false,
      message: 'Faltan parámetros de configuración (URL, API Key o Nombre de Instancia).',
    };
  }

  try {
    const url = `${config.apiUrl}/instance/connectionState/${encodeURIComponent(config.instanceName)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        message: `Error HTTP ${res.status}: ${errText || res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      state: data.instance?.state || data.state || 'connected',
      message: `Conexión exitosa con la instancia "${config.instanceName}". Estado: ${data.instance?.state || data.state || 'open'}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `No se pudo conectar a Evolution API: ${error?.message || 'Error de red'}`,
    };
  }
}

export async function sendTicketViaWhatsApp(params: {
  phone: string;
  ticketCode: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  tierName: string;
  price: number;
  imageBase64OrUrl: string;
  isPending?: boolean;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const config = getEvolutionConfig();

  if (!config.apiUrl || !config.apiKey || !config.instanceName) {
    return {
      success: false,
      error: 'Evolution API no está configurada aún en el sistema.',
    };
  }

  const cleanPhone = cleanPhoneNumber(params.phone);
  if (!cleanPhone || cleanPhone.length < 10) {
    return {
      success: false,
      error: `Número telefónico inválido: "${params.phone}".`,
    };
  }

  // Evolution API requires raw base64 or public URL, reject data:image/png;base64,
  let mediaPayload = params.imageBase64OrUrl;
  if (mediaPayload && mediaPayload.startsWith('data:')) {
    mediaPayload = mediaPayload.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
  }

  const caption = 
`🎟️ *¡TU BOLETO DIGITAL HORROR FEST!* 🎟️

¡Hola *${params.attendeeName}*!
Aquí tienes tu entrada oficial para:
🔥 *${params.eventTitle}*

📅 *Fecha:* ${params.eventDate}
⏰ *Hora:* ${params.eventTime} hrs
📍 *Lugar:* ${params.location}
🏷️ *Zona / Acceso:* ${params.tierName}
💰 *Total:* $${params.price.toFixed(2)} MXN
🔢 *Folio Único:* ${params.ticketCode}

${params.isPending ? `⚠️ *ESTADO: PRE-REGISTRO CONFIRMADO (PAGO EN EFECTIVO)* ⚠️
Tu lugar y boletos están apartados en el sistema.

💵 *Modalidad de Pago:*
• El cobro es *ÚNICAMENTE EN EFECTIVO*.
• Presenta tu folio *${params.ticketCode}* directamente en la taquilla / puerta del *${params.location}* o con tu RP asignado.
• Liquida tu total de *$${params.price.toFixed(2)} MXN en efectivo* al ingresar para recibir tu pulsera oficial numerada.

¡Nos vemos en el evento más salvaje del año! 💀🏁` : `✅ *BOLETO ACTIVADO Y CONFIRMADO:*
• Presenta este código QR en el acceso del Salón del Sindicato del IMSS para tu pulsera.
• Cada boleto es infalsificable y de uso único en lector láser.

¡Prepárate para la noche más intensa del año! 💀🏁`}`;

  try {
    const endpoint = `${config.apiUrl}/message/sendMedia/${encodeURIComponent(config.instanceName)}`;

    const payload = {
      number: cleanPhone,
      media: mediaPayload,
      mediatype: 'image',
      mimetype: 'image/png',
      caption: caption,
      fileName: `boleto-${params.ticketCode}.png`,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return {
        success: false,
        error: `Evolution API devolvió error ${res.status}: ${errBody || res.statusText}`,
      };
    }

    return {
      success: true,
      message: `Boleto enviado con éxito a WhatsApp (+${cleanPhone})`,
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp ticket:', error);
    return {
      success: false,
      error: error?.message || 'Error desconocido al conectar con Evolution API',
    };
  }
}

export async function sendPreRegistrationWhatsApp(params: {
  phone: string;
  orderId: string;
  customerName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  tierName: string;
  quantity: number;
  totalAmount: number;
  paymentMethodText?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const config = getEvolutionConfig();

  if (!config.apiUrl || !config.apiKey || !config.instanceName) {
    return {
      success: false,
      error: 'Evolution API no está configurada aún en el sistema.',
    };
  }

  const cleanPhone = cleanPhoneNumber(params.phone);
  if (!cleanPhone || cleanPhone.length < 8) {
    return {
      success: false,
      error: `Número telefónico inválido: "${params.phone}".`,
    };
  }

  const messageText = 
`🎃 *¡PRE-REGISTRO CONFIRMADO! // RODADA DEL TERROR 2026* 🏍️💨

¡Hola *${params.customerName}*!
Hemos registrado exitosamente tu apartado de boletos para el evento oficial:
🔥 *${params.eventTitle}*

📋 *DETALLES DE TU APARTADO:*
• *Folio de Reserva:* #${params.orderId}
• *Acceso / Zona:* ${params.tierName}
• *Cantidad:* ${params.quantity} boleto(s)
• *Total a Liquidar:* $${params.totalAmount.toFixed(2)} MXN
• *Fecha:* ${params.eventDate} | ${params.eventTime} hrs
• *Sede:* ${params.location}
• *Modalidad:* 🍾 BYOB (Descorche Libre - Entra tus botellas)

💵 *MODALIDAD DE PAGO:*
• El cobro es *ÚNICAMENTE EN EFECTIVO*.
• Presenta tu folio de reserva *#${params.orderId}* directamente en la taquilla del *${params.location}* o con tu RP asignado.
• Liquida *$${params.totalAmount.toFixed(2)} MXN en efectivo* al ingresar y se te entregará tu pulsera oficial conmemorativa.

¡Nos vemos en la rodada más salvaje! 💀🏁`;

  try {
    const endpoint = `${config.apiUrl}/message/sendText/${encodeURIComponent(config.instanceName)}`;

    const payload = {
      number: cleanPhone,
      text: messageText,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return {
        success: false,
        error: `Evolution API devolvió error ${res.status}: ${errBody || res.statusText}`,
      };
    }

    return {
      success: true,
      message: `Mensaje de pre-registro enviado por WhatsApp a +${cleanPhone}`,
    };
  } catch (error: any) {
    console.error('Error sending pre-registration WhatsApp:', error);
    return {
      success: false,
      error: error?.message || 'Error al conectar con Evolution API',
    };
  }
}

