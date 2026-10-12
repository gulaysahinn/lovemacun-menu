import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processLogo() {
  const masterInput = 'public/img/logo.png';
  if (fs.existsSync(masterInput)) {
    fs.copyFileSync(masterInput, 'public/logo.png');
  }
  const inputPath = 'public/logo.png';

  // 1. Favicon 32x32 with WHITE CIRCULAR BACKGROUND (Beyaz yuvarlak arkaplan)
  const bg32 = Buffer.from(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15.5" fill="#ffffff" />
    </svg>
  `);
  const logo26 = await sharp(inputPath)
    .resize(26, 26, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp(bg32)
    .composite([{ input: logo26, gravity: 'center' }])
    .png()
    .toFile('public/favicon-32x32.png');

  // 2. Favicon 64x64 with WHITE CIRCULAR BACKGROUND
  const bg64 = Buffer.from(`
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="31" fill="#ffffff" />
    </svg>
  `);
  const logo52 = await sharp(inputPath)
    .resize(52, 52, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp(bg64)
    .composite([{ input: logo52, gravity: 'center' }])
    .png()
    .toFile('public/favicon.png');

  // Also create favicon.ico from 32x32
  fs.copyFileSync('public/favicon-32x32.png', 'public/favicon.ico');

  // 3. Apple Touch Icon (180x180) with clean white circle
  const bg180 = Buffer.from(`
    <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
      <rect width="180" height="180" rx="36" fill="#14100d" />
      <circle cx="90" cy="90" r="82" fill="#ffffff" />
    </svg>
  `);
  const logo140 = await sharp(inputPath)
    .resize(138, 138, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp(bg180)
    .composite([{ input: logo140, gravity: 'center' }])
    .png()
    .toFile('public/apple-touch-icon.png');

  // 4. SVG Favicon with white circle
  const logoB64 = fs.readFileSync('public/favicon.png').toString('base64');
  const svgFavicon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="31" fill="#ffffff" stroke="#e64a19" stroke-width="1" stroke-opacity="0.3"/>
  <image href="data:image/png;base64,${logoB64}" x="0" y="0" width="64" height="64"/>
</svg>`;
  fs.writeFileSync('public/favicon.svg', svgFavicon, 'utf8');

  // 5. White circular badge logo asset (public/logo-badge.png) for web navbar & footer (256x256)
  const bg256 = Buffer.from(`
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <circle cx="128" cy="128" r="126" fill="#ffffff" stroke="#ff7a00" stroke-width="3" stroke-opacity="0.35"/>
    </svg>
  `);
  const logo206 = await sharp(inputPath)
    .resize(206, 206, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp(bg256)
    .composite([{ input: logo206, gravity: 'center' }])
    .png()
    .toFile('public/logo-badge.png');

  console.log('✅ Favicons and logo badge with white circle created successfully!');
}

processLogo().catch(console.error);
