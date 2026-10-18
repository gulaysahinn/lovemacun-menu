<?php
require_once __DIR__ . '/../yonetim/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

// GET Talebi: Menü verisini döndür
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    ensure_menu_initialized();
    if (!file_exists(MENU_FILE)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Menü veri dosyası bulunamadı.']);
        exit;
    }
    header('ETag: "' . md5_file(MENU_FILE) . '"');
    readfile(MENU_FILE);
    exit;
}

// POST Talebi: Menüyü güncelle (Yetki, CSRF ve Eşzamanlılık Kilidi zorunlu)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_login(true);
    $currentUser = get_current_user_info();
    $userRole = $currentUser['role'] ?? 'personel';

    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? '');
    if (!verify_csrf_token($csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Geçersiz veya eksik CSRF güvenlik anahtarı.']);
        exit;
    }

    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!$payload || !isset($payload['items']) || !is_array($payload['items'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Geçersiz veri biçimi. "items" dizisi gereklidir.']);
        exit;
    }

    ensure_menu_initialized();

    // 1. Eşzamanlı Kayıt Kilidi (flock) ve Revision Kontrolü
    $fp = fopen(MENU_FILE, 'c+');
    if (!$fp || !flock($fp, LOCK_EX)) {
        http_response_code(503);
        echo json_encode(['success' => false, 'error' => 'Dosya kilitlenemedi. Lütfen tekrar deneyin.']);
        exit;
    }

    // Mevcut dosya içeriğini kilit altındayken oku
    $currentContent = stream_get_contents($fp);
    $existingData = json_decode($currentContent, true) ?: ['categories' => [], 'items' => [], 'revision' => 1];
    $currentRevision = isset($existingData['revision']) ? (int)$existingData['revision'] : 1;
    $sentRevision = isset($payload['revision']) ? (int)$payload['revision'] : 0;

    // Revision Uyuşmazlığı Tespiti (Başkası arada kaydetmişse 409 Conflict)
    if ($sentRevision > 0 && $sentRevision !== $currentRevision) {
        flock($fp, LOCK_UN);
        fclose($fp);
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'conflict' => true,
            'currentRevision' => $currentRevision,
            'error' => 'Menü siz düzenlerken başka bir kullanıcı tarafından güncellendi! Değişikliklerinizin kaybolmaması için yerel taslağınız saklandı. Lütfen sayfayı yenileyin.'
        ]);
        exit;
    }

    // 2. Rol Yetki Doğrulaması (Personel sadece fiyat, tükendi ve gizle güncelleyebilir)
    $oldItemsMap = [];
    if (!empty($existingData['items'])) {
        foreach ($existingData['items'] as $it) {
            $oldItemsMap[$it['id']] = $it;
        }
    }

    $newItems = $payload['items'];
    if ($userRole === 'personel') {
        // Personel ürün ekleyemez veya silemez
        if (count($newItems) !== count($existingData['items'])) {
            flock($fp, LOCK_UN);
            fclose($fp);
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Personel rolü ürün ekleyemez veya silemez. Sadece fiyat ve durum güncelleyebilir.']);
            exit;
        }

        // Personel ürün adını, kategorisini veya görselini değiştiremez
        foreach ($newItems as $it) {
            $id = $it['id'] ?? '';
            if (!isset($oldItemsMap[$id])) {
                flock($fp, LOCK_UN);
                fclose($fp);
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Personel rolü yeni ürün ekleyemez.']);
                exit;
            }
            $old = $oldItemsMap[$id];
            if ($old['name'] !== $it['name'] || $old['category'] !== $it['category']) {
                flock($fp, LOCK_UN);
                fclose($fp);
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Personel rolü ürün adı veya kategorisini değiştiremez.']);
                exit;
            }
        }
    }

    // 3. Ürünleri Doğrula
    $validatedItems = [];
    $seenIds = [];
    $logChanges = [];

    foreach ($newItems as $idx => $item) {
        $name = trim($item['name'] ?? '');
        $cat = trim($item['category'] ?? '');
        if (empty($name) || empty($cat)) {
            flock($fp, LOCK_UN);
            fclose($fp);
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => ($idx + 1) . '. sıradaki ürün adı veya kategorisi boş olamaz.']);
            exit;
        }

        $price = isset($item['price']) ? (float)$item['price'] : 0;
        if ($price < 0) {
            flock($fp, LOCK_UN);
            fclose($fp);
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Fiyat negatif olamaz: ' . htmlspecialchars($name)]);
            exit;
        }

        $id = !empty($item['id']) ? trim($item['id']) : ($cat . '-' . preg_replace('/[^a-z0-9]+/i', '-', strtolower($name)));
        if (isset($seenIds[$id])) {
            $id .= '-' . ($idx + 1);
        }
        $seenIds[$id] = true;

        $vItem = [
            'id' => $id,
            'category' => $cat,
            'name' => $name,
            'price' => $price,
            'description' => isset($item['description']) ? trim($item['description']) : '',
            'image' => isset($item['image']) ? trim($item['image']) : '',
            'tags' => isset($item['tags']) && is_array($item['tags']) ? array_values(array_unique($item['tags'])) : [],
            'featuredOrder' => isset($item['featuredOrder']) ? (int)$item['featuredOrder'] : 0,
            'isNew' => !empty($item['isNew']),
            'soldOut' => !empty($item['soldOut']),
            'hidden' => !empty($item['hidden'])
        ];
        $validatedItems[] = $vItem;

        // Değişiklik günlüğü
        if (isset($oldItemsMap[$id])) {
            $oldIt = $oldItemsMap[$id];
            if ($oldIt['price'] != $price) $logChanges[] = "Fiyat: {$name} ({$oldIt['price']} -> {$price} TL)";
            if (($oldIt['soldOut'] ?? false) !== $vItem['soldOut']) $logChanges[] = "Tükendi: {$name} -> " . ($vItem['soldOut'] ? 'Tükendi' : 'Mevcut');
            if (($oldIt['hidden'] ?? false) !== $vItem['hidden']) $logChanges[] = "Gizleme: {$name} -> " . ($vItem['hidden'] ? 'Gizli' : 'Görünür');
        } else {
            $logChanges[] = "Yeni ürün: {$name} ({$price} TL)";
        }
    }

    foreach ($oldItemsMap as $id => $oldIt) {
        if (!isset($seenIds[$id])) {
            $logChanges[] = "Ürün silindi: {$oldIt['name']}";
        }
    }

    $newRevision = $currentRevision + 1;
    $newVersion = time() * 1000;
    $finalData = [
        'version' => $newVersion,
        'revision' => $newRevision,
        'categories' => !empty($payload['categories']) && is_array($payload['categories']) ? $payload['categories'] : ($existingData['categories'] ?? []),
        'items' => $validatedItems
    ];

    $jsonOutput = json_encode($finalData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    // 4. Otomatik Yedekleme (BACKUPS_DIR)
    $backupFileName = 'menu-' . date('Ymd-His') . '.json';
    @file_put_contents(BACKUPS_DIR . '/' . $backupFileName, $jsonOutput, LOCK_EX);

    // En fazla 50 yedek sakla
    $backupFiles = glob(BACKUPS_DIR . '/menu-*.json');
    if ($backupFiles && count($backupFiles) > 50) {
        usort($backupFiles, function($a, $b) { return filemtime($a) - filemtime($b); });
        $deleteCount = count($backupFiles) - 50;
        for ($i = 0; $i < $deleteCount; $i++) {
            @unlink($backupFiles[$i]);
        }
    }

    // 5. Dosyayı kilit altındayken yaz ve kilidi çöz
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, $jsonOutput);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    // 6. Denetim İzi (Audit Log)
    $summary = !empty($logChanges) ? implode('; ', array_slice($logChanges, 0, 8)) : 'Menü güncellendi';
    if (count($logChanges) > 8) $summary .= ' ...ve ' . (count($logChanges) - 8) . ' değişiklik daha';
    write_audit_log("Menü kaydedildi (Rev: {$newRevision}). {$summary}");

    echo json_encode([
        'success' => true,
        'message' => 'Menü başarıyla kaydedildi.',
        'version' => $newVersion,
        'revision' => $newRevision,
        'count' => count($validatedItems),
        'backup' => $backupFileName
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Desteklenmeyen metod.']);
