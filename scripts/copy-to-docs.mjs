import fs from 'fs'
import path from 'path'

const srcDir = path.resolve('dist')
const destDir = path.resolve('docs')

if (!fs.existsSync(srcDir)) {
  console.error('dist klasörü bulunamadı. Önce build alınmalı.')
  process.exit(1)
}

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true })
}

fs.cpSync(srcDir, destDir, { recursive: true })
console.log('✓ dist içeriği docs/ klasörüne kopyalandı!')
