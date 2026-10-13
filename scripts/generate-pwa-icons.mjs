import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const srcLogo = path.resolve('public/logo-badge.png')
const outDir = path.resolve('public/icons')

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

async function generateIcons() {
  console.log('Generating PWA icons from:', srcLogo)

  // 192x192 Standard
  await sharp(srcLogo)
    .resize(192, 192, { fit: 'contain', background: { r: 20, g: 16, b: 13, alpha: 1 } })
    .png()
    .toFile(path.join(outDir, 'icon-192x192.png'))

  // 512x512 Standard
  await sharp(srcLogo)
    .resize(512, 512, { fit: 'contain', background: { r: 20, g: 16, b: 13, alpha: 1 } })
    .png()
    .toFile(path.join(outDir, 'icon-512x512.png'))

  // 192x192 Maskable (padded inside safe area)
  const logo192Padded = await sharp(srcLogo)
    .resize(150, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 20, g: 16, b: 13, alpha: 1 }
    }
  })
    .composite([{ input: logo192Padded, gravity: 'center' }])
    .png()
    .toFile(path.join(outDir, 'icon-maskable-192x192.png'))

  // 512x512 Maskable (padded inside safe area)
  const logo512Padded = await sharp(srcLogo)
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 20, g: 16, b: 13, alpha: 1 }
    }
  })
    .composite([{ input: logo512Padded, gravity: 'center' }])
    .png()
    .toFile(path.join(outDir, 'icon-maskable-512x512.png'))

  console.log('✓ PWA Icons successfully generated in public/icons/')
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err)
  process.exit(1)
})
