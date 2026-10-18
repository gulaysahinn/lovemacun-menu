<?php
require_once __DIR__ . '/auth.php';
require_role('yonetici'); // Sadece yönetici yetkisi

$message = '';
$messageType = '';

// İşlemler (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verify_csrf_token($token)) {
        $message = 'Güvenlik doğrulaması (CSRF) geçersiz.';
        $messageType = 'danger';
    } else {
        $action = $_POST['action'] ?? '';
        $users = get_users();

        // 1. Yeni Kullanıcı Ekle
        if ($action === 'add_user') {
            $newUsername = trim($_POST['new_username'] ?? '');
            $newName = trim($_POST['new_name'] ?? '');
            $newPass = $_POST['new_password'] ?? '';
            $newRole = $_POST['new_role'] === 'yonetici' ? 'yonetici' : 'personel';

            if (strlen($newUsername) < 3 || !preg_match('/^[a-zA-Z0-9_.-]+$/', $newUsername)) {
                $message = 'Kullanıcı adı en az 3 karakter olmalı ve yalnızca harf, rakam, alt çizgi içerebilir.';
                $messageType = 'danger';
            } elseif (find_user_by_username($newUsername)) {
                $message = 'Bu kullanıcı adı zaten kullanılıyor.';
                $messageType = 'danger';
            } elseif (strlen($newPass) < 10) {
                $message = 'Şifre en az 10 karakter uzunluğunda olmalıdır.';
                $messageType = 'danger';
            } else {
                $algo = get_password_hash_algo();
                $hash = password_hash($newPass, $algo);
                $newId = count($users) > 0 ? (max(array_column($users, 'id')) + 1) : 1;

                $users[] = [
                    'id' => $newId,
                    'username' => $newUsername,
                    'name' => $newName ?: $newUsername,
                    'password' => $hash,
                    'role' => $newRole,
                    'active' => true,
                    'created_at' => date('Y-m-d H:i:s'),
                    'last_login' => null
                ];

                if (save_users($users)) {
                    write_audit_log("Yeni kullanıcı eklendi: {$newUsername} ({$newRole})");
                    $message = "Kullanıcı başarıyla eklendi: {$newUsername}";
                    $messageType = 'success';
                }
            }
        }

        // 2. Rol Değiştir
        elseif ($action === 'change_role') {
            $targetUsername = trim($_POST['target_username'] ?? '');
            $targetRole = $_POST['target_role'] === 'yonetici' ? 'yonetici' : 'personel';

            // Son aktif yönetici personelleştirilemez
            if ($targetRole === 'personel' && count_active_yoneticiler($targetUsername) < 1) {
                $message = 'Hata: Sistemde en az bir aktif yönetici kalmalıdır!';
                $messageType = 'danger';
            } else {
                $found = false;
                foreach ($users as &$u) {
                    if (mb_strtolower($u['username'], 'UTF-8') === mb_strtolower($targetUsername, 'UTF-8')) {
                        $u['role'] = $targetRole;
                        $found = true;
                        break;
                    }
                }
                if ($found && save_users($users)) {
                    write_audit_log("Kullanıcı rolü güncellendi: {$targetUsername} -> {$targetRole}");
                    $message = "Kullanıcı rolü güncellendi: {$targetUsername}";
                    $messageType = 'success';
                }
            }
        }

        // 3. Durum Değiştir (Aktif / Pasif)
        elseif ($action === 'toggle_status') {
            $targetUsername = trim($_POST['target_username'] ?? '');
            $userObj = find_user_by_username($targetUsername);

            if ($userObj && $userObj['role'] === 'yonetici' && !empty($userObj['active']) && count_active_yoneticiler($targetUsername) < 1) {
                $message = 'Hata: Son kalan aktif yöneticiyi devre dışı bırakamazsınız!';
                $messageType = 'danger';
            } else {
                $newStatus = false;
                foreach ($users as &$u) {
                    if (mb_strtolower($u['username'], 'UTF-8') === mb_strtolower($targetUsername, 'UTF-8')) {
                        $u['active'] = !($u['active'] ?? true);
                        $newStatus = $u['active'];
                        break;
                    }
                }
                if (save_users($users)) {
                    $statusStr = $newStatus ? 'Etkinleştirildi' : 'Devre Dışı Bırakıldı';
                    write_audit_log("Kullanıcı durumu değiştirildi: {$targetUsername} -> {$statusStr}");
                    $message = "Kullanıcı durumu güncellendi: {$targetUsername} ({$statusStr})";
                    $messageType = 'success';
                }
            }
        }

        // 4. Şifre Sıfırla
        elseif ($action === 'reset_password') {
            $targetUsername = trim($_POST['target_username'] ?? '');
            $newPass = $_POST['reset_password_val'] ?? '';

            if (strlen($newPass) < 10) {
                $message = 'Şifre en az 10 karakter olmalıdır.';
                $messageType = 'danger';
            } else {
                $algo = get_password_hash_algo();
                $hash = password_hash($newPass, $algo);
                $found = false;
                foreach ($users as &$u) {
                    if (mb_strtolower($u['username'], 'UTF-8') === mb_strtolower($targetUsername, 'UTF-8')) {
                        $u['password'] = $hash;
                        $found = true;
                        break;
                    }
                }
                if ($found && save_users($users)) {
                    clear_login_failures($targetUsername);
                    write_audit_log("Kullanıcı şifresi sıfırlandı: {$targetUsername}");
                    $message = "{$targetUsername} için yeni şifre başarıyla kaydedildi.";
                    $messageType = 'success';
                }
            }
        }
    }
}

$userList = get_users();
$csrfToken = get_csrf_token();
$currentAuthUser = $_SESSION['auth_user'] ?? '';
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kullanıcı Yönetimi | <?= htmlspecialchars(BRAND_NAME) ?></title>
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
            padding: 24px 16px;
        }
        .header-bar {
            max-width: 1100px;
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
            border: none;
            transition: all 0.2s;
        }
        .btn-primary { background: var(--accent-orange); color: #fff; }
        .btn-primary:hover { background: var(--accent-hover); }
        .btn-secondary { background: #22272e; color: #fff; border: 1px solid #333a42; }
        .btn-secondary:hover { background: #2a3038; }

        .container {
            max-width: 1100px;
            margin: 0 auto;
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: 14px;
            overflow: hidden;
        }
        .alert {
            padding: 14px 18px;
            margin: 0 auto 20px;
            max-width: 1100px;
            border-radius: 8px;
            font-size: 14px;
        }
        .alert-success { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: #6ee7b7; }
        .alert-danger { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }

        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        th { background: #111317; padding: 14px 18px; color: var(--text-secondary); font-weight: 600; border-bottom: 1px solid var(--border-card); font-size: 12px; text-transform: uppercase; }
        td { padding: 14px 18px; border-bottom: 1px solid var(--border-card); vertical-align: middle; }
        tr:hover td { background: rgba(255, 255, 255, 0.02); }

        .badge { font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 700; display: inline-block; }
        .badge-admin { background: rgba(255, 107, 0, 0.15); color: #ff9d4d; border: 1px solid rgba(255, 107, 0, 0.3); }
        .badge-staff { background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
        .badge-active { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-passive { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }

        .action-group { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
        .btn-action { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #333a42; background: rgba(255, 255, 255, 0.05); color: #fff; }
        .btn-action:hover { background: rgba(255, 255, 255, 0.1); }

        /* Modal */
        .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s;
        }
        .modal-overlay.open { opacity: 1; visibility: visible; }
        .modal {
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: 14px;
            width: 100%;
            max-width: 440px;
            padding: 28px;
        }
        .modal h2 { font-size: 18px; margin-bottom: 18px; }
        .form-row { margin-bottom: 16px; }
        .form-row label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
        .form-row input, .form-row select {
            width: 100%;
            padding: 12px;
            background: #0d0f12;
            border: 1px solid var(--border-card);
            border-radius: 8px;
            color: #fff;
            font-size: 15px;
            outline: none;
        }
        .form-row input:focus, .form-row select:focus { border-color: var(--accent-orange); }

        @media (max-width: 768px) {
            th:nth-child(4), td:nth-child(4) { display: none; }
            .header-bar { flex-direction: column; align-items: flex-start; }
        }
    </style>
</head>
<body>
    <div class="header-bar">
        <div class="header-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <div>
                <h1>Kullanıcı Yönetimi</h1>
                <p style="font-size: 13px; color: var(--text-secondary);">Yönetici ve personel yetkilendirmesi</p>
            </div>
        </div>
        <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-primary" onclick="openAddUserModal()">➕ Yeni Kullanıcı Ekle</button>
            <a href="/yonetim/index.php" class="btn btn-secondary">&larr; Panele Dön</a>
        </div>
    </div>

    <?php if (!empty($message)): ?>
        <div class="alert alert-<?= $messageType ?>"><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></div>
    <?php endif; ?>

    <div class="container">
        <table>
            <thead>
                <tr>
                    <th>Kullanıcı Adı</th>
                    <th>Rol</th>
                    <th>Durum</th>
                    <th>Son Giriş</th>
                    <th style="text-align: right;">İşlemler</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($userList as $u): ?>
                    <tr>
                        <td>
                            <strong style="color: #fff;"><?= htmlspecialchars($u['username']) ?></strong>
                            <?php if (!empty($u['name']) && $u['name'] !== $u['username']): ?>
                                <span style="font-size: 12px; color: var(--text-secondary); display: block;"><?= htmlspecialchars($u['name']) ?></span>
                            <?php endif; ?>
                            <?php if ($u['username'] === $currentAuthUser): ?>
                                <span style="font-size: 11px; color: #ff6b00; font-weight: 700;">(Siz)</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php if ($u['role'] === 'yonetici'): ?>
                                <span class="badge badge-admin">Yönetici</span>
                            <?php else: ?>
                                <span class="badge badge-staff">Personel</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php if (!empty($u['active'])): ?>
                                <span class="badge badge-active">Aktif</span>
                            <?php else: ?>
                                <span class="badge badge-passive">Devre Dışı</span>
                            <?php endif; ?>
                        </td>
                        <td style="color: var(--text-secondary); font-size: 13px;">
                            <?= !empty($u['last_login']) ? date('d.m.Y H:i', strtotime($u['last_login'])) : 'Henüz girmedi' ?>
                        </td>
                        <td style="text-align: right;">
                            <div class="action-group">
                                <!-- Rol Değiştir Formu -->
                                <form method="POST" style="margin: 0;">
                                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES) ?>">
                                    <input type="hidden" name="action" value="change_role">
                                    <input type="hidden" name="target_username" value="<?= htmlspecialchars($u['username'], ENT_QUOTES) ?>">
                                    <input type="hidden" name="target_role" value="<?= $u['role'] === 'yonetici' ? 'personel' : 'yonetici' ?>">
                                    <button type="submit" class="btn-action" title="Rolü değiştir">
                                        <?= $u['role'] === 'yonetici' ? 'Personel Yap' : 'Yönetici Yap' ?>
                                    </button>
                                </form>

                                <!-- Aktif/Pasif Toggle Formu -->
                                <form method="POST" style="margin: 0;">
                                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES) ?>">
                                    <input type="hidden" name="action" value="toggle_status">
                                    <input type="hidden" name="target_username" value="<?= htmlspecialchars($u['username'], ENT_QUOTES) ?>">
                                    <button type="submit" class="btn-action" style="<?= empty($u['active']) ? 'color:#6ee7b7;' : 'color:#f87171;' ?>">
                                        <?= empty($u['active']) ? 'Etkinleştir' : 'Devre Dışı Bırak' ?>
                                    </button>
                                </form>

                                <!-- Şifre Sıfırla Düğmesi -->
                                <button type="button" class="btn-action" onclick="openResetModal('<?= htmlspecialchars($u['username'], ENT_QUOTES) ?>')">Şifre Sıfırla</button>
                            </div>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <!-- Kullanıcı Ekle Modalı -->
    <div id="addUserModal" class="modal-overlay">
        <div class="modal">
            <h2>Yeni Kullanıcı Ekle</h2>
            <form method="POST">
                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES) ?>">
                <input type="hidden" name="action" value="add_user">

                <div class="form-row">
                    <label for="new_username">Kullanıcı Adı *</label>
                    <input type="text" id="new_username" name="new_username" required placeholder="Örn: ahmet">
                </div>

                <div class="form-row">
                    <label for="new_name">Ad Soyad</label>
                    <input type="text" id="new_name" name="new_name" placeholder="Örn: Ahmet Yılmaz">
                </div>

                <div class="form-row">
                    <label for="new_password">Şifre (En az 10 karakter) *</label>
                    <input type="password" id="new_password" name="new_password" required placeholder="En az 10 karakter">
                </div>

                <div class="form-row">
                    <label for="new_role">Rol *</label>
                    <select id="new_role" name="new_role">
                        <option value="personel">Personel (Sadece Fiyat/Tükendi/Gizle)</option>
                        <option value="yonetici">Yönetici (Tam Yetkili)</option>
                    </select>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="closeAddUserModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Kaydet</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Şifre Sıfırla Modalı -->
    <div id="resetModal" class="modal-overlay">
        <div class="modal">
            <h2 id="resetModalTitle">Şifre Sıfırla</h2>
            <form method="POST">
                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES) ?>">
                <input type="hidden" name="action" value="reset_password">
                <input type="hidden" id="reset_target_username" name="target_username" value="">

                <div class="form-row">
                    <label for="reset_password_val">Yeni Şifre (En az 10 karakter) *</label>
                    <input type="password" id="reset_password_val" name="reset_password_val" required placeholder="Yeni şifreyi girin">
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="closeResetModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Şifreyi Güncelle</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function openAddUserModal() {
            document.getElementById('addUserModal').classList.add('open');
        }
        function closeAddUserModal() {
            document.getElementById('addUserModal').classList.remove('open');
        }
        function openResetModal(username) {
            document.getElementById('reset_target_username').value = username;
            document.getElementById('resetModalTitle').textContent = `Şifre Sıfırla: ${username}`;
            document.getElementById('reset_password_val').value = '';
            document.getElementById('resetModal').classList.add('open');
        }
        function closeResetModal() {
            document.getElementById('resetModal').classList.remove('open');
        }
    </script>
</body>
</html>
