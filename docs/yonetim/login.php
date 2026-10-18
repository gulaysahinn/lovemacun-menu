<?php
require_once __DIR__ . '/auth.php';

// Kurulum kontrolü
if (!is_installed()) {
    header('Location: /yonetim/setup.php');
    exit;
}

// Oturum zaten açıksa doğrudan panele yönlendir
if (!empty($_SESSION['auth_logged_in']) && $_SESSION['auth_logged_in'] === true) {
    header('Location: /yonetim/index.php');
    exit;
}

$error = '';
$rateLimitStatus = check_login_rate_limit();
$isRateLimited = !$rateLimitStatus['allowed'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $token = $_POST['csrf_token'] ?? '';

    // Kullanıcı bazlı ve IP bazlı hız sınırı kontrolü
    $rateLimitCheck = check_login_rate_limit($username);
    if (!$rateLimitCheck['allowed']) {
        $error = 'Çok fazla başarısız deneme yapıldı. Güvenliğiniz için giriş 15 dakika boyunca kilitlenmiştir.';
    } elseif (!verify_csrf_token($token)) {
        $error = 'Güvenlik doğrulaması (CSRF) geçersiz. Sayfayı yenileyip tekrar deneyin.';
    } else {
        $user = find_user_by_username($username);

        $userHash = $user['password'] ?? '';
        $userAltHash = $user['password_hash'] ?? '';
        $isPasswordValid = ($userHash && password_verify($password, $userHash)) || ($userAltHash && password_verify($password, $userAltHash));

        // Kullanıcı var mı, aktif mi ve şifre doğru mu?
        if ($user && !empty($user['active']) && $isPasswordValid) {
            // Başarılı giriş
            clear_login_failures($username);
            session_regenerate_id(true);

            $_SESSION['auth_logged_in'] = true;
            $_SESSION['auth_user'] = $user['username'];
            $_SESSION['auth_role'] = $user['role'] ?? 'personel';
            $_SESSION['auth_name'] = $user['name'] ?? $user['username'];
            $_SESSION['last_activity'] = time();

            // Son giriş zamanını kaydet
            $users = get_users();
            foreach ($users as &$u) {
                if (mb_strtolower($u['username'], 'UTF-8') === mb_strtolower($user['username'], 'UTF-8')) {
                    $u['last_login'] = date('Y-m-d H:i:s');
                    break;
                }
            }
            save_users($users);

            write_audit_log("Sisteme başarılı giriş yaptı.", $user['username'], $user['role']);
            header('Location: /yonetim/index.php');
            exit;
        } else {
            // Başarısız deneme (Kullanıcı adı veya şifre hatalı ifşa edilmez)
            record_login_failure($username);
            $error = 'Kullanıcı adı veya şifre hatalı.';
        }
    }
}

$csrfToken = get_csrf_token();
$timeoutNotice = isset($_GET['timeout']) && $_GET['timeout'] == '1';
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yönetici Girişi | <?= htmlspecialchars(BRAND_NAME) ?></title>
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
            --warning: #f59e0b;
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
            max-width: 420px;
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
            margin-bottom: 6px;
        }
        .subtitle {
            font-size: 13px;
            color: var(--text-secondary);
            text-align: center;
            margin-bottom: 24px;
        }
        .alert {
            padding: 13px 16px;
            border-radius: 10px;
            font-size: 14px;
            line-height: 1.4;
            margin-bottom: 20px;
        }
        .alert-danger { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }
        .alert-warning { background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); color: #fcd34d; }
        .form-group { margin-bottom: 18px; }
        label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
        .input-wrap {
            position: relative;
            display: flex;
            align-items: center;
        }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 13px 14px;
            background: #0d0f12;
            border: 1px solid var(--border-card);
            border-radius: 10px;
            color: #fff;
            font-size: 16px; /* Mobil Safari otomatik zoom engeli */
            outline: none;
            transition: all 0.2s;
        }
        input:focus { border-color: var(--accent-orange); box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.15); }
        .btn-toggle-pass {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
        }
        .btn-toggle-pass:hover { color: #fff; }
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
            margin-top: 8px;
        }
        .btn-submit:hover:not(:disabled) { background: var(--accent-hover); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .back-link {
            display: block;
            text-align: center;
            margin-top: 20px;
            font-size: 13px;
            color: var(--text-secondary);
            text-decoration: none;
        }
        .back-link:hover { color: var(--accent-orange); }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-wrap">
            <img src="<?= htmlspecialchars(BRAND_LOGO) ?>" alt="Logo" class="logo-img" onerror="this.style.display='none'">
            <h2 style="font-size: 18px; font-weight: 800; letter-spacing: -0.5px;"><?= htmlspecialchars(BRAND_NAME) ?></h2>
        </div>

        <h1>Yönetim Girişi</h1>
        <p class="subtitle">Menü ve ürün yönetimi için giriş yapın</p>

        <?php if ($timeoutNotice): ?>
            <div class="alert alert-warning">
                Hareketsizlik nedeniyle oturumunuz sonlandı. Lütfen tekrar giriş yapın.
            </div>
        <?php endif; ?>

        <?php if (!empty($error)): ?>
            <div class="alert alert-danger" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>

        <form method="POST" action="/yonetim/login.php">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
            
            <div class="form-group">
                <label for="username">Kullanıcı Adı</label>
                <input type="text" id="username" name="username" required autocomplete="username" autofocus placeholder="Kullanıcı adınızı girin" value="<?= htmlspecialchars($_POST['username'] ?? '', ENT_QUOTES) ?>">
            </div>

            <div class="form-group">
                <label for="password">Şifre</label>
                <div class="input-wrap">
                    <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="Şifrenizi girin">
                    <button type="button" class="btn-toggle-pass" onclick="togglePasswordVisibility()" aria-label="Şifreyi Göster/Gizle" title="Şifreyi Göster/Gizle">
                        <svg id="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                </div>
            </div>

            <button type="submit" class="btn-submit" <?= $isRateLimited ? 'disabled' : '' ?>>
                <?= $isRateLimited ? 'Giriş Kilitlendi (15 Dk)' : 'Güvenli Giriş Yap &rarr;' ?>
            </button>
        </form>

        <a href="/" class="back-link">&larr; Menü Sayfasına Dön</a>
    </div>

    <script>
        function togglePasswordVisibility() {
            const passInput = document.getElementById('password');
            const eyeIcon = document.getElementById('eye-icon');
            if (passInput.type === 'password') {
                passInput.type = 'text';
                eyeIcon.innerHTML = '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>';
            } else {
                passInput.type = 'password';
                eyeIcon.innerHTML = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
            }
        }
    </script>
</body>
</html>
