<?php
/**
 * CLI Admin Şifre Sıfırlama Aracı
 * Kullanım: php scripts/reset-admin.php
 */

require_once __DIR__ . '/../public/yonetim/paths.php';
require_once __DIR__ . '/../public/yonetim/auth.php';

echo "=============================================\n";
echo "   Taş Fırın Lovemacun - Şifre Sıfırlama     \n";
echo "=============================================\n\n";

$users = get_users();
if (empty($users)) {
    echo "HATA: users.json bulunamadı veya kullanıcı kaydı yok.\n";
    exit(1);
}

echo "Mevcut Kullanıcılar:\n";
foreach ($users as $idx => $u) {
    echo " [" . ($idx + 1) . "] " . $u['username'] . " (Rol: " . $u['role'] . ")\n";
}
echo "\n";

$targetUsername = 'admin';
if (isset($argv[1])) {
    $targetUsername = trim($argv[1]);
}

$target = find_user_by_username($targetUsername);
if (!$target) {
    echo "HATA: '{$targetUsername}' kullanıcısı bulunamadı.\n";
    exit(1);
}

// Şifre al
if (isset($argv[2])) {
    $newPass = $argv[2];
} else {
    echo "'{$targetUsername}' için yeni şifreyi girin (min 8 karakter): ";
    $newPass = trim(fgets(STDIN));
}

if (strlen($newPass) < 8) {
    echo "HATA: Şifre en az 8 karakter olmalıdır!\n";
    exit(1);
}

$algo = get_password_hash_algo();
$newHash = password_hash($newPass, $algo);

$updated = false;
foreach ($users as &$u) {
    if (mb_strtolower($u['username'], 'UTF-8') === mb_strtolower($targetUsername, 'UTF-8')) {
        $u['password'] = $newHash;
        $u['password_hash'] = $newHash;
        $u['active'] = true;
        $updated = true;
        break;
    }
}
unset($u);

if ($updated && save_users($users)) {
    clear_login_failures($targetUsername);
    $rateLimitFile = LOGS_DIR . '/rate_limits.json';
    if (file_exists($rateLimitFile)) {
        @unlink($rateLimitFile);
    }
    write_audit_log("CLI üzerinden '{$targetUsername}' kullanıcısının şifresi sıfırlandı.");
    echo "\n✓ BAŞARILI: '{$targetUsername}' şifresi güncellendi!\n";
    echo "Artık yeni şifrenizle http://localhost:5175/yonetim/login.php adresinden giriş yapabilirsiniz.\n";
    exit(0);
} else {
    echo "\nHATA: Şifre kaydedilemedi!\n";
    exit(1);
}
