<?php
require_once __DIR__ . '/../yonetim/auth.php';

header('Content-Type: application/json; charset=utf-8');
require_role('yonetici', true); // Sadece yönetici yedek geri yükleyebilir

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Geçersiz metod.']);
    exit;
}

$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? '');
if (!verify_csrf_token($csrfToken)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Geçersiz CSRF anahtarı.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
$backupName = $data['backup'] ?? ($_POST['backup'] ?? '');

// Path Traversal Güvenliği
$backupName = basename($backupName);
if (!preg_match('/^menu-(before-restore-)?\d{8}-\d{6}\.json$/', $backupName)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Geçersiz veya şüpheli yedek dosya adı.']);
    exit;
}

$targetBackupPath = BACKUPS_DIR . '/' . $backupName;

if (!file_exists($targetBackupPath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Seçilen yedek dosyası bulunamadı.']);
    exit;
}

$content = file_get_contents($targetBackupPath);
$json = json_decode($content, true);
if (!$json || !isset($json['items']) || !is_array($json['items'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Yedek dosyası bozuk veya geçersiz menü yapısına sahip.']);
    exit;
}

// Geri yüklemeden ÖNCE mevcut canlı menünün güvenlik yedeğini al
if (file_exists(MENU_FILE)) {
    $preRestoreName = 'menu-before-restore-' . date('Ymd-His') . '.json';
    @copy(MENU_FILE, BACKUPS_DIR . '/' . $preRestoreName);
}

// Atomik geri yükleme
$tmpFile = tempnam(dirname(MENU_FILE), 'restore_tmp_');
if (@file_put_contents($tmpFile, $content) !== false && @rename($tmpFile, MENU_FILE)) {
    write_audit_log("Yedek başarıyla geri yüklendi: {$backupName} (Öğe sayısı: " . count($json['items']) . ")");

    echo json_encode([
        'success' => true,
        'message' => 'Yedek başarıyla geri yüklendi.',
        'count' => count($json['items'])
    ]);
    exit;
} else {
    @unlink($tmpFile);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Geri yükleme sırasında menü dosyasına yazılamadı.']);
    exit;
}
