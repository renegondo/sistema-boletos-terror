import QRCode from 'qrcode';

export interface RenderTicketOptions {
  ticketCode: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  tierName: string;
  price: number;
  attendeeName: string;
  orderId: string;
}

export async function renderTicketToCanvas(
  options: RenderTicketOptions
): Promise<string> {
  const width = 640;
  const height = 980;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0c101d');
  bgGrad.addColorStop(0.5, '#13192c');
  bgGrad.addColorStop(1, '#090d18');
  ctx.fillStyle = bgGrad;
  ctx.roundRect(15, 15, width - 30, height - 30, 28);
  ctx.fill();

  // Outer border
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#252f4a';
  ctx.stroke();

  // Top Neon Accent Bar
  const topGrad = ctx.createLinearGradient(15, 15, width - 15, 15);
  topGrad.addColorStop(0, '#6366f1');
  topGrad.addColorStop(0.5, '#8b5cf6');
  topGrad.addColorStop(1, '#d946ef');
  ctx.fillStyle = topGrad;
  ctx.roundRect(15, 15, width - 30, 10, [28, 28, 0, 0]);
  ctx.fill();

  // Header tag
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = '#818cf8';
  ctx.fillText('ACCESO DIGITAL OFICIAL', 45, 68);

  // Event Title
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  wrapText(ctx, options.eventTitle, 45, 108, width - 90, 32);

  // Badge Zona/Tier
  const badgeY = 160;
  ctx.fillStyle = '#10b981';
  ctx.roundRect(45, badgeY, 150, 32, 16);
  ctx.fill();

  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(options.tierName.toUpperCase(), 120, badgeY + 21);
  ctx.textAlign = 'left';

  // Price tag
  ctx.font = '800 24px system-ui, sans-serif';
  ctx.fillStyle = '#34d399';
  ctx.textAlign = 'right';
  ctx.fillText(`$${options.price.toFixed(2)} MXN`, width - 45, badgeY + 24);
  ctx.textAlign = 'left';

  // Divider
  ctx.strokeStyle = '#252f4a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(45, 215);
  ctx.lineTo(width - 45, 215);
  ctx.stroke();

  // Metadata Grid
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('FECHA', 45, 248);
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(options.eventDate, 45, 274);

  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('HORA', 250, 248);
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(options.eventTime, 250, 274);

  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';
  ctx.fillText('FOLIO', width - 45, 248);
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#a5b4fc';
  ctx.fillText(options.ticketCode, width - 45, 274);
  ctx.textAlign = 'left';

  // Venue
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('UBICACIÓN', 45, 320);
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  wrapText(ctx, options.location, 45, 344, width - 90, 22);

  // Attendee
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('TITULAR DEL BOLETO', 45, 410);
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(options.attendeeName, 45, 438);

  // Perforations
  const perfY = 485;
  ctx.beginPath();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.moveTo(40, perfY);
  ctx.lineTo(width - 40, perfY);
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // Cutout circles on edges
  ctx.fillStyle = '#0b0f19';
  ctx.beginPath();
  ctx.arc(15, perfY, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(width - 15, perfY, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // QR Code Subtitle
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText('ESCANEA ESTE CÓDIGO EN EL ACCESO', width / 2, 535);

  // Draw QR
  const qrDataUrl = await QRCode.toDataURL(options.ticketCode, {
    width: 250,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });

  const qrImg = await loadImage(qrDataUrl);
  const qrBoxSize = 250;
  const qrX = (width - qrBoxSize) / 2;
  const qrY = 560;

  // QR White Card Container
  ctx.fillStyle = '#ffffff';
  ctx.roundRect(qrX - 10, qrY - 10, qrBoxSize + 20, qrBoxSize + 20, 16);
  ctx.fill();
  ctx.drawImage(qrImg, qrX, qrY, qrBoxSize, qrBoxSize);

  // Folio text under QR
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(options.ticketCode, width / 2, 868);

  // Security footer
  ctx.fillStyle = '#1e293b';
  ctx.roundRect(45, 895, width - 90, 40, 10);
  ctx.fill();

  ctx.font = '500 12px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Válido para un solo ingreso • Orden #${options.orderId}`, width / 2, 920);

  return canvas.toDataURL('image/png', 0.95);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}
