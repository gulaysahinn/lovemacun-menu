<?php
require_once __DIR__ . '/auth.php';
require_role('yonetici'); // Sadece yönetici yedekleri yönetebilir

$backupsDir = BACKUPS_DIR;
$menuFile = MENU_FILE;
$message = '';
$messageType = '';

// Manuel Yedek Al Talebi
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'manual_backup') {
    $token = $_POST['csrf_token'] ?? '';
    if (verify_csrf_token($token)) {
        if (file_exists($menuFile)) {
            $name = 'menu-' . date('Ymd-His') . '.json';
            if (@copy($menuFile, $backupsDir . '/' . $name)) {
                write_audit_log("Manuel anlık yedek oluşturuldu: {$name}");
                $message = 'Manuel yedek başarıyla oluşturuldu: ' . $name;
                $messageType = 'success';
            } else {
                $message = 'Yedek alınırken dosya kopyalanamadı.';
                $messageType = 'danger';
            }
        }
    }
}

// Yedek İndirme Talebi
if (isset($_GET['download'])) {
    $dlFile = basename($_GET['download']);
    if (preg_match('/^menu-.*\.json$/', $dlFile) && file_exists($backupsDir . '/' . $dlFile)) {
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="' . $dlFile . '"');
        readfile($backupsDir . '/' . $dlFile);
        exit;
    }
}

// Yedek Listesi
$backups = [];
if (is_dir($backupsDir)) {
    $files = glob($backupsDir . '/menu-*.json');
    if ($files) {
        foreach ($files as $f) {
            $fn = basename($f);
            $size = round(filesize($f) / 1024, 1);
            $mtime = filemtime($f);
            
            // Ürün sayısı oku
            $itemCount = '-';
            $content = @file_get_contents($f);
            if ($content) {
                $decoded = json_decode($content, true);
                if (isset($decoded['items']) && is_array($decoded['items'])) {
                    $itemCount = count($decoded['items']);
                }
            }

            $backups[] = [
                'name' => $fn,
                'path' => $f,
                'size' => $size . ' KB',
                'time' => date('d.m.Y H:i:s', $mtime),
                'timestamp' => $mtime,
                'itemCount' => $itemCount,
                'isSafety' => strpos($fn, 'before-restore') !== false
            ];
        }

        usort($backups, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });
    }
}

$csrfToken = get_csrf_token();
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Menü Yedekleri | <?= htmlspecialchars(BRAND_NAME) ?></title>
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
        .header-actions { display: flex; align-items: center; gap: 12px; }
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
        .btn-restore { background: rgba(245, 158, 11, 0.15); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); padding: 6px 12px; font-size: 13px; }
        .btn-restore:hover { background: rgba(245, 158, 11, 0.25); }
        .btn-dl { background: rgba(255, 255, 255, 0.05); color: #cbd5e1; border: 1px solid #333a42; padding: 6px 12px; font-size: 13px; }
        .btn-dl:hover { background: rgba(255, 255, 255, 0.1); }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: 14px;
            overflow: hidden;
        }
        .alert {
            padding: 14px 18px;
            margin: 0 auto 20px;
            max-width: 1000px;
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
        .badge-auto { background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
        .badge-safety { background: rgba(245, 158, 11, 0.15); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-count { background: rgba(255, 255, 255, 0.08); color: #fff; }

        .toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 14px 20px;
            border-radius: 10px;
            background: #1e232a;
            color: #fff;
            border: 1px solid #333a42;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            font-size: 14px;
            display: none;
            z-index: 1000;
        }

        @media (max-width: 768px) {
            th:nth-child(3), td:nth-child(3) { display: none; }
            .header-bar { flex-direction: column; align-items: flex-start; }
        }
    </style>
</head>
<body>
    <div class="header-bar">
        <div class="header-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                <path d="m3.3 7 8.7 5 8.7-5"/>
                <path d="M12 22V12"/>
            </svg>
            <div>
                <h1>Menü Yedekleri & Sürümler</h1>
                <p style="font-size: 13px; color: var(--text-secondary);">Otomatik 50 yedek saklanır. İstediğiniz an tek tıkla geri yükleyebilirsiniz.</p>
            </div>
        </div>
        <div class="header-actions">
            <form method="POST" style="margin: 0;">
                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
                <input type="hidden" name="action" value="manual_backup">
                <button type="submit" class="btn btn-primary">➕ Anlık Yedek Al</button>
            </form>
            <a href="/yonetim/index.php" class="btn btn-secondary">&larr; Panele Dön</a>
        </div>
    </div>

    <?php if (!empty($message)): ?>
        <div class="alert alert-<?= $messageType ?>"><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></div>
    <?php endif; ?>

    <div class="container">
        <?php if (empty($backups)): ?>
            <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
                Henüz kayıtlı bir yedek bulunamadı. "Anlık Yedek Al" butonuna basarak ilk yedeği alabilirsiniz.
            </div>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Tarih / Saat</th>
                        <th>Tür</th>
                        <th>Dosya Adı</th>
                        <th>Ürün Sayısı</th>
                        <th>Boyut</th>
                        <th style="text-align: right;">İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($backups as $b): ?>
                        <tr>
                            <td style="font-weight: 600;"><?= $b['time'] ?></td>
                            <td>
                                <?php if ($b['isSafety']): ?>
                                    <span class="badge badge-safety">Geri Yükleme Öncesi</span>
                                <?php else: ?>
                                    <span class="badge badge-auto">Otomatik Yedek</span>
                                <?php endif; ?>
                            </td>
                            <td style="font-family: monospace; font-size: 13px; color: var(--text-secondary);"><?= htmlspecialchars($b['name']) ?></td>
                            <td><span class="badge badge-count"><?= $b['itemCount'] ?> ürün</span></td>
                            <td style="color: var(--text-secondary);"><?= $b['size'] ?></td>
                            <td style="text-align: right; white-space: nowrap;">
                                <a href="?download=<?= urlencode($b['name']) ?>" class="btn btn-dl" title="İndir">💾 İndir</a>
                                <button type="button" class="btn btn-restore" onclick="restoreBackup('<?= htmlspecialchars($b['name'], ENT_QUOTES) ?>')">↺ Geri Yükle</button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>

    <div id="toast" class="toast" role="alert" aria-live="polite"></div>

    <script>
        const CSRF_TOKEN = <?= json_encode($csrfToken) ?>;

        function showToast(msg, isError = false) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.style.borderColor = isError ? '#ef4444' : '#10b981';
            toast.style.display = 'block';
            setTimeout(() => { toast.style.display = 'none'; }, 4000);
        }

        async function restoreBackup(filename) {
            if (!confirm(`"${filename}" yedeğini geri yüklemek istediğinize emin misiniz?\n\nÖNEMLİ: Mevcut canlı menünün otomatik güvenlik yedeği alınacak ve menü bu tarihteki haline döndürülecektir.`)) {
                return;
            }

            try {
                const res = await fetch('/api/restore.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': CSRF_TOKEN
                    },
                    body: JSON.stringify({ backup: filename })
                });

                const data = await res.json();
                if (data.success) {
                    showToast('Yedek başarıyla geri yüklendi! Sayfa yenileniyor...');
                    setTimeout(() => { location.reload(); }, 1200);
                } else {
                    alert('Hata: ' + (data.error || 'Geri yüklenemedi.'));
                }
            } catch (err) {
                alert('İstek sırasında bir hata oluştu.');
            }
        }
    </script>
</body>
</html>
