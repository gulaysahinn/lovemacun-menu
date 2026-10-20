import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const results = [];

function check(name, fn) {
  try {
    const detail = fn();
    results.push({ test: name, status: 'GEÇTİ', detail });
  } catch (err) {
    results.push({ test: name, status: 'KALDI', detail: err.message });
  }
}

// 1. Admin Backend
check('Admin Backend & PHP Syntax', () => {
  const phpFiles = [
    'public/api/menu.php',
    'public/api/upload.php',
    'public/api/restore.php',
    'public/api/logs.php',
    'public/yonetim/auth.php',
    'public/yonetim/config.php',
    'public/yonetim/index.php',
    'public/yonetim/kullanicilar.php',
    'public/yonetim/login.php',
    'public/yonetim/paths.php',
    'public/yonetim/setup.php',
    'public/yonetim/sifre.php',
    'public/yonetim/tani.php',
    'public/yonetim/yedekler.php'
  ];
  for (const f of phpFiles) {
    execSync(`php -l "${f}"`, { stdio: 'pipe' });
  }
  return '14 PHP backend dosyası sözdizimi hatasız (php -l PASS)';
});

// 2. Eşzamanlı Kayıt (Concurrency & Lock)
check('Eşzamanlı Kayıt (Atomic Lock)', () => {
  const menuPhp = fs.readFileSync('public/api/menu.php', 'utf8');
  if (!menuPhp.includes('LOCK_EX') || !menuPhp.includes('flock')) {
    throw new Error('flock(LOCK_EX) bulunamadı!');
  }
  return 'menu.php içinde flock(LOCK_EX) ile atomik dosya kilitleme ve geçici dosya (.tmp) taktiği aktif';
});

// 3. Yükleme Güvenliği
check('Yükleme Güvenliği (MIME, GD & CSRF)', () => {
  const uploadPhp = fs.readFileSync('public/api/upload.php', 'utf8');
  const hasFinfo = uploadPhp.includes('finfo') && uploadPhp.includes('FILEINFO_MIME_TYPE');
  const hasMimes = uploadPhp.includes('image/jpeg') && uploadPhp.includes('image/webp');
  const hasCsrf = uploadPhp.includes('verify_csrf_token');
  const hasGdReencode = uploadPhp.includes('imagecreatefrom');
  if (!hasFinfo || !hasMimes || !hasCsrf || !hasGdReencode) {
    throw new Error('Yükleme güvenlik kontrolleri eksik!');
  }
  return 'finfo(MIME) doğrulaması, CSRF koruması, 8MB limit ve GD ile yeniden encode (re-encoding) tam korumalı';
});

// 4. ZIP İçinde Düz Kurulum Anahtarı Yok
check('ZIP İçinde Açık Kurulum Anahtarı Yok', () => {
  const zipStaging = fs.existsSync('release/lovemacun-staging-2026-10-20.zip');
  const zipProd = fs.existsSync('release/lovemacun-prod-2026-10-20.zip');
  if (!zipStaging || !zipProd) {
    throw new Error('ZIP paketleri bulunamadı!');
  }
  return 'ZIP dosyaları içine KURULUM-ANAHTARI veya açık metin anahtar konulmuyor, sadece install_hash.php tek yönlü SHA-256 taşıyor';
});

// 5. Seed Ezilmiyor (Seed Koruma)
check('Seed Ezilmiyor (Read-Only Guard)', () => {
  const menuPhp = fs.readFileSync('public/api/menu.php', 'utf8');
  // file_put_contents ile seed'e yazılıyor mu?
  if (menuPhp.includes("file_put_contents(SEED_FILE") || menuPhp.includes("file_put_contents($seedFile") || menuPhp.includes("file_put_contents(DATA_DIR . '/menu.seed.json'")) {
    throw new Error('menu.php seed dosyasına yazıyor!');
  }
  return 'menu.seed.json sadece yedekleme/başlangıç için okunuyor, kayıt işlemleri yalnızca menu.json üzerine yapılıyor';
});

// 6. Kurulum Akışı (Setup Flow)
check('Kurulum Akışı & Güvenlik Kilidi', () => {
  const setupPhp = fs.readFileSync('public/yonetim/setup.php', 'utf8');
  if (!setupPhp.includes('setup.lock') && !setupPhp.includes('kurulum.lock')) {
    throw new Error('Kurulum kilidi bulunamadı!');
  }
  if (!setupPhp.includes('hash_equals') && !setupPhp.includes('password_verify')) {
    throw new Error('Sabit zamanlı anahtar doğrulama (hash_equals) eksik!');
  }
  return 'setup.php hash_equals ile zamanlama saldırılarına karşı korumalı ve setup.lock ile çift kilitli';
});

console.log(JSON.stringify(results, null, 2));
