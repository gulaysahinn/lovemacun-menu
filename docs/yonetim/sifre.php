<?php
require_once __DIR__ . '/auth.php';
require_login();

$error = '';
$success = false;
$currentUser = $_SESSION['auth_user'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verify_csrf_token($token)) {
        $error = 'Güvenlik doğrulaması (CSRF) geçersiz.';
    } else {
        $currentPass = $_POST['current_password'] ?? '';
        $newPass = $_POST['new_password'] ?? '';
        $newPassConfirm = $_POST['new_password_confirm'] ?? '';

        $userObj = find_user_by_username($currentUser);
        if (!$userObj || !password_verify($currentPass, $userObj['password'])) {
            $error = 'Mevcut şifreniz hatalı.';
        } elseif (strlen($newPass) < 10) {
            $error = 'Yeni şifre en az 10 karakter uzunluğunda olmalıdır.';
        } elseif ($newPass !== $newPassConfirm) {
            $error = 'Girdiğiniz yeni şifreler birbiriyle eşleşmiyor.';
        } else {
            $algo = get_password_hash_algo();
            $newHash = password_hash($newPass, $algo);
            $users = get_users();
            $updated = false;

            foreach ($users as &$u) {
                if (mb_strtolower($u['username'], 'UTF-8') === mb_strtolower($currentUser, 'UTF-8')) {
                    $u['password'] = $newHash;
                    $updated = true;
                    break;
                }
            }

            if ($updated && save_users($users)) {
                clear_login_failures($currentUser);
                write_audit_log("Kendi şifresini başarıyla güncelledi.");
                $success = true;
            } else {
                $error = 'Şifre güncellenemedi. Lütfen tekrar deneyin.';
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
    <title>Şifremi Değiştir | <?= htmlspecialchars(BRAND_NAME) ?></title>
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
            max-width: 440px;
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: 16px;
            padding: 36px 32px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        h1 { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px; text-align: center; }
        .subtitle { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; text-align: center; }
        .alert { padding: 13px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 20px; line-height: 1.4; }
        .alert-danger { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }
        .alert-success { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: #6ee7b7; }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
        input[type="password"] {
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
        .btn-submit {
            width: 100%;
            padding: 13px;
            background: var(--accent-orange);
            border: none;
            border-radius: 10px;
            color: #fff;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.2s;
            margin-top: 8px;
            text-decoration: none;
            display: inline-block;
            text-align: center;
        }
        .btn-submit:hover { background: var(--accent-hover); }
        .back-link { display: block; text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-secondary); text-decoration: none; }
        .back-link:hover { color: var(--accent-orange); }
    </style>
</head>
<body>
    <div class="container">
        <h1>Şifre Değiştir</h1>
        <p class="subtitle">Kullanıcı: <strong><?= htmlspecialchars($currentUser) ?></strong></p>

        <?php if ($success): ?>
            <div class="alert alert-success">
                Şifreniz başarıyla güncellendi!
            </div>
            <a href="/yonetim/index.php" class="btn-submit">Panele Geri Dön &rarr;</a>
        <?php else: ?>
            <?php if (!empty($error)): ?>
                <div class="alert alert-danger"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
            <?php endif; ?>

            <form method="POST" action="/yonetim/sifre.php">
                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
                
                <div class="form-group">
                    <label for="current_password">Mevcut Şifreniz *</label>
                    <input type="password" id="current_password" name="current_password" required autocomplete="current-password" autofocus>
                </div>

                <div class="form-group">
                    <label for="new_password">Yeni Şifreniz (En az 10 karakter) *</label>
                    <input type="password" id="new_password" name="new_password" required autocomplete="new-password">
                </div>

                <div class="form-group">
                    <label for="new_password_confirm">Yeni Şifreyi Onaylayın *</label>
                    <input type="password" id="new_password_confirm" name="new_password_confirm" required autocomplete="new-password">
                </div>

                <button type="submit" class="btn-submit">Şifremi Güncelle &rarr;</button>
            </form>

            <a href="/yonetim/index.php" class="back-link">&larr; Yönetim Paneline Dön</a>
        <?php endif; ?>
    </div>
</body>
</html>
