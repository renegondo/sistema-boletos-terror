const sharp = require('sharp');

async function test() {
  const bannerBuf = await sharp('public/images/banner-rojo.png').resize({ width: 640 }).toBuffer();
  console.log("Banner size:", bannerBuf.length);
}
test().catch(console.error);
