const sharp = require('sharp');
const fs = require('fs');

async function test() {
  const logoBuf = await sharp('public/images/logo-fondo.png').resize({ width: 300 }).toBuffer();
  console.log("Logo size:", logoBuf.length);
}
test().catch(console.error);
