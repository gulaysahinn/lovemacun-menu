import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const ROOT_DIR = path.resolve('.')
const KEY_FILE = path.join(ROOT_DIR, 'KURULUM-ANAHTARI.txt')
const PHP_KEY_FILE = path.join(ROOT_DIR, 'public', 'yonetim', 'setup_key.php')

export function generateSetupKey(force = false) {
  let rawKey = ''
  if (!force && fs.existsSync(KEY_FILE)) {
    rawKey = fs.readFileSync(KEY_FILE, 'utf8').trim()
  }

  if (!rawKey) {
    const bytes = crypto.randomBytes(16).toString('hex').toUpperCase()
    // 4'er blok halinde okunabilir: LM-XXXX-XXXX-XXXX-XXXX
    rawKey = `LM-${bytes.slice(0, 4)}-${bytes.slice(4, 8)}-${bytes.slice(8, 12)}-${bytes.slice(12, 16)}`
    fs.writeFileSync(KEY_FILE, rawKey, 'utf8')
    console.log(`✓ Yeni kurulum anahtarı üretildi: KURULUM-ANAHTARI.txt`)
  }

  const hash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const phpContent = `<?php\n// Otomatik uretilmis tek kullanimlik kurulum anahtari (SHA-256 Hash)\nif (!defined('AUTH_INCLUDED')) exit;\ndefine('SETUP_KEY_HASH', '${hash}');\n`
  fs.writeFileSync(PHP_KEY_FILE, phpContent, 'utf8')
  console.log(`✓ Sunucu kurulum anahtar hash'i güncellendi: public/yonetim/setup_key.php`)

  return rawKey
}

if (process.argv[1]?.endsWith('generate-setup-key.mjs')) {
  const force = process.argv.includes('--force')
  generateSetupKey(force)
}
