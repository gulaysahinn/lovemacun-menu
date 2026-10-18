<?php
require_once __DIR__ . '/../yonetim/auth.php';

header('Content-Type: application/json; charset=utf-8');
require_role('yonetici', true); // Sadece yönetici görsel yükleyebilir

$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? '');
if (!verify_csrf_token($csrfToken)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Geçersiz CSRF anahtarı.']);
    exit;
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    $errorCode = $_FILES['image']['error'] ?? 'dosya_yok';
    echo json_encode(['success' => false, 'error' => 'Görsel yüklenemedi. Hata kodu: ' . $errorCode]);
    exit;
}

$file = $_FILES['image'];
$maxSize = 8 * 1024 * 1024; // 8 MB

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Görsel boyutu en fazla 8 MB olabilir.']);
    exit;
}

// finfo MIME Tespiti (Client başlığına ASLA güvenme)
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);

$allowedMimes = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp'
];

if (!isset($allowedMimes[$mime])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Geçersiz dosya türü (' . htmlspecialchars($mime) . '). Sadece JPEG, PNG veya WebP yükleyebilirsiniz.']);
    exit;
}

// GD ile Resmi Aç
$src = null;
switch ($mime) {
    case 'image/jpeg':
        $src = @imagecreatefromjpeg($file['tmp_name']);
        break;
    case 'image/png':
        $src = @imagecreatefrompng($file['tmp_name']);
        break;
    case 'image/webp':
        $src = @imagecreatefromwebp($file['tmp_name']);
        break;
}

if (!$src) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Görsel dosyası okunamadı veya bozuk.']);
    exit;
}

$origWidth = imagesx($src);
$origHeight = imagesy($src);

// Kare Kırpma (Center Crop)
$cropSize = min($origWidth, $origHeight);
$srcX = (int)(($origWidth - $cropSize) / 2);
$srcY = (int)(($origHeight - $cropSize) / 2);

$targetSize = 400; // 400x400 standart kare
$dest = imagecreatetruecolor($targetSize, $targetSize);

// Şeffaflık veya alfa koruma
imagealphablending($dest, false);
imagesavealpha($dest, true);

imagecopyresampled(
    $dest, $src,
    0, 0,
    $srcX, $srcY,
    $targetSize, $targetSize,
    $cropSize, $cropSize
);

$uploadDir = UPLOADS_DIR;
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

$categorySlug = isset($_POST['category']) ? preg_replace('/[^a-z0-9_-]/i', '', strtolower($_POST['category'])) : 'urun';
if (empty($categorySlug)) $categorySlug = 'urun';

$fileName = 'lovemacun-' . $categorySlug . '-' . date('YmdHis') . '-' . substr(bin2hex(random_bytes(4)), 0, 8) . '.webp';
$targetFilePath = $uploadDir . '/' . $fileName;

$saved = imagewebp($dest, $targetFilePath, 85);

imagedestroy($src);
imagedestroy($dest);

if ($saved) {
    write_audit_log("Yeni ürün fotoğrafı yüklendi: {$fileName}");

    echo json_encode([
        'success' => true,
        'path' => '/img/uploads/' . $fileName,
        'fileName' => $fileName
    ]);
    exit;
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Görsel WebP formatında sunucuya kaydedilemedi.']);
    exit;
}
