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

// GitHub Pages SPA desteği için index.html -> 404.html kopyası
const indexHtmlPath = path.join(destDir, 'index.html')
const fallback404Path = path.join(destDir, '404.html')
if (fs.existsSync(indexHtmlPath)) {
  fs.copyFileSync(indexHtmlPath, fallback404Path)
  console.log('✓ SPA yönlendirmeleri için docs/404.html oluşturuldu!')
}

// GitHub Pages'in Jekyll filtresini kapatması için .nojekyll
fs.writeFileSync(path.join(destDir, '.nojekyll'), '')
console.log('✓ docs/.nojekyll oluşturuldu!')

console.log('✓ dist içeriği docs/ klasörüne kopyalandı!')

