<?php
require_once __DIR__ . '/auth.php';
require_role('yonetici'); // Sadece yönetici yetkisi

$checks = [];

// 1. PHP Sürümü
$phpVer = PHP_VERSION;
$phpOk = version_compare($phpVer, '7.4.0', '>=');
$checks[] = [
    'title' => 'PHP Sürümü',
    'value' => 'PHP ' . $phpVer,
    'status' => $phpOk ? 'ok' : 'error',
    'desc' => 'En az PHP 7.4 veya üstü (Önerilen: PHP 8.1 / 8.2) gereklidir.',
    'fix' => 'cPanel > "Select PHP Version" veya "MultiPHP Manager" alanından PHP sürümünüzü 8.1 veya 8.2 olarak ayarlayın.'
];

// 2. GD Kütüphanesi & WebP Desteği
$gdLoaded = extension_loaded('gd');
$webpSupported = function_exists('imagewebp');
$checks[] = [
    'title' => 'GD Kütüphanesi & WebP',
    'value' => ($gdLoaded ? 'GD Aktif' : 'GD Eksik') . ' / ' . ($webpSupported ? 'WebP Desteği Var' : 'WebP Desteği Yok'),
    'status' => ($gdLoaded && $webpSupported) ? 'ok' : 'error',
    'desc' => 'Yüklenen ürün fotoğraflarını otomatik kare kırpmak ve WebP formatına çevirmek için gereklidir.',
    'fix' => 'cPanel > "Select PHP Version" > Extensions sekmesinden "gd" kutucuğunu işaretleyin.'
];

// 3. Fileinfo Eklentisi
$fileinfoLoaded = class_exists('finfo');
$checks[] = [
    'title' => 'Fileinfo (MIME Tespiti)',
    'value' => $fileinfoLoaded ? 'Yüklü ve Aktif' : 'Yüklü Değil',
    'status' => $fileinfoLoaded ? 'ok' : 'error',
    'desc' => 'Yüklenen dosyaların gerçek içerik türünü (MIME) tespit ederek zararlı betikleri engeller.',
    'fix' => 'cPanel > "Select PHP Version" > Extensions sekmesinden "fileinfo" kutucuğunu aktif edin.'
];

// 4. upload_max_filesize & post_max_size
$uploadMax = ini_get('upload_max_filesize');
$postMax = ini_get('post_max_size');
function parse_size($size) {
    $unit = preg_replace('/[^bkmgtpezy]/i', '', $size);
    $size = preg_replace('/[^0-9\.]/', '', $size);
    if ($unit) {
        return round($size * pow(1024, stripos('bkmgtpezy', $unit[0])));
    }
    return round($size);
}
$uploadBytes = parse_size($uploadMax);
$limitsOk = $uploadBytes >= (4 * 1024 * 1024);
$checks[] = [
    'title' => 'Dosya Yükleme Limitleri',
    'value' => "upload_max_filesize: {$uploadMax} | post_max_size: {$postMax}",
    'status' => $limitsOk ? 'ok' : 'warning',
    'desc' => 'Ürün fotoğraflarının rahat yüklenebilmesi için en az 8 MB önerilir.',
    'fix' => 'cPanel > "MultiPHP INI Editor" alanından upload_max_filesize = 16M ve post_max_size = 16M olarak güncelleyin.'
];

// 5. Veri Depolama Konumu (tasfirin-data/)
$checks[] = [
    'title' => 'Veri Güvenlik Konumu',
    'value' => IS_EXTERNAL_STORAGE ? 'Güvenli (public_html Dışında: tasfirin-data/)' : 'Dahili Depolama (Web Dizini İçi)',
    'status' => IS_EXTERNAL_STORAGE ? 'ok' : 'warning',
    'desc' => 'Kullanıcı şifreleri, yedekler ve logların webden tamamen izole edilmesi için public_html dışında saklanması önerilir.',
    'fix' => 'cPanel File Manager ile public_html ile aynı dizinde "tasfirin-data" adında bir klasör oluşturup izinlerini 755 yapın. Sistem otomatik olarak orayı kullanmaya başlayacaktır.'
];

// 6. Yazılabilir Klasörler
$writableFolders = [
    'Yedekler (BACKUPS_DIR)' => [BACKUPS_DIR, is_writable(BACKUPS_DIR)],
    'Loglar (LOGS_DIR)' => [LOGS_DIR, is_writable(LOGS_DIR)],
    'Fotoğraf Yükleme (UPLOADS_DIR)' => [UPLOADS_DIR, is_writable(UPLOADS_DIR)],
    'Menü Verisi (MENU_DIR)' => [MENU_DIR, is_writable(MENU_DIR)],
];
$allWritable = true;
$details = [];
foreach ($writableFolders as $lbl => $inf) {
    if (!$inf[1]) $allWritable = false;
    $details[] = $lbl . ': ' . ($inf[1] ? 'Yazılabilir' : '<strong style="color:#f87171;">Yazılamaz!</strong>');
}
$checks[] = [
    'title' => 'Klasör Yazma İzinleri (CHMOD)',
    'value' => implode(' | ', $details),
    'status' => $allWritable ? 'ok' : 'error',
    'desc' => 'Yedeklerin, logların ve yeni ürün fotoğraflarının kaydedilebilmesi için gereklidir.',
    'fix' => 'cPanel File Manager ile ilgili klasörlerin izinlerini (Permission) 755 veya 775 olarak ayarlayın.'
];

// 7. HTTPS / SSL Durumu
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
$checks[] = [
    'title' => 'HTTPS / SSL Bağlantısı',
    'value' => $isHttps ? 'Güvenli (HTTPS Aktif)' : 'Güvensiz (HTTP)',
    'status' => $isHttps ? 'ok' : ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1' ? 'warning' : 'error'),
    'desc' => 'Yönetici oturum çerezlerinin ve şifrelerin şifreli iletilmesi için canlıda HTTPS zorunludur.',
    'fix' => 'cPanel > "SSL/TLS Status" alanından ücretsiz AutoSSL sertifikanızı aktifleştirin ve .htaccess ile HTTPS yönlendirmesi yapın.'
];

// 8. Session Kayıt Yolu (session.save_path)
$sessPath = session_save_path() ?: sys_get_temp_dir();
$sessOk = is_writable($sessPath);
$checks[] = [
    'title' => 'Oturum Kayıt Yolu (Session)',
    'value' => htmlspecialchars($sessPath) . ' (' . ($sessOk ? 'Yazılabilir' : 'Yazılamaz') . ')',
    'status' => $sessOk ? 'ok' : 'error',
    'desc' => 'Giriş yapan yöneticilerin oturumlarının kaydedilebilmesi için PHP geçici oturum dizininin yazılabilir olması gerekir.',
    'fix' => 'Sunucunuzda session.save_path yazılabilir değilse php.ini içine "session.save_path = /tmp" satırını ekleyin.'
];

// 9. display_errors Durumu
$dispErrors = ini_get('display_errors');
$dispOk = empty($dispErrors) || $dispErrors === '0' || strtolower($dispErrors) === 'off';
$checks[] = [
    'title' => 'display_errors (Hata Gizleme)',
    'value' => $dispOk ? 'Kapalı (Güvenli)' : 'Açık (Güvensiz)',
    'status' => $dispOk ? 'ok' : 'warning',
    'desc' => 'PHP hatalarının web sayfalarında ziyaretçilere açıkça görünmesi güvenlik açığı oluşturur.',
    'fix' => 'php.ini veya cPanel MultiPHP INI Editor üzerinden display_errors = Off yapın.'
];
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistem Sağlık Tanısı | <?= htmlspecialchars(BRAND_NAME) ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-body: #0d0f12;
            --bg-card: #15181d;
            --border-card: #22272e;
            --text-primary: #f0f2f5;
            --text-secondary: #9aa2ad;
            --accent-orange: #ff6b00;
            --accent-hover: #ff7d1a;
            --danger: #ef4444;
            --success: #10b981;
            --warning: #f59e0b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            background-color: var(--bg-body);
            color: var(--text-primary);
            min-height: 100vh;
            padding: 24px 16px;
        }
        .header-bar {
            max-width: 1000px;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
        }
        .header-title { display: flex; align-items: center; gap: 12px; }
        .header-title h1 { font-size: 22px; font-weight: 800; }
        .btn {
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid #333a42;
            background: #22272e;
            color: #fff;
            transition: all 0.2s;
        }
        .btn:hover { background: #2a3038; }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        .check-card {
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: 12px;
            padding: 18px 20px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            transition: border-color 0.2s;
        }
        .check-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
        }
        .check-title { font-size: 16px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; }
        .status-badge {
            font-size: 12px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .status-ok { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); }
        .status-error { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
        .status-warning { background: rgba(245, 158, 11, 0.15); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); }

        .check-val { font-family: monospace; font-size: 13px; color: var(--accent-orange); background: rgba(255, 107, 0, 0.08); padding: 4px 8px; border-radius: 6px; display: inline-block; }
        .check-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.4; }
        .fix-box {
            margin-top: 6px;
            padding: 10px 14px;
            background: rgba(239, 68, 68, 0.08);
            border-left: 3px solid var(--danger);
            border-radius: 6px;
            font-size: 13px;
            color: #fca5a5;
            line-height: 1.4;
        }
        .fix-box.warning-fix {
            background: rgba(245, 158, 11, 0.08);
            border-left-color: var(--warning);
            color: #fcd34d;
        }
    </style>
</head>
<body>
    <div class="header-bar">
        <div class="header-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <div>
                <h1>Sistem Sağlık Tanısı (tani.php)</h1>
                <p style="font-size: 13px; color: var(--text-secondary);">Hosting, PHP, kütüphaneler ve izinlerin anlık sağlık raporu</p>
            </div>
        </div>
        <a href="/yonetim/index.php" class="btn">&larr; Yönetim Paneline Dön</a>
    </div>

    <div class="container">
        <?php foreach ($checks as $c): ?>
            <div class="check-card" style="border-left: 4px solid <?= $c['status'] === 'ok' ? 'var(--success)' : ($c['status'] === 'warning' ? 'var(--warning)' : 'var(--danger)') ?>;">
                <div class="check-header">
                    <div class="check-title">
                        <span><?= $c['status'] === 'ok' ? '✓' : ($c['status'] === 'warning' ? '⚠️' : '✗') ?></span>
                        <?= htmlspecialchars($c['title']) ?>
                    </div>
                    <div>
                        <span class="status-badge status-<?= $c['status'] ?>">
                            <?= $c['status'] === 'ok' ? 'Başarılı' : ($c['status'] === 'warning' ? 'Uyarı / Tavsiye' : 'Kritik Hata') ?>
                        </span>
                    </div>
                </div>

                <div>
                    <span class="check-val"><?= $c['value'] ?></span>
                </div>
                <div class="check-desc"><?= htmlspecialchars($c['desc']) ?></div>

                <?php if ($c['status'] !== 'ok'): ?>
                    <div class="fix-box <?= $c['status'] === 'warning' ? 'warning-fix' : '' ?>">
                        <strong>Nasıl Çözülür?</strong> <?= htmlspecialchars($c['fix']) ?>
                    </div>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
    </div>
</body>
</html>
