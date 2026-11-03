<?php
/**
 * Taş Fırın Lovemacun — Terminal Şifre Sıfırlama Aracı (Sadece CLI)
 *
 * Kullanım:
 *   php scripts/reset-password.php <yeni_sifre> [kullanici_adi]
 *
 * Örnek:
 *   php scripts/reset-password.php YeniGucluSifre123! admin
 */

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('Bu betik yalnızca terminalden (CLI) çalıştırılabilir.');
}

require_once __DIR__ . '/../public/yonetim/auth.php';

$newPassword = $argv[1] ?? '';
$username    = strtolower(trim($argv[2] ?? 'admin'));

if ($newPassword === '' || strlen($newPassword) < 8) {
    fwrite(STDERR, "Kullanım: php scripts/reset-password.php <yeni_sifre> [kullanici_adi]\n");
    fwrite(STDERR, "Hata: Yeni şifre en az 8 karakter olmalıdır.\n");
    exit(1);
}

$hash  = password_hash($newPassword, get_password_hash_algo());
$users = get_users();
$found = false;

foreach ($users as &$u) {
    if (strtolower($u['username'] ?? '') === $username) {
        $u['password']   = $hash;
        $u['active']     = true;
        $u['updated_at'] = date('Y-m-d H:i:s');
        $found           = true;
        break;
    }
}
unset($u);

if (!$found) {
    $users[] = [
        'id'         => uniqid('u_'),
        'username'   => $username,
        'name'       => 'Yönetici',
        'password'   => $hash,
        'role'       => 'yonetici',
        'active'     => true,
        'created_at' => date('Y-m-d H:i:s'),
    ];
}

if (!save_users($users)) {
    fwrite(STDERR, "Hata: Kullanıcı dosyası yazılamadı (" . USERS_FILE . ").\n");
    exit(1);
}

// Kurulum kilidi yoksa oluştur
if (!file_exists(LOCK_FILE)) {
    @file_put_contents(LOCK_FILE, date('c'));
}

// Başarısız giriş kilidini (rate limit) temizle
clear_login_failures($username);

echo "✓ '{$username}' kullanıcısının şifresi başarıyla güncellendi!\n";
echo "  Kullanıcı dosyası : " . USERS_FILE . "\n";
echo "  Giriş kilidi      : Temizlendi\n";
