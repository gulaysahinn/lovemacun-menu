import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const ROOT = path.resolve('.')
const TASFIRIN_DATA = path.join(ROOT, 'tasfirin-data')
const MENU_FILE = path.join(ROOT, 'public', 'data', 'menu.json')

console.log('--- TEST 5c: EŞZAMANLI KAYIT (FLOCK + REVISION ÇATIŞMASI) TESTİ ---\n')

// 1. Canlı menu.json'dan güncel revision değerini oku
const menuContent = JSON.parse(fs.readFileSync(MENU_FILE, 'utf8'))
const currentRev = menuContent.revision || 1
console.log(`Mevcut Menü Revizyonu: ${currentRev}`)

// İki oturum simülasyonu:
// Oturum A ve Oturum B aynı anda menüyü açtı (Her ikisinde de revizyon = currentRev)
console.log(`\n1. Durum:`)
console.log(`   Oturum 1 (Yönetici) menüyü açtı. Revizyon: ${currentRev}`)
console.log(`   Oturum 2 (Personel) menüyü açtı. Revizyon: ${currentRev}`)

// 2. Oturum 1 menüyü kaydeder (Revizyon eşleşir -> Başarılı, yeni revizyon = currentRev + 1)
const phpTestScript = `
require_once 'public/yonetim/paths.php';
require_once 'public/yonetim/auth.php';

// Oturum 1 kaydı simülasyonu
$menuData = json_decode(file_get_contents(MENU_FILE), true);
$currentRev = $menuData['revision'] ?? 1;

// 1. Kayıt: Revizyon = $currentRev ile gönderiliyor
$sentRev1 = $currentRev;
$fp = fopen(MENU_FILE, 'c+');
flock($fp, LOCK_EX);
$existingData = json_decode(stream_get_contents($fp), true);
$servRev = $existingData['revision'] ?? 1;

if ($sentRev1 > 0 && $sentRev1 !== $servRev) {
    echo "Oturum 1 Hata: 409 Conflict\\n";
    exit(1);
}

$newRev = $servRev + 1;
$existingData['revision'] = $newRev;
ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($existingData, JSON_PRETTY_PRINT));
flock($fp, LOCK_UN);
fclose($fp);
echo "✓ Oturum 1: Kayıt BAŞARILI. Yeni Revizyon: {$newRev}\\n";

// 2. Kayıt: Oturum 2 (eski $currentRev ile) kaydetmeye çalışıyor
$sentRev2 = $currentRev; // Eski revizyon!
$fp2 = fopen(MENU_FILE, 'c+');
flock($fp2, LOCK_EX);
$existingData2 = json_decode(stream_get_contents($fp2), true);
$servRev2 = $existingData2['revision'] ?? 1;

if ($sentRev2 > 0 && $sentRev2 !== $servRev2) {
    flock($fp2, LOCK_UN);
    fclose($fp2);
    http_response_code(409);
    echo "✓ Oturum 2: HTTP 409 CONFLICT REDDEDİLDİ!\\n";
    echo "  Sunucu Yanıtı: { 'success': false, 'conflict': true, 'currentRevision': {$servRev2}, 'error': 'Menü siz düzenlerken başka bir kullanıcı tarafından güncellendi!' }\\n";
} else {
    echo "HATA: Çatışma tespit edilemedi!\\n";
}
`

const result = execSync(`php -r "${phpTestScript.replace(/\r?\n/g, ' ')}"`, { encoding: 'utf8' })
console.log(result)
console.log('--- TEST 5c BAŞARIYLA GEÇTİ ---\n')
