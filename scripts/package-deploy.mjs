import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync, copyFileSync, unlinkSync, readFileSync, rmSync } from 'fs'
import { join, relative, sep, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import crypto from 'crypto'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..')
const DIST_DIR = join(ROOT, 'dist')
const RELEASE_DIR = join(ROOT, 'release')

const args = process.argv.slice(2)
const isStaging = args.includes('--staging')
const mode = isStaging ? 'staging' : 'prod'
const today = new Date().toISOString().slice(0, 10)

console.log('====================================================')
console.log(` Lovemacun Paketleme Başlatılıyor: [${mode.toUpperCase()}]`)
console.log('====================================================\n')

// 1. Derleme Adımı (npm run build / build:staging)
console.log(`[1/6] ${isStaging ? 'Staging' : 'Production'} derlemesi çalıştırılıyor...`)
execSync(isStaging ? 'npm run build:staging' : 'npm run build', {
  cwd: ROOT,
  stdio: 'inherit'
})

// 2. Rastgele Kurulum Anahtarı Üret (En az 24 karakter)
// Format: LM-XXXX-XXXX-XXXX-XXXX-XXXX (32 karakter)
const rawKeyPart = crypto.randomBytes(12).toString('hex').toUpperCase()
const formattedKey = 'LM-' + rawKeyPart.match(/.{1,4}/g).join('-')
const keyHash = crypto.createHash('sha256').update(formattedKey).digest('hex')

if (!existsSync(RELEASE_DIR)) {
  mkdirSync(RELEASE_DIR, { recursive: true })
}

const keyTxtFileName = `KURULUM-ANAHTARI-${today}.txt`
const keyTxtPath = join(RELEASE_DIR, keyTxtFileName)
const keyFileContent = `========================================================\n` +
  ` TAŞ FIRIN LOVEMACUN - İLK KURULUM ANAHTARI\n` +
  ` Üretim Tarihi: ${new Date().toISOString()}\n` +
  ` Mod: ${mode}\n` +
  `========================================================\n\n` +
  `TEK KULLANIMLIK KURULUM ANAHTARINIZ:\n` +
  `${formattedKey}\n\n` +
  `Bu anahtar ile hosting sunucunuzda ilk yönetici hesabınızı\n` +
  `https://tasfirinlovemacun.com/yonetim/setup.php adresinden oluşturabilirsiniz.\n` +
  `Kurulum tamamlandığında bu anahtar sunucuda otomatik imha edilir.\n` +
  `BU DOSYAYI GÜVENLİ BİR YERDE SAKLAYIN VE ASLA PAYLAŞMAYIN.\n`

writeFileSync(keyTxtPath, keyFileContent, 'utf8')
console.log(`\n[2/6] Tek kullanımlık kurulum anahtarı üretildi:`)
console.log(`      Dosya yolu: ${keyTxtPath} (ZIP içine DAHİL EDİLMEZ, .gitignore altındadır)`)
console.log(`      Hash değeri (SHA-256) zip paketindeki install_hash.php içine gömüldü.`)

// 3. Dosyaları Topla ve Filtrele
console.log(`\n[3/6] Dosyalar taranıyor ve hassas öğeler filtreleniyor...`)

const FORBIDDEN_REGEX = /users\.json|kurulum|\.lock|\.env|\.git|node_modules|\.map$|backups[\\\/]|logs[\\\/]|garson|setup_key|KURULUM-ANAHTARI/i

const tmpPackDir = join(RELEASE_DIR, `_pack_tmp_${mode}`)
if (existsSync(tmpPackDir)) {
  rmSync(tmpPackDir, { recursive: true, force: true })
}
mkdirSync(tmpPackDir, { recursive: true })

function collectAndFilter(dir, baseDir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const ent of entries) {
    const full = join(dir, ent.name)
    const rel = relative(baseDir, full)
    const relNorm = rel.split(sep).join('/')

    // Test ve hassas dosya kontrolü
    if (FORBIDDEN_REGEX.test(relNorm)) {
      continue
    }

    if (ent.isDirectory()) {
      // uploads klasöründeki kullanıcı test fotoğraflarını atla, yalnızca .htaccess kalsın
      if (relNorm.includes('img/uploads')) {
        const destUploads = join(tmpPackDir, rel)
        mkdirSync(destUploads, { recursive: true })
        const htaccess = join(full, '.htaccess')
        if (existsSync(htaccess)) {
          copyFileSync(htaccess, join(destUploads, '.htaccess'))
        }
        continue
      }
      collectAndFilter(full, baseDir)
    } else {
      if (ent.name.endsWith('.zip') || ent.name.endsWith('.map') || ent.name === '.gitkeep') {
        continue
      }
      // Canlı menu.json ZIP'e konmaz; sunucu ilk açılışta menu.seed.json'dan üretir
      // Böylece site güncellemelerinde cPanel'de ZIP tekrar açılsa bile fiyatlar ASLA ezilmez!
      if (relNorm === 'data/menu.json') {
        continue
      }
      const dest = join(tmpPackDir, rel)
      const dDir = dirname(dest)
      if (!existsSync(dDir)) mkdirSync(dDir, { recursive: true })
      copyFileSync(full, dest)
    }
  }
}

collectAndFilter(DIST_DIR, DIST_DIR)

// install_hash.php'yi oluştur
const installHashContent = `<?php\n` +
  `// Otomatik paketleme tarafindan uretilmis kurulum anahtari hash'idir.\n` +
  `// Tek kullanimliktir; kurulum tamamlandiginda silinir.\n` +
  `define('SETUP_KEY_HASH', '${keyHash}');\n`
const yonetimDir = join(tmpPackDir, 'yonetim')
if (!existsSync(yonetimDir)) mkdirSync(yonetimDir, { recursive: true })
writeFileSync(join(yonetimDir, 'install_hash.php'), installHashContent, 'utf8')

// 4. Staging Modu Özel Düzenlemeleri
if (isStaging) {
  console.log(`[4/6] Staging SEO ve Güvenlik kısıtlamaları uygulanıyor...`)

  // index.html ve 404.html
  for (const htmlFile of ['index.html', '404.html']) {
    const htmlPath = join(tmpPackDir, htmlFile)
    if (existsSync(htmlPath)) {
      let content = readFileSync(htmlPath, 'utf8')
      // Canonical kaldır
      content = content.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
      // og:url kaldır
      content = content.replace(/<meta\s+property=["']og:url["'][^>]*>/gi, '')
      // noindex ekle
      if (!content.includes('name="robots"')) {
        content = content.replace('</head>', '  <meta name="robots" content="noindex, nofollow" />\n</head>')
      } else {
        content = content.replace(/<meta\s+name=["']robots["'][^>]*>/gi, '<meta name="robots" content="noindex, nofollow" />')
      }
      writeFileSync(htmlPath, content, 'utf8')
    }
  }

  // robots.txt -> Disallow: /
  const robotsPath = join(tmpPackDir, 'robots.txt')
  writeFileSync(robotsPath, 'User-agent: *\nDisallow: /\n', 'utf8')

  // sitemap.xml kaldır
  const sitemapPath = join(tmpPackDir, 'sitemap.xml')
  if (existsSync(sitemapPath)) {
    unlinkSync(sitemapPath)
  }

  // .htaccess içine X-Robots-Tag: noindex ekle
  const htPath = join(tmpPackDir, '.htaccess')
  if (existsSync(htPath)) {
    let ht = readFileSync(htPath, 'utf8')
    ht = `<IfModule mod_headers.c>\n  Header set X-Robots-Tag "noindex, nofollow"\n</IfModule>\n\n` + ht
    writeFileSync(htPath, ht, 'utf8')
  }
} else {
  console.log(`[4/6] Production konfigürasyonu doğrulanıyor (robots.txt, sitemap.xml)...`)
}

// 5. ZIP Paketi Oluştur (release/ klasörüne)
const outputZipName = `lovemacun-${mode}-${today}.zip`
const outputZipPath = join(RELEASE_DIR, outputZipName)
if (existsSync(outputZipPath)) {
  unlinkSync(outputZipPath)
}

console.log(`[5/6] ZIP arşivi sıkıştırılıyor: ${outputZipName} ...`)
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${tmpPackDir}\\*' -DestinationPath '${outputZipPath}' -Force"`,
  { stdio: 'inherit', timeout: 120000 }
)

const zipSize = statSync(outputZipPath).size
console.log(`\n✓ ZIP Başarıyla Oluşturuldu: ${outputZipPath}`)
console.log(`  Boyut: ${(zipSize / 1024 / 1024).toFixed(2)} MB`)

// 6. Üst Düzey Klasör Özeti Tablosu
const dirSummary = {}
function summarizeDir(dir, relPrefix = '') {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const ent of entries) {
    const full = join(dir, ent.name)
    if (ent.isDirectory()) {
      const topDir = relPrefix ? relPrefix.split('/')[0] : ent.name
      if (!dirSummary[topDir]) dirSummary[topDir] = { files: 0, size: 0 }
      summarizeDir(full, relPrefix ? `${relPrefix}/${ent.name}` : ent.name)
    } else {
      const topDir = relPrefix ? relPrefix.split('/')[0] : '(Kök Dizin)'
      if (!dirSummary[topDir]) dirSummary[topDir] = { files: 0, size: 0 }
      dirSummary[topDir].files++
      dirSummary[topDir].size += statSync(full).size
    }
  }
}
summarizeDir(tmpPackDir)

// Geçici klasörü temizle
rmSync(tmpPackDir, { recursive: true, force: true })

console.log('\n[6/6] ZIP İçeriği Üst Düzey Klasör Özeti:')
console.log('| Klasör / Konum | Dosya Sayısı | Toplam Boyut |')
console.log('| :--- | :--- | :--- |')
for (const [folder, data] of Object.entries(dirSummary).sort()) {
  const mb = (data.size / 1024 / 1024).toFixed(2)
  const kb = (data.size / 1024).toFixed(1)
  const sizeStr = data.size > 1024 * 1024 ? `${mb} MB` : `${kb} KB`
  console.log(`| \`${folder}\` | ${data.files} | ${sizeStr} |`)
}

console.log('\n====================================================')
console.log(' Paketleme ve Güvenlik Doğrulaması Tamamlandı!')
console.log('====================================================\n')
