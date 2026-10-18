<?php
/**
 * Taş Fırın Lovemacun - Kimlik Doğrulama ve Güvenlik Çekirdeği (auth.php)
 */

define('AUTH_INCLUDED', true);
require_once __DIR__ . '/paths.php';

// Güvenlik Başlıkları
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header("Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self';");
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

// Session Güvenlik Yapılandırması
if (session_status() === PHP_SESSION_NONE) {
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    session_start();
}

// 30 Dakikalık Hareketsizlik Zaman Aşımı
$idleTimeout = 1800;
if (!empty($_SESSION['auth_logged_in']) && $_SESSION['auth_logged_in'] === true) {
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $idleTimeout)) {
        session_unset();
        session_destroy();
        if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Oturum süresi doldu. Lütfen tekrar giriş yapın.']);
            exit;
        }
        header('Location: /yonetim/login.php?timeout=1');
        exit;
    }
    $_SESSION['last_activity'] = time();
}

// İstemci IP Adresi
function get_client_ip() {
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

// CSRF Token
function get_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf_token($token) {
    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

// Hash Algoritması Seçimi (Öncelik: ARGON2ID, Yoksa: BCRYPT)
function get_password_hash_algo() {
    if (defined('PASSWORD_ARGON2ID')) {
        return PASSWORD_ARGON2ID;
    }
    return PASSWORD_DEFAULT;
}

// Kullanıcı Veritabanı (users.json) İşlemleri
function get_users() {
    $file = USERS_FILE;
    if (!file_exists($file)) {
        return [];
    }
    $content = @file_get_contents($file);
    if (!$content) return [];
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function save_users($users) {
    $file = USERS_FILE;
    $dir = dirname($file);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }

    $tmp = tempnam($dir, 'usr_');
    $json = json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
    // flock ile kilitli yazma
    $fp = fopen($tmp, 'w');
    if ($fp) {
        if (flock($fp, LOCK_EX)) {
            fwrite($fp, $json);
            fflush($fp);
            flock($fp, LOCK_UN);
        }
        fclose($fp);
        @chmod($tmp, 0600);
        if (@rename($tmp, $file)) {
            @chmod($file, 0600);
            return true;
        }
    }
    @unlink($tmp);
    return false;
}

function find_user_by_username($username) {
    $uname = mb_strtolower(trim($username), 'UTF-8');
    $users = get_users();
    foreach ($users as $u) {
        if (mb_strtolower($u['username'], 'UTF-8') === $uname) {
            return $u;
        }
    }
    return null;
}

// En az 1 aktif yönetici kalması kuralı kontrolü
function count_active_yoneticiler($excludeUsername = null) {
    $users = get_users();
    $count = 0;
    $exc = $excludeUsername ? mb_strtolower(trim($excludeUsername), 'UTF-8') : '';
    foreach ($users as $u) {
        if ($exc && mb_strtolower($u['username'], 'UTF-8') === $exc) {
            continue;
        }
        if (($u['role'] ?? '') === 'yonetici' && !empty($u['active'])) {
            $count++;
        }
    }
    return $count;
}

// Çift Katmanlı Hız Sınırı (Rate Limiting)
// IP başına 5 hatalı deneme / 15 dk VE Kullanıcı adı başına 10 hatalı deneme / 15 dk
function check_login_rate_limit($username = null) {
    $ip = get_client_ip();
    $rateLimitFile = LOGS_DIR . '/rate_limits.json';
    $now = time();
    $window = 15 * 60; // 15 dakika

    $data = ['ips' => [], 'users' => []];
    if (file_exists($rateLimitFile)) {
        $json = @file_get_contents($rateLimitFile);
        $data = json_decode($json, true) ?: ['ips' => [], 'users' => []];
    }

    // IP kontrolü (max 5)
    $ipAttempts = array_filter($data['ips'][$ip] ?? [], function($ts) use ($now, $window) {
        return ($now - $ts) < $window;
    });
    if (count($ipAttempts) >= 5) {
        return ['allowed' => false, 'reason' => 'ip'];
    }

    // Kullanıcı adı kontrolü (max 10)
    if ($username) {
        $uKey = mb_strtolower(trim($username), 'UTF-8');
        $userAttempts = array_filter($data['users'][$uKey] ?? [], function($ts) use ($now, $window) {
            return ($now - $ts) < $window;
        });
        if (count($userAttempts) >= 10) {
            return ['allowed' => false, 'reason' => 'user'];
        }
    }

    return ['allowed' => true];
}

function record_login_failure($username = null) {
    $ip = get_client_ip();
    $rateLimitFile = LOGS_DIR . '/rate_limits.json';
    $now = time();

    $data = ['ips' => [], 'users' => []];
    if (file_exists($rateLimitFile)) {
        $json = @file_get_contents($rateLimitFile);
        $data = json_decode($json, true) ?: ['ips' => [], 'users' => []];
    }

    if (!isset($data['ips'][$ip])) $data['ips'][$ip] = [];
    $data['ips'][$ip][] = $now;

    if ($username) {
        $uKey = mb_strtolower(trim($username), 'UTF-8');
        if (!isset($data['users'][$uKey])) $data['users'][$uKey] = [];
        $data['users'][$uKey][] = $now;
    }

    @file_put_contents($rateLimitFile, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
}

function clear_login_failures($username = null) {
    $ip = get_client_ip();
    $rateLimitFile = LOGS_DIR . '/rate_limits.json';
    if (!file_exists($rateLimitFile)) return;

    $json = @file_get_contents($rateLimitFile);
    $data = json_decode($json, true) ?: ['ips' => [], 'users' => []];

    if (isset($data['ips'][$ip])) unset($data['ips'][$ip]);
    if ($username) {
        $uKey = mb_strtolower(trim($username), 'UTF-8');
        if (isset($data['users'][$uKey])) unset($data['users'][$uKey]);
    }

    @file_put_contents($rateLimitFile, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
}

// Denetim İzi (Audit Log): Her satırda kullanıcı adı ve IP
function write_audit_log($action, $username = null, $role = null) {
    $ip = get_client_ip();
    $u = $username ?: ($_SESSION['auth_user'] ?? 'Sistem');
    $r = $role ?: ($_SESSION['auth_role'] ?? 'bilinmiyor');
    $logLine = date('[Y-m-d H:i:s]') . " [IP: {$ip}] [Kullanıcı: {$u} ({$r})] {$action}\n";
    $logFile = LOGS_DIR . '/degisiklik.log';
    @file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
}

// Kurulum Tamamlandı mı?
function is_installed() {
    $lock1 = defined('LOCK_FILE') ? LOCK_FILE : (__DIR__ . '/setup.lock');
    $lock2 = __DIR__ . '/kurulum.lock';
    return (file_exists($lock1) || file_exists($lock2)) && count(get_users()) > 0;
}

// Oturum ve Rol Doğrulama
function get_current_user_info() {
    if (empty($_SESSION['auth_logged_in']) || $_SESSION['auth_logged_in'] !== true) {
        return null;
    }
    return [
        'username' => $_SESSION['auth_user'] ?? '',
        'role' => $_SESSION['auth_role'] ?? 'personel'
    ];
}

function require_login($isApi = false) {
    if (!is_installed()) {
        if ($isApi) {
            http_response_code(503);
            echo json_encode(['success' => false, 'error' => 'Sistem henüz kurulmadı.']);
            exit;
        }
        header('Location: /yonetim/setup.php');
        exit;
    }

    if (empty($_SESSION['auth_logged_in']) || $_SESSION['auth_logged_in'] !== true) {
        if ($isApi) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Yetkisiz erişim. Oturum açmalısınız.']);
            exit;
        }
        header('Location: /yonetim/login.php');
        exit;
    }
}

function require_role($requiredRole = 'yonetici', $isApi = false) {
    require_login($isApi);
    $user = get_current_user_info();
    if (!$user || $user['role'] !== $requiredRole) {
        if ($isApi) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Bu işlem için yetkiniz bulunmuyor (Yönetici yetkisi gereklidir).']);
            exit;
        }
        http_response_code(403);
        echo "<!DOCTYPE html><html lang='tr'><head><meta charset='utf-8'><title>Erişim Engellendi</title><style>body{background:#0d0f12;color:#fff;font-family:sans-serif;padding:50px;text-align:center;}a{color:#ff6b00;}</style></head><body><h1>403 - Yetkisiz İşlem</h1><p>Bu sayfaya erişmek için yönetici yetkisi gerekmektedir.</p><a href='/yonetim/'>Panele Dön &rarr;</a></body></html>";
        exit;
    }
}
