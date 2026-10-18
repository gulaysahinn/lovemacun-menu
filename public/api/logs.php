<?php
require_once __DIR__ . '/../yonetim/auth.php';

header('Content-Type: application/json; charset=utf-8');
require_login(true);

$logFile = LOGS_DIR . '/degisiklik.log';

if (!file_exists($logFile)) {
    echo json_encode(['success' => true, 'logs' => []]);
    exit;
}

$lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$recent = array_slice(array_reverse($lines), 0, 50);

echo json_encode([
    'success' => true,
    'logs' => $recent
]);
