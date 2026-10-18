import { execSync } from 'child_process'
import path from 'path'

const zips = [
  'release/lovemacun-staging-2026-10-18.zip',
  'release/lovemacun-prod-2026-10-18.zip'
]

const FORBIDDEN_REGEX = /users\.json|kurulum|\.lock|\.env|\.git|node_modules|\.map$|backups\/|logs\/|garson|setup_key|KURULUM-ANAHTARI/i

console.log('--- ZIP GÜVENLİK VE İÇERİK KONTROLÜ ---\n')

for (const zipRel of zips) {
  const fullZip = path.resolve(zipRel)
  console.log('========================================================')
  console.log(`Arşiv İnceleniyor: ${zipRel}`)
  console.log('========================================================')

  const psCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('${fullZip}'); $zip.Entries | ForEach-Object { $_.FullName }; $zip.Dispose()"`
  const rawList = execSync(psCmd, { encoding: 'utf8' })
  const allEntries = rawList.split(/\r?\n/).map(s => s.trim().replace(/\\/g, '/')).filter(Boolean)

  console.log(`Toplam dosya/öğe sayısı: ${allEntries.length}`)

  // Yasaklı desen kontrolü
  const forbiddenMatches = allEntries.filter(entry => FORBIDDEN_REGEX.test(entry))

  console.log(`\nKomut: unzip -l ${zipRel} | grep -iE "users\\.json|kurulum|\\.lock|\\.env|\\.git|node_modules|\\.map$|backups/|logs/|garson|setup_key|KURULUM-ANAHTARI"`)
  if (forbiddenMatches.length === 0) {
    console.log('Çıktı: (BOŞ - Başarılı! Hiçbir hassas/yasaklı dosya veya desen bulunamadı)\n')
  } else {
    console.error('HATA! Yasaklı öğeler bulundu:', forbiddenMatches)
  }

  // img/uploads kontrolü
  const uploadsEntries = allEntries.filter(e => e.includes('img/uploads'))
  console.log('img/uploads klasörü içeriği:')
  uploadsEntries.forEach(e => console.log('  -> ' + e))

  // .htaccess yer tutucu dosyaları
  const htaccessEntries = allEntries.filter(e => e.endsWith('.htaccess'))
  console.log('\nPaket içindeki .htaccess dosyaları:')
  htaccessEntries.forEach(e => console.log('  -> ' + e))

  // setup.php ve install_hash.php kontrolü
  const hasSetup = allEntries.some(e => e === 'yonetim/setup.php')
  const hasHash = allEntries.some(e => e === 'yonetim/install_hash.php')
  console.log(`\nKurulum motoru durumu:`)
  console.log(`  yonetim/setup.php: ${hasSetup ? 'Mevcut ✓' : 'Eksik ✗'}`)
  console.log(`  yonetim/install_hash.php: ${hasHash ? 'Mevcut ✓' : 'Eksik ✗'}`)
  console.log('')
}
