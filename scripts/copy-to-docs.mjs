import fs from 'fs'
import path from 'path'

const srcDir = path.resolve('dist')
const destDir = path.resolve('docs')
const GH_BASE = '/lovemacun-menu'

if (!fs.existsSync(srcDir)) {
  console.error('dist klasörü bulunamadı. Önce build alınmalı.')
  process.exit(1)
}

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 })
}

fs.cpSync(srcDir, destDir, { recursive: true })

// 1. Güvenlik: GitHub Pages statik bir sunucudur (.htaccess çalışmaz, PHP kaynak kodlarını düz metin sunar).
// Bu yüzden PHP yönetim paneli, API, yedek/log klasörleri ve .htaccess dosyaları docs/ içinden tamamen çıkarılır!
const serverOnlyPaths = [
  'yonetim',
  'api',
  'backups',
  'logs',
  'data/menu.seed.json',
  'data/.htaccess',
  'img/uploads/.htaccess',
  '.htaccess',
]

for (const rel of serverOnlyPaths) {
  const target = path.join(destDir, rel)
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true })
  }
}

// 2. GitHub Pages (/lovemacun-menu/) alt dizin uyumluluğu için docs/index.html ve manifest yollarını dönüştür
const indexHtmlPath = path.join(destDir, 'index.html')
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8')
  html = html
    .replace(/(href|src)="\/(assets|favicon|apple-touch-icon|manifest\.webmanifest|icons|video|img|img-cut|hero|logo)/g, `$1="${GH_BASE}/$2`)
  fs.writeFileSync(indexHtmlPath, html, 'utf8')
}

// 3. Vite dinamik chunk yükleyicisinin (/assets/...) GitHub Pages alt dizininde 404 vermemesi için JS paketlerini güncelle
const assetsDir = path.join(destDir, 'assets')
if (fs.existsSync(assetsDir)) {
  for (const file of fs.readdirSync(assetsDir)) {
    if (file.endsWith('.js') || file.endsWith('.css')) {
      const fullPath = path.join(assetsDir, file)
      let content = fs.readFileSync(fullPath, 'utf8')
      // Vite preload helper: `"/assets/"` veya `"assets/"` -> `"/lovemacun-menu/assets/"`
      content = content
        .replace(/"\/assets\//g, `"${GH_BASE}/assets/`)
        .replace(/return"\/"\+e/g, `return"${GH_BASE}/"+e`)
      fs.writeFileSync(fullPath, content, 'utf8')
    }
  }
}

// 4. PWA manifest.webmanifest içindeki ikon ve start_url yollarını GitHub Pages alt dizinine uyarla
const manifestPath = path.join(destDir, 'manifest.webmanifest')
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8')
  manifest = manifest
    .replace(/"start_url":\s*"\/\?src=pwa"/g, `"start_url": "${GH_BASE}/?src=pwa"`)
    .replace(/"src":\s*"\/icons\//g, `"src": "${GH_BASE}/icons/`)
  fs.writeFileSync(manifestPath, manifest, 'utf8')
}

// 5. GitHub Pages SPA desteği için index.html -> 404.html kopyası
const fallback404Path = path.join(destDir, '404.html')
if (fs.existsSync(indexHtmlPath)) {
  fs.copyFileSync(indexHtmlPath, fallback404Path)
  console.log('✓ SPA yönlendirmeleri için docs/404.html oluşturuldu!')
}

// 6. GitHub Pages'in Jekyll filtresini kapatması için .nojekyll
fs.writeFileSync(path.join(destDir, '.nojekyll'), '')
console.log('✓ docs/.nojekyll oluşturuldu!')
console.log('✓ docs/ klasörü GitHub Pages (/lovemacun-menu/) için optimize edildi ve PHP/sunucu dosyalarından arındırıldı!')
