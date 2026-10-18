import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const keyFile = path.resolve('release/KURULUM-ANAHTARI-2026-10-18.txt')
if (!fs.existsSync(keyFile)) {
  console.error('Anahtar dosyası bulunamadı:', keyFile)
  process.exit(1)
}

const keyContent = fs.readFileSync(keyFile, 'utf8')
const match = keyContent.match(/LM-[A-F0-9-]+/)
if (!match) {
  console.error('Anahtar metni ayrıştırılamadı')
  process.exit(1)
}

const plainKey = match[0]
console.log('Düz Anahtar Uzunluğu:', plainKey.length, 'karakter (Güvenlik gereği sohbete yazılmadı)')

const zips = [
  'release/lovemacun-staging-2026-10-18.zip',
  'release/lovemacun-prod-2026-10-18.zip'
]

const tmpExtract = path.resolve('release/_grep_test_tmp')

for (const zipRel of zips) {
  const fullZip = path.resolve(zipRel)
  if (fs.existsSync(tmpExtract)) {
    fs.rmSync(tmpExtract, { recursive: true, force: true })
  }
  fs.mkdirSync(tmpExtract, { recursive: true })

  // Aç
  execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${fullZip}' -DestinationPath '${tmpExtract}' -Force"`, {
    stdio: 'ignore'
  })

  // Düz anahtarı tüm dosyalarda ara
  let foundCount = 0
  const matchingFiles = []

  function searchInDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const ent of entries) {
      const p = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        searchInDir(p)
      } else {
        try {
          const content = fs.readFileSync(p, 'utf8')
          if (content.includes(plainKey)) {
            foundCount++
            matchingFiles.push(path.relative(tmpExtract, p))
          }
        } catch {
          // Binary dosya ise atla
        }
      }
    }
  }

  searchInDir(tmpExtract)

  console.log(`\nZip: ${zipRel}`)
  console.log(`Grep Sonucu: Düz anahtar eşleşmesi = ${foundCount}`)
  if (foundCount === 0) {
    console.log(`✓ KANITLANDI: Düz kurulum anahtarı bu zip içinde HİÇBİR DOSYADA geçmiyor!`)
  } else {
    console.error(`✗ HATA: Düz anahtar şu dosyalarda bulundu:`, matchingFiles)
  }

  fs.rmSync(tmpExtract, { recursive: true, force: true })
}
