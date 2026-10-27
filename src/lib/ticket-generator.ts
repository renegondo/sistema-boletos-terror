import QRCode from 'qrcode';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import * as opentype from 'opentype.js';

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

let cachedFont: opentype.Font | null = null;

function getFont(): opentype.Font {
  if (!cachedFont) {
    const fontPath = path.join(process.cwd(), 'public/fonts/Arial-Bold.ttf');
    const fontBuf = fs.readFileSync(fontPath);
    cachedFont = opentype.parse(
      fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength)
    );
  }
  return cachedFont;
}

export function renderVectorText(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  options: { align?: 'left' | 'center' | 'right'; fill?: string } = {}
): string {
  if (!text) return '';
  const font = getFont();
  const align = options.align || 'left';
  const fill = options.fill || '#ffffff';

  // Sanitize text to avoid undefined or non-string
  const cleanStr = String(text).toUpperCase().trim();
  const width = font.getAdvanceWidth(cleanStr, fontSize);

  let startX = x;
  if (align === 'center') startX = x - width / 2;
  if (align === 'right') startX = x - width;

  const p = font.getPath(cleanStr, startX, y, fontSize);
  p.fill = fill;
  return p.toSVG(2);
}

export async function generateQrVectorSvg(text: string): Promise<{ innerSvg: string; viewBox: string }> {
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
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 30 30';
  const innerSvg = rawSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

  return { innerSvg, viewBox };
}

export async function generateTicketSvg(data: TicketDesignData): Promise<string> {
  const qrData = await generateQrVectorSvg(data.ticketCode);

  // Load images
  let bannerBase64 = '';
  let logoBase64 = '';
  try {
    const bannerPath = path.join(process.cwd(), 'public/images/banner-rojo.png');
    const bannerBuf = await sharp(bannerPath).resize({ width: 640 }).toBuffer();
    bannerBase64 = `data:image/png;base64,${bannerBuf.toString('base64')}`;
  } catch (e) {}

  try {
    const logoPath = path.join(process.cwd(), 'public/images/logo-fondo.png');
    const logoBuf = await sharp(logoPath).resize({ width: 340 }).toBuffer();
    logoBase64 = `data:image/png;base64,${logoBuf.toString('base64')}`;
  } catch (e) {}

  // Format strings
  const attendeeName = (data.attendeeName || 'ASISTENTE').toUpperCase();
  const tierName = (data.tierName || 'ACCESO GENERAL').toUpperCase();
  const eventDate = (data.eventDate || '1 NOV 2026').toUpperCase();
  const eventTime = data.eventTime ? `${data.eventTime} HRS` : '21:00 HRS';
  const priceFormatted = `$${Number(data.price || 0).toFixed(2)} MXN`;
  const orderId = (data.orderId || '').toUpperCase();
  const ticketCode = (data.ticketCode || '').toUpperCase();

  // Generate vector glyphs using opentype.js
  const pathTitlePill = renderVectorText('ENTRADA OFICIAL PRE-REGISTRO', 320, 295, 14, { align: 'center', fill: '#ffffff' });
  const pathLabelAttendee = renderVectorText('TITULAR DEL BOLETO', 65, 368, 12, { align: 'left', fill: '#ef4444' });
  const pathAttendeeName = renderVectorText(attendeeName, 65, 412, attendeeName.length > 22 ? 22 : 26, { align: 'left', fill: '#ffffff' });
  const pathPrice = renderVectorText(priceFormatted, 575, 375, 24, { align: 'right', fill: '#facc15' });
  const pathTier = renderVectorText(tierName, 575, 412, 13, { align: 'right', fill: '#a1a1aa' });

  const pathLabelFecha = renderVectorText('FECHA', 50, 485, 12, { align: 'left', fill: '#ef4444' });
  const pathFecha = renderVectorText(eventDate, 50, 518, 18, { align: 'left', fill: '#ffffff' });

  const pathLabelAcceso = renderVectorText('ACCESO', 230, 485, 12, { align: 'left', fill: '#ef4444' });
  const pathAcceso = renderVectorText(eventTime, 230, 518, 18, { align: 'left', fill: '#ffffff' });

  const pathLabelFolio = renderVectorText('FOLIO ORDEN', 590, 485, 12, { align: 'right', fill: '#ef4444' });
  const pathFolio = renderVectorText(`#${orderId}`, 590, 518, 15, { align: 'right', fill: '#f87171' });

  const pathQrInstruction = renderVectorText('ESCANEA ESTE CÓDIGO QR EN LA PUERTA', 320, 620, 13, { align: 'center', fill: '#f87171' });
  const pathTicketCode = renderVectorText(ticketCode, 320, 950, 30, { align: 'center', fill: '#ffffff' });
  const pathFooter = renderVectorText('SISTEMA OFICIAL DE ACCESOS • FLOW PRODUCTIONS', 320, 975, 11, { align: 'center', fill: '#71717a' });

  return `
<svg width="640" height="1000" viewBox="0 0 640 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f0e15" stop-opacity="0" />
      <stop offset="70%" stop-color="#0f0e15" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0f0e15" stop-opacity="1" />
    </linearGradient>
    <clipPath id="cardClip">
      <rect x="0" y="0" width="640" height="1000" rx="40" />
    </clipPath>
  </defs>

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

  <!-- Title & Tier Pill -->
  <rect x="160" y="270" width="320" height="38" rx="19" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5" />
  ${pathTitlePill}

  <!-- Attendee Section Box -->
  <rect x="40" y="335" width="560" height="115" rx="20" fill="#14131d" stroke="#27272a" stroke-width="2" />
  ${pathLabelAttendee}
  ${pathAttendeeName}
  ${pathPrice}
  ${pathTier}

  <!-- Info Grid -->
  ${pathLabelFecha}
  ${pathFecha}

  ${pathLabelAcceso}
  ${pathAcceso}

  ${pathLabelFolio}
  ${pathFolio}

  <!-- Perforation Cutout & Dashed line -->
  <path d="M -10 565 A 30 30 0 0 1 -10 625 Z" fill="#000000" />
  <path d="M 650 565 A 30 30 0 0 0 650 625 Z" fill="#000000" />
  <line x1="30" y1="595" x2="610" y2="595" stroke="#3f3f46" stroke-width="4" stroke-dasharray="12 12" />

  <!-- QR Instructions -->
  ${pathQrInstruction}

  <!-- QR Container -->
  <rect x="185" y="640" width="270" height="270" rx="20" fill="#ffffff" stroke="#ef4444" stroke-width="4" />
  
  <!-- Embedded Pure Vector QR Code -->
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
  ${pathTicketCode}
  ${pathFooter}

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
  return buffer.toString('base64');
}
