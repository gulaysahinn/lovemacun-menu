import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const zipPath = path.resolve('release/lovemacun-prod-2026-10-18.zip')
const simDir = path.resolve('release/_test_sim')

console.log('--- TEST 5b: SEED EZİLMEME VE YENİDEN YÜKLEME SİMÜLASYONU ---\n')

if (fs.existsSync(simDir)) {
  fs.rmSync(simDir, { recursive: true, force: true })
}
fs.mkdirSync(simDir, { recursive: true })

// Adım 1: ZIP'i ilk kez aç (İlk Kurulum Simülasyonu)
console.log('1. ZIP ilk kez temiz bir hosting klasörüne açılıyor...')
execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${simDir}' -Force"`)

const menuSeedFile = path.join(simDir, 'data', 'menu.seed.json')
const menuFile = path.join(simDir, 'data', 'menu.json')

console.log(`   data/menu.seed.json mevcut mu: ${fs.existsSync(menuSeedFile) ? 'EVET ✓' : 'HAYIR ✗'}`)
console.log(`   data/menu.json ilk açılışta ZIP'te var mı: ${fs.existsSync(menuFile) ? 'EVET (Hata!)' : 'YOK ✓ (Beklenen: Yok, sunucu oluşturacak)'}`)

// Adım 2: Sunucu ilk kez açılıyor (ensure_menu_initialized çağrısı)
console.log('2. Sunucu ilk kez başlatılıyor (paths.php ensure_menu_initialized)...')
const initPhp = path.join(simDir, 'yonetim', 'paths.php')
execSync(`php -r "require_once '${initPhp.replace(/\\/g, '/')}'; ensure_menu_initialized();"`)

console.log(`   ensure_menu_initialized sonrası data/menu.json oluştu mu: ${fs.existsSync(menuFile) ? 'EVET ✓' : 'HAYIR ✗'}`)

// Adım 3: Kullanıcı menüde fiyat değişikliği yapıyor (Panelden güncelleme simülasyonu)
console.log('3. Kullanıcı panelden "Kebaplı Lahmacun" fiyatını 9999 TL yapıyor...')
const menuData = JSON.parse(fs.readFileSync(menuFile, 'utf8'))
const target = menuData.items.find(i => i.name === 'Kebaplı Lahmacun')
const oldPrice = target.price
target.price = 9999
fs.writeFileSync(menuFile, JSON.stringify(menuData, null, 2), 'utf8')
console.log(`   Eski Fiyat: ${oldPrice} TL -> Yeni Özel Fiyat: 9999 TL kaydedildi.`)

// Adım 4: Geliştirici siteyi güncelliyor - ZIP paketi klasörün ÜSTÜNE ikinci kez açılıyor!
console.log('4. SİTE GÜNCELLEMESİ: ZIP paketi mevcut klasörün üstüne ikinci kez açılıyor (Extract Overwrite)...')
execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${simDir}' -Force"`)

// Adım 5: Sunucu tekrar çalışıyor
execSync(`php -r "require_once '${initPhp.replace(/\\/g, '/')}'; ensure_menu_initialized();"`)

// Adım 6: Fiyat kontrolü
const afterData = JSON.parse(fs.readFileSync(menuFile, 'utf8'))
const afterTarget = afterData.items.find(i => i.name === 'Kebaplı Lahmacun')
console.log(`\n5. SONUÇ VE DOĞRULAMA:`)
console.log(`   Güncelleme sonrası Kebaplı Lahmacun fiyatı: ${afterTarget.price} TL`)

if (afterTarget.price === 9999) {
  console.log('   ✓ KANITLANDI: Fiyat (9999 TL) başarıyla korundu! Paket yüklemesi menü verisini EZMEDİ!')
} else {
  console.error(`   ✗ HATA: Fiyat ezildi! Yeni değer: ${afterTarget.price}`)
  process.exit(1)
}

// Temizlik
fs.rmSync(simDir, { recursive: true, force: true })
console.log('\n--- TEST 5b BAŞARIYLA TAMAMLANDI ---\n')
