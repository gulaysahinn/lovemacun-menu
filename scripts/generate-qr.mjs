import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'

const targetUrl = 'https://tasfirinlovemacun.com?src=qr'
const outDir = path.resolve(process.cwd(), 'public/qr')

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

async function generateQRCodes() {
  console.log(`Generating QR codes for: ${targetUrl}`)

  // 1. High-resolution 2000px PNG
  const pngPath = path.join(outDir, 'tasfirinlovemacun-qr-2000px.png')
  await QRCode.toFile(pngPath, targetUrl, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 2000,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })
  const pngStat = fs.statSync(pngPath)
  console.log(`✓ PNG generated: ${pngPath} (${(pngStat.size / 1024).toFixed(1)} KB, 2000x2000px, Error Correction: H)`)

  // 2. Vector SVG
  const svgPath = path.join(outDir, 'tasfirinlovemacun-qr.svg')
  const svgString = await QRCode.toString(targetUrl, {
    errorCorrectionLevel: 'H',
    type: 'svg',
    margin: 4,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })
  fs.writeFileSync(svgPath, svgString, 'utf-8')
  const svgStat = fs.statSync(svgPath)
  console.log(`✓ SVG generated: ${svgPath} (${(svgStat.size / 1024).toFixed(1)} KB, Vector format, Error Correction: H)`)
}

generateQRCodes().catch((err) => {
  console.error('Error generating QR codes:', err)
  process.exit(1)
})
