<?php
require_once __DIR__ . '/auth.php';

$error = '';
$success = false;

if (is_installed()) {
    $alreadyInstalled = true;
} else {
    $alreadyInstalled = false;

    // Kurulum anahtarı hash dosyasını kontrol et (install_hash.php veya setup_key.php)
    if (!file_exists(SETUP_KEY_FILE)) {
        $error = 'Sunucuda kurulum anahtar dosyası (install_hash.php) bulunamadı. Lütfen yayın paketini yeniden yükleyin.';
    } else {
        require_once SETUP_KEY_FILE;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($error)) {
        $token = $_POST['csrf_token'] ?? '';
        if (!verify_csrf_token($token)) {
            $error = 'Güvenlik doğrulaması (CSRF) geçersiz. Sayfayı yenileyip tekrar deneyin.';
        } else {
            $enteredKey = trim($_POST['setup_key'] ?? '');
            $username = trim($_POST['username'] ?? '');
            $pass = $_POST['password'] ?? '';
            $passConfirm = $_POST['password_confirm'] ?? '';

            // Kurulum anahtarı doğrulama (SHA-256)
            $enteredHash = hash('sha256', $enteredKey);
            if (!defined('SETUP_KEY_HASH') || !hash_equals(SETUP_KEY_HASH, $enteredHash)) {
                $error = 'Girdiğiniz Kurulum Anahtarı geçersiz veya hatalı!';
            } elseif (strlen($username) < 3 || !preg_match('/^[a-zA-Z0-9_.-]+$/', $username)) {
                $error = 'Kullanıcı adı en az 3 karakter olmalı ve yalnızca harf, rakam, alt çizgi içerebilir.';
            } elseif (strlen($pass) < 12) {
                $error = 'Şifre en az 12 karakter uzunluğunda olmalıdır.';
            } elseif ($pass !== $passConfirm) {
                $error = 'Girdiğiniz şifreler birbiriyle eşleşmiyor.';
            } else {
                $algo = get_password_hash_algo();
                $hash = password_hash($pass, $algo);

                $initialUsers = [
                    [
                        'id' => 1,
                        'username' => $username,
                        'name' => 'Sistem Yöneticisi',
                        'password' => $hash,
                        'password_hash' => $hash,
                        'role' => 'yonetici',
                        'active' => true,
                        'created_at' => date('Y-m-d H:i:s'),
                        'last_login' => null
                    ]
                ];

                if (save_users($initialUsers)) {
                    // Kurulum kilitlerini yaz
                    $lockContent = "Kurulum Tarihi: " . date('Y-m-d H:i:s') . "\nİlk Yönetici: " . $username . "\nIP: " . get_client_ip() . "\n";
                    @file_put_contents(LOCK_FILE, $lockContent, LOCK_EX);
                    @file_put_contents(__DIR__ . '/setup.lock', $lockContent, LOCK_EX);
                    @file_put_contents(__DIR__ . '/kurulum.lock', $lockContent, LOCK_EX);
                    
                    // Tek kullanımlık kurulum anahtarını sunucudan imha et
                    if (defined('SETUP_KEY_FILE') && file_exists(SETUP_KEY_FILE)) {
                        @unlink(SETUP_KEY_FILE);
                    }
                    @unlink(__DIR__ . '/install_hash.php');
                    @unlink(__DIR__ . '/setup_key.php');

                    write_audit_log("Sistem ilk kurulumu tamamlandı. Yönetici hesabı oluşturuldu.", $username, 'yonetici');
                    $success = true;
                } else {
                    $error = 'Kullanıcı veritabanı (users.json) yazılamadı. Klasör izinlerini kontrol edin.';
                }
            }
        }
    }
}
$csrfToken = get_csrf_token();
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistem Kurulumu | <?= htmlspecialchars(BRAND_NAME) ?></title>
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
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            background-color: var(--bg-body);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            width: 100%;
            max-width: 480px;
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: 16px;
            padding: 36px 32px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        .logo-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 24px;
        }
        .logo-img {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            object-fit: contain;
        }
        h1 {
            font-size: 20px;
            font-weight: 800;
            color: #fff;
            text-align: center;
            margin-bottom: 8px;
        }
        .subtitle {
            font-size: 13px;
            color: var(--text-secondary);
            text-align: center;
            margin-bottom: 24px;
            line-height: 1.5;
        }
        .alert {
            padding: 13px 16px;
            border-radius: 10px;
            font-size: 14px;
            line-height: 1.4;
            margin-bottom: 20px;
        }
        .alert-danger { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }
        .alert-success { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: #6ee7b7; }
        .alert-info { background: rgba(255, 107, 0, 0.08); border: 1px solid rgba(255, 107, 0, 0.25); color: #fed7aa; }
        .form-group { margin-bottom: 18px; }
        label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 12px 14px;
            background: #0d0f12;
            border: 1px solid var(--border-card);
            border-radius: 10px;
            color: #fff;
            font-size: 16px; /* Mobil Safari zoom engeli */
            outline: none;
            transition: all 0.2s;
        }
        input:focus { border-color: var(--accent-orange); box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.15); }
        .key-input { font-family: monospace; letter-spacing: 1px; }
        .hint-warning {
            display: block;
            font-size: 12px;
            color: #f59e0b;
            margin-top: 5px;
            line-height: 1.4;
        }
        .btn-submit {
            width: 100%;
            padding: 14px;
            background: var(--accent-orange);
            border: none;
            border-radius: 10px;
            color: #fff;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.2s;
            margin-top: 10px;
            text-decoration: none;
            display: inline-block;
            text-align: center;
        }
        .btn-submit:hover { background: var(--accent-hover); }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-wrap">
            <img src="<?= htmlspecialchars(BRAND_LOGO) ?>" alt="Logo" class="logo-img" onerror="this.style.display='none'">
            <h2 style="font-size: 18px; font-weight: 800; letter-spacing: -0.5px;"><?= htmlspecialchars(BRAND_NAME) ?></h2>
        </div>

        <?php if ($alreadyInstalled): ?>
            <h1>Kurulum Zaten Tamamlanmış</h1>
            <p class="subtitle">Yönetici hesabı ve güvenlik kilitleri yapılandırılmıştır.</p>
            <div class="alert alert-info">
                Güvenlik amacıyla kurulum sayfası kilitlenmiştir. Yeniden kurulum yapmak gerekirse sunucu üzerinden <code>setup.lock</code> ve <code>users.json</code> dosyalarını siliniz.
            </div>
            <a href="/yonetim/login.php" class="btn-submit">Yönetici Girişine Git &rarr;</a>
        <?php elseif ($success): ?>
            <h1>Kurulum Başarılı! 🎉</h1>
            <p class="subtitle">İlk yönetici hesabı oluşturuldu ve kurulum anahtarı imha edildi.</p>
            <div class="alert alert-success">
                Sistem kullanıma hazırdır. Belirlediğiniz kullanıcı adı ve şifre ile giriş yapabilirsiniz.
            </div>
            <a href="/yonetim/login.php" class="btn-submit">Şimdi Giriş Yap &rarr;</a>
        <?php else: ?>
            <h1>İlk Yönetici Kurulumu</h1>
            <p class="subtitle">Sistemi başlatmak için tek kullanımlık kurulum anahtarınızı ve yönetici bilgilerinizi giriniz.</p>

            <?php if (!empty($error)): ?>
                <div class="alert alert-danger"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
            <?php endif; ?>

            <form method="POST" action="/yonetim/setup.php">
                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
                
                <div class="form-group">
                    <label for="setup_key">Tek Kullanımlık Kurulum Anahtarı *</label>
                    <input type="text" id="setup_key" name="setup_key" required class="key-input" placeholder="LM-XXXX-XXXX-XXXX-XXXX" autocomplete="off" autofocus>
                    <span style="font-size: 11px; color: #64748b; margin-top: 4px; display: block;">Dağıtım paketi ile birlikte üretilen KURULUM-ANAHTARI dosyasından temin edin.</span>
                </div>

                <div class="form-group">
                    <label for="username">Yönetici Kullanıcı Adı *</label>
                    <input type="text" id="username" name="username" value="" required autocomplete="username" placeholder="Örn: isletmeci_ali">
                    <span class="hint-warning">⚠️ "admin", "yonetici", "root" gibi tahmin edilebilir adlardan kaçının.</span>
                </div>

                <div class="form-group">
                    <label for="password">Yönetici Şifresi (En az 12 karakter) *</label>
                    <input type="password" id="password" name="password" required minlength="12" autocomplete="new-password" placeholder="En az 12 karakter güçlü şifre">
                </div>

                <div class="form-group">
                    <label for="password_confirm">Şifreyi Onaylayın *</label>
                    <input type="password" id="password_confirm" name="password_confirm" required minlength="12" autocomplete="new-password" placeholder="Şifrenizi tekrar girin">
                </div>

                <button type="submit" class="btn-submit">Kurulumu Tamamla ve Kilitle &rarr;</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
