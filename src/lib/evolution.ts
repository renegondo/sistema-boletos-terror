import { getDb } from './db';

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  autoSend: boolean;
}

export function getEvolutionConfig(): EvolutionConfig {
  const db = getDb();
  const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');

  const urlRow = getSetting.get('evolution_api_url') as { value: string } | undefined;
  const keyRow = getSetting.get('evolution_api_key') as { value: string } | undefined;
  const instanceRow = getSetting.get('evolution_instance_name') as { value: string } | undefined;
  const autoSendRow = getSetting.get('whatsapp_auto_send') as { value: string } | undefined;

  const apiUrl = process.env.EVOLUTION_API_URL || (urlRow?.value && urlRow.value !== 'http://localhost:8080' ? urlRow.value : 'https://api.bebot.click');
  const apiKey = process.env.EVOLUTION_API_KEY || (keyRow?.value && keyRow.value !== 'TU_API_KEY_AQUI' ? keyRow.value : 'lJkzchqWmDn9ZNyuKaQRogOFVOvCwhGfXARtIG9e9pv9WZsbjoRqo');
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || (instanceRow?.value && instanceRow.value !== 'boletos_instance' ? instanceRow.value : 'ayuntamiento');

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''),
    apiKey: apiKey,
    instanceName: instanceName,
    autoSend: autoSendRow ? autoSendRow.value === '1' : true,
  };
}

export function cleanPhoneNumber(phone: string): string {
  // Remove spaces, dashes, plus signs, brackets
  let clean = phone.replace(/[^\d]/g, '');
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
  if (!cleanPhone || cleanPhone.length < 8) {
    return {
      success: false,
      error: `Número telefónico inválido: "${params.phone}".`,
    };
  }

  const caption = 
`🎟️ *¡TU BOLETO DIGITAL ESTÁ LISTO!* 🎟️

¡Hola *${params.attendeeName}*!
Aquí tienes tu entrada oficial para:
🔥 *${params.eventTitle}*

📅 *Fecha:* ${params.eventDate}
⏰ *Hora:* ${params.eventTime}
📍 *Lugar:* ${params.location}
🏷️ *Zona / Tipo:* ${params.tierName}
💰 *Precio:* $${params.price.toFixed(2)} MXN
🔢 *Folio:* ${params.ticketCode}

${params.isPending ? `⚠️ *ESTADO: PENDIENTE DE PAGO* ⚠️
Tu lugar está asegurado, pero tu código QR aún no está activado.
Entrégale el efectivo a tu RP o administrador para que liberen tu acceso. Una vez pagado, este mismo QR te dará entrada.` : `⚠️ *Instrucciones:*
• Presenta este código QR en el acceso del evento para su validación.
• Cada boleto es único y solo puede escanearse una vez.

¡Disfruta el evento! 🎉`}`;

  try {
    const endpoint = `${config.apiUrl}/message/sendMedia/${encodeURIComponent(config.instanceName)}`;

    const payload = {
      number: cleanPhone,
      media: params.imageBase64OrUrl,
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

⚠️ *PASO SIGUIENTE PARA RECIBIR TU CÓDIGO QR OFICIAL:*
Tus lugares están reservados temporalmente. Para asegurar tus pulseras numeradas y recibir tu **Código QR Digital de Acceso**, realiza tu liquidación por transferencia o en taquilla:

💳 *Datos Bancarios Oficiales:*
• Banco: *BBVA / STP*
• CLABE: *012180015582910384*
• Beneficiario: *Flow Productions*
• Concepto / Referencia: *${params.orderId}*

📲 *Envío de Comprobante:*
Responde a este mensaje con tu captura de pantalla de transferencia citando tu folio *#${params.orderId}*.

⚡ En cuanto el staff valide tu pago en el sistema, recibirás automáticamente aquí en WhatsApp tu **Código QR Oficial Infalsificable** para ingresar al Salón del Sindicato del IMSS.

¡Nos vemos en la rodada! 💀🏁`;

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

