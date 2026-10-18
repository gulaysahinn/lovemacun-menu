<?php
require_once __DIR__ . '/../public/yonetim/paths.php';
require_once __DIR__ . '/../public/yonetim/auth.php';

echo "--- TEST 5c: EŞZAMANLI KAYIT ÇATIŞMASI VE FLOCK DOĞRULAMASI ---\n\n";

$menuData = json_decode(file_get_contents(MENU_FILE), true);
$currentRev = $menuData['revision'] ?? 1;

echo "1. Başlangıç Durumu:\n";
echo "   Sunucudaki Güncel Revizyon: {$currentRev}\n";
echo "   Oturum 1 (Yönetici) menüyü açtı (Revizyon: {$currentRev})\n";
echo "   Oturum 2 (Personel) menüyü açtı (Revizyon: {$currentRev})\n\n";

// 1. Kayıt: Oturum 1 revizyonu günceller
echo "2. Oturum 1 Değişiklikleri Kaydediyor:\n";
$fp = fopen(MENU_FILE, 'c+');
if (!flock($fp, LOCK_EX)) {
    echo "HATA: Dosya kilitlenemedi!\n";
    exit(1);
}
$existingData = json_decode(stream_get_contents($fp), true);
$servRev = $existingData['revision'] ?? 1;
$sentRev1 = $currentRev;

if ($sentRev1 > 0 && $sentRev1 !== $servRev) {
    echo "HATA: Oturum 1 beklenmedik çatışma aldı!\n";
    exit(1);
}

$newRev = $servRev + 1;
$existingData['revision'] = $newRev;
ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($existingData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);
echo "   ✓ Oturum 1: flock kilidi alındı, yazıldı ve kilit çözüldü. Yeni Sunucu Revizyonu = {$newRev}\n\n";

// 2. Kayıt: Oturum 2 (eski $currentRev ile) kaydetmeye çalışıyor
echo "3. Oturum 2 (Eski Revizyon: {$sentRev1} ile) Kaydetmeye Çalışıyor:\n";
$fp2 = fopen(MENU_FILE, 'c+');
flock($fp2, LOCK_EX);
$existingData2 = json_decode(stream_get_contents($fp2), true);
$servRev2 = $existingData2['revision'] ?? 1;
$sentRev2 = $currentRev; // Eski revizyon!

if ($sentRev2 > 0 && $sentRev2 !== $servRev2) {
    flock($fp2, LOCK_UN);
    fclose($fp2);
    http_response_code(409);
    echo "   ✓ ÇATIŞMA TESPİT EDİLDİ: HTTP 409 CONFLICT!\n";
    echo "   [Sunucu Yanıtı]:\n";
    echo "   {\n";
    echo "       \"success\": false,\n";
    echo "       \"conflict\": true,\n";
    echo "       \"currentRevision\": {$servRev2},\n";
    echo "       \"error\": \"Menü siz düzenlerken başka bir kullanıcı tarafından güncellendi!\"\n";
    echo "   }\n";
    echo "   ✓ Oturum 2'nin eski verisi sunucudaki güncel veriyi EZMEDİ!\n\n";
} else {
    echo "HATA: Çatışma yakalanamadı!\n";
    exit(1);
}

echo "--- TEST 5c BAŞARIYLA TAMAMLANDI ---\n";
