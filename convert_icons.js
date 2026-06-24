const sharp = require('sharp');
const fs = require('fs');

async function convert() {
  const svg = fs.readFileSync('public/icon.svg');
  
  await sharp(svg)
    .resize(192, 192)
    .png()
    .toFile('public/icon-192.png');
    
  await sharp(svg)
    .resize(512, 512)
    .png()
    .toFile('public/icon-512.png');
    
  console.log('Icons generated successfully.');
}

convert().catch(console.error);
