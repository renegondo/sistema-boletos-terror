const QRCode = require('qrcode');
async function test() {
  const rawSvg = await QRCode.toString('TKT-123456', { type: 'svg', margin: 1, color: { dark: '#000000', light: '#ffffff' } });
  console.log(rawSvg);
}
test().catch(console.error);
