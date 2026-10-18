<?php
/**
 * Taş Fırın Lovemacun - Merkezi Dosya ve Dizin Yapılandırması (paths.php)
 * Tüm yol ayarları ve ortam değişkenleri bu dosyada yönetilir.
 */

if (!defined('AUTH_INCLUDED') && !defined('PATHS_INCLUDED')) {
    define('PATHS_INCLUDED', true);
}

// 1. Marka Yapılandırması (Sabit kodlama yerine konfigürasyondan okunur)
if (!defined('BRAND_NAME')) define('BRAND_NAME', 'Taş Fırın Lovemacun');
if (!defined('BRAND_SLOGAN')) define('BRAND_SLOGAN', 'Büyükada Taş Fırın & Kebap Lezzetleri');
if (!defined('BRAND_LOGO')) define('BRAND_LOGO', '/logo-badge.png');

// 2. Güvenlik ve Hata Kayıt Ayarları (display_errors kapalı, log_errors açık)
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('session.use_strict_mode', '1');
if (function_exists('header_remove')) {
    @header_remove('X-Powered-By');
}

// 3. Veri Konumu: Varsayılan olarak public_html DIŞINDA tasfirin-data/
// cPanel hiyerarşisi: /home/username/public_html/yonetim -> dirname(__DIR__, 2) = /home/username
$candidateExternalDir = dirname(__DIR__, 2) . '/tasfirin-data';
$isExternalStorage = false;
$activeStorageDir = '';

// Harici klasör varsa ve yazılabilirse ya da oluşturulabiliyorsa
if (is_dir($candidateExternalDir) && is_writable($candidateExternalDir)) {
    $isExternalStorage = true;
    $activeStorageDir = $candidateExternalDir;
} elseif (!is_dir($candidateExternalDir) && @mkdir($candidateExternalDir, 0755, true) && is_writable($candidateExternalDir)) {
    $isExternalStorage = true;
    $activeStorageDir = $candidateExternalDir;
}

if ($isExternalStorage) {
    define('IS_EXTERNAL_STORAGE', true);
    define('STORAGE_DIR', $activeStorageDir);
    define('USERS_FILE', STORAGE_DIR . '/users.json');
    define('CONFIG_FILE', STORAGE_DIR . '/config.php');
    define('BACKUPS_DIR', STORAGE_DIR . '/backups');
    define('LOGS_DIR', STORAGE_DIR . '/logs');
} else {
    // Web dizini içindeki korumalı fallback
    define('IS_EXTERNAL_STORAGE', false);
    define('STORAGE_DIR', __DIR__);
    define('USERS_FILE', __DIR__ . '/users.json');
    define('CONFIG_FILE', __DIR__ . '/config.php');
    define('BACKUPS_DIR', dirname(__DIR__) . '/backups');
    define('LOGS_DIR', dirname(__DIR__) . '/logs');
}

// Gerekli klasörleri oluştur
if (!is_dir(BACKUPS_DIR)) @mkdir(BACKUPS_DIR, 0755, true);
if (!is_dir(LOGS_DIR)) @mkdir(LOGS_DIR, 0755, true);

// PHP Hata Log Dosyası
ini_set('error_log', LOGS_DIR . '/php-error.log');

// Menü ve Seed Dosyaları (Ziyaretçiler webden okuduğu için public/data içinde kalır)
define('MENU_DIR', dirname(__DIR__) . '/data');
define('MENU_FILE', MENU_DIR . '/menu.json');
define('MENU_SEED_FILE', MENU_DIR . '/menu.seed.json');

// Kilit ve Kurulum Dosyaları
define('LOCK_FILE', __DIR__ . '/setup.lock');
define('SETUP_KEY_FILE', file_exists(__DIR__ . '/install_hash.php') ? (__DIR__ . '/install_hash.php') : (__DIR__ . '/setup_key.php'));
define('UPLOADS_DIR', dirname(__DIR__) . '/img/uploads');
if (!is_dir(UPLOADS_DIR)) @mkdir(UPLOADS_DIR, 0755, true);

// Menü İlk Başlatma: Canlı menü yoksa seed'den otomatik oluştur, varsa asla ezme!
function ensure_menu_initialized() {
    if (!file_exists(MENU_FILE)) {
        if (!is_dir(MENU_DIR)) {
            @mkdir(MENU_DIR, 0755, true);
        }
        if (file_exists(MENU_SEED_FILE)) {
            @copy(MENU_SEED_FILE, MENU_FILE);
            @chmod(MENU_FILE, 0644);
        }
    }
}
ensure_menu_initialized();
