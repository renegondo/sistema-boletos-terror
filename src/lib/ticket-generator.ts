import QRCode from 'qrcode';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export interface TicketDesignData {
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

export async function generateQrVectorSvg(text: string): Promise<{ innerSvg: string, viewBox: string }> {
  const rawSvg = await QRCode.toString(text, {
    type: 'svg',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });

  const viewBoxMatch = rawSvg.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 30 30";
  const innerSvg = rawSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

  return { innerSvg, viewBox };
}

export async function generateTicketSvg(data: TicketDesignData): Promise<string> {
  const qrData = await generateQrVectorSvg(data.ticketCode);

  const escapedTitle = escapeXml(data.eventTitle);
  const escapedLocation = escapeXml(data.location);
  const escapedAttendee = escapeXml(data.attendeeName);
  const escapedTier = escapeXml(data.tierName.toUpperCase());

  // Load images
  let bannerBase64 = '';
  let logoBase64 = '';
  try {
    const bannerPath = path.join(process.cwd(), 'public/images/banner-rojo.png');
    const bannerBuf = await sharp(bannerPath).resize({ width: 640 }).toBuffer();
    bannerBase64 = `data:image/png;base64,${bannerBuf.toString('base64')}`;
  } catch(e) {}
  
  try {
    const logoPath = path.join(process.cwd(), 'public/images/logo-fondo.png');
    const logoBuf = await sharp(logoPath).resize({ width: 340 }).toBuffer();
    logoBase64 = `data:image/png;base64,${logoBuf.toString('base64')}`;
  } catch(e) {}

  return `
<svg width="640" height="1000" viewBox="0 0 640 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f0e15" stop-opacity="0" />
      <stop offset="70%" stop-color="#0f0e15" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0f0e15" stop-opacity="1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <clipPath id="cardClip">
      <rect x="0" y="0" width="640" height="1000" rx="40" />
    </clipPath>
  </defs>

  <style>
    .font-sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .font-mono { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; }
    .label { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 800; fill: #ef4444; text-transform: uppercase; letter-spacing: 2px; }
    .val { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 20px; font-weight: 900; fill: #ffffff; }
    .code-txt { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 32px; font-weight: 900; fill: #ffffff; letter-spacing: 4px; }
  </style>

  <!-- Ticket Body Card -->
  <rect x="0" y="0" width="640" height="1000" rx="40" fill="#0f0e15" stroke="#7f1d1d" stroke-width="6" />

  <g clip-path="url(#cardClip)">
    <!-- Banner Image at top -->
    ${bannerBase64 ? `<image href="${bannerBase64}" x="0" y="0" width="640" height="350" preserveAspectRatio="xMidYMid slice" opacity="0.6" />` : ''}
    
    <!-- Gradient overlay to fade banner into black -->
    <rect x="0" y="0" width="640" height="380" fill="url(#fadeGrad)" />
    
    <!-- Logo -->
    ${logoBase64 ? `<image href="${logoBase64}" x="150" y="40" width="340" height="220" preserveAspectRatio="xMidYMid contain" />` : ''}
  </g>

  <!-- Title & Tier -->
  <rect x="170" y="270" width="300" height="40" rx="20" fill="#7f1d1d" />
  <text x="320" y="296" class="font-sans" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">ENTRADA OFICIAL PRE-REGISTRO</text>

  <!-- Attendee Section -->
  <rect x="40" y="340" width="560" height="110" rx="20" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
  <text x="70" y="375" class="label">TITULAR DEL BOLETO</text>
  <text x="70" y="415" class="font-sans" font-size="28" font-weight="900" fill="#ffffff">${escapedAttendee}</text>
  
  <text x="570" y="380" class="font-sans" font-size="28" font-weight="900" fill="#facc15" text-anchor="end">$${data.price.toFixed(2)}</text>
  <text x="570" y="410" class="font-mono" font-size="14" font-weight="700" fill="#a1a1aa" text-anchor="end">${escapedTier}</text>

  <!-- Info Grid -->
  <text x="50" y="490" class="label">FECHA</text>
  <text x="50" y="520" class="val">${escapeXml(data.eventDate)}</text>

  <text x="250" y="490" class="label">ACCESO</text>
  <text x="250" y="520" class="val">${escapeXml(data.eventTime)} HRS</text>

  <text x="590" y="490" class="label" text-anchor="end">FOLIO ORDEN</text>
  <text x="590" y="520" class="font-mono" font-size="18" font-weight="800" fill="#f87171" text-anchor="end">#${data.orderId}</text>

  <!-- Perforation Cutout & Dashed line -->
  <path d="M -10 565 A 30 30 0 0 1 -10 625 Z" fill="#000000" />
  <path d="M 650 565 A 30 30 0 0 0 650 625 Z" fill="#000000" />
  <line x1="30" y1="595" x2="610" y2="595" stroke="#3f3f46" stroke-width="4" stroke-dasharray="12 12" />

  <!-- QR Instructions -->
  <text x="320" y="620" class="label" text-anchor="middle" font-size="15" fill="#f87171" letter-spacing="3" filter="url(#glow)">ESCANEA ESTE CÓDIGO QR EN LA PUERTA</text>

  <!-- QR Container -->
  <rect x="185" y="640" width="270" height="270" rx="20" fill="#ffffff" stroke="#ef4444" stroke-width="4" />
  
  <!-- Embedded Pure Vector QR Code (Auto-scaled using dynamic viewBox) -->
  <g transform="translate(195, 650)">
    <svg width="250" height="250" viewBox="${qrData.viewBox}" shape-rendering="crispEdges">
      ${qrData.innerSvg}
    </svg>
  </g>

  <!-- Decorative Corner Accents for QR -->
  <path d="M 175 670 L 175 630 L 215 630" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" />
  <path d="M 465 670 L 465 630 L 425 630" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" />
  <path d="M 175 880 L 175 920 L 215 920" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" />
  <path d="M 465 880 L 465 920 L 425 920" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" />

  <!-- Folio text below QR -->
  <text x="320" y="950" class="code-txt" text-anchor="middle">${data.ticketCode}</text>
  <text x="320" y="975" class="font-sans" font-size="12" font-weight="700" fill="#71717a" text-anchor="middle" letter-spacing="1">SISTEMA OFICIAL DE ACCESOS • FLOW PRODUCTIONS</text>

</svg>
  `.trim();
}

export async function generateTicketPngBuffer(data: TicketDesignData): Promise<Buffer> {
  const svg = await generateTicketSvg(data);
  return await sharp(Buffer.from(svg))
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();
}

export async function generateTicketPngBase64(data: TicketDesignData): Promise<string> {
  const buffer = await generateTicketPngBuffer(data);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
