<?php
require_once __DIR__ . '/auth.php';
require_login();

ensure_menu_initialized();

$menuData = file_exists(MENU_FILE) ? json_decode(file_get_contents(MENU_FILE), true) : ['categories' => [], 'items' => [], 'revision' => 1];
$categories = $menuData['categories'] ?? [];
$items = $menuData['items'] ?? [];
$revision = isset($menuData['revision']) ? (int)$menuData['revision'] : 1;

$csrfToken = get_csrf_token();
$userInfo = get_current_user_info();
$userRole = $userInfo['role'] ?? 'personel';
$userName = $userInfo['username'] ?? '';
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Menü Yönetimi | <?= htmlspecialchars(BRAND_NAME) ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-body: #0d0f12;
            --bg-card: #15181d;
            --bg-input: #0d0f12;
            --border-card: #22272e;
            --border-light: #2d333b;
            --text-primary: #f0f2f5;
            --text-secondary: #9aa2ad;
            --accent-orange: #ff6b00;
            --accent-hover: #ff7d1a;
            --danger: #ef4444;
            --success: #10b981;
            --warning: #f59e0b;
            --card-radius: 12px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            background-color: var(--bg-body);
            color: var(--text-primary);
            min-height: 100vh;
            padding-bottom: 90px;
            overflow-x: hidden;
        }

        /* Top Navigation Bar */
        .navbar {
            background: #111317;
            border-bottom: 1px solid var(--border-card);
            position: sticky;
            top: 0;
            z-index: 100;
            padding: 12px 20px;
        }
        .nav-inner {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: #fff;
        }
        .brand-img {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            object-fit: contain;
        }
        .brand-text h1 { font-size: 16px; font-weight: 800; letter-spacing: -0.3px; }
        .brand-text span { font-size: 11px; color: var(--accent-orange); font-weight: 700; text-transform: uppercase; }

        .nav-actions {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }
        .nav-link {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-secondary);
            text-decoration: none;
            padding: 8px 12px;
            border-radius: 8px;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: none;
            background: none;
            cursor: pointer;
        }
        .nav-link:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .nav-link.active { color: #fff; background: rgba(255, 107, 0, 0.15); border: 1px solid rgba(255, 107, 0, 0.3); }

        .user-pill {
            font-size: 12px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 20px;
            background: #1e232a;
            border: 1px solid #333a42;
            color: #cbd5e1;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        /* Storage Warning Banner */
        .storage-banner {
            max-width: 1400px;
            margin: 16px auto 0;
            padding: 12px 20px;
            background: rgba(245, 158, 11, 0.08);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 10px;
            font-size: 13px;
            color: #fcd34d;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        /* Stat Cards */
        .stats-grid {
            max-width: 1400px;
            margin: 20px auto;
            padding: 0 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
        }
        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: var(--card-radius);
            padding: 16px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .stat-info h3 { font-size: 11px; color: var(--text-secondary); font-weight: 700; margin-bottom: 4px; text-transform: uppercase; }
        .stat-info .num { font-size: 22px; font-weight: 800; color: #fff; }
        .stat-icon { color: var(--text-secondary); }

        /* Controls Section */
        .controls-wrapper {
            max-width: 1400px;
            margin: 0 auto 16px;
            padding: 0 20px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        .controls-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            flex-wrap: wrap;
        }
        .search-box {
            position: relative;
            flex: 1;
            min-width: 240px;
            max-width: 440px;
        }
        .search-box input {
            width: 100%;
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: 10px;
            padding: 12px 16px 12px 42px;
            color: #fff;
            font-size: 15px; /* iOS zoom engeli */
            outline: none;
            transition: all 0.2s;
        }
        .search-box input:focus { border-color: var(--accent-orange); box-shadow: 0 0 0 3px rgba(255,107,0,0.15); }
        .search-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
        }

        /* Filter Chips (Status & Issue filters) */
        .filter-chips-row {
            display: flex;
            align-items: center;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 4px;
            scrollbar-width: none;
        }
        .filter-chips-row::-webkit-scrollbar { display: none; }
        .filter-chip {
            padding: 6px 12px;
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: 20px;
            color: var(--text-secondary);
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .filter-chip:hover { color: #fff; border-color: var(--border-light); }
        .filter-chip.active { background: var(--accent-orange); color: #fff; border-color: var(--accent-orange); }

        /* Category Chips Bar */
        .category-filter {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 4px;
            scrollbar-width: none;
        }
        .category-filter::-webkit-scrollbar { display: none; }
        .cat-chip {
            padding: 8px 14px;
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: 8px;
            color: var(--text-secondary);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap; /* Asla kesilmesin */
            transition: all 0.2s;
        }
        .cat-chip:hover { color: #fff; border-color: var(--border-light); }
        .cat-chip.active { background: #22272e; color: var(--accent-orange); border-color: var(--accent-orange); }

        .btn {
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }
        .btn-add { background: var(--accent-orange); color: #fff; min-height: 44px; }
        .btn-add:hover { background: var(--accent-hover); }

        /* Product Desktop Table */
        .table-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
        }
        .table-card {
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: var(--card-radius);
            overflow: hidden;
        }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        th { background: #111317; padding: 14px 18px; color: var(--text-secondary); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border-card); white-space: nowrap; }
        td { padding: 12px 18px; border-bottom: 1px solid var(--border-card); vertical-align: middle; }
        tr:hover td { background: rgba(255, 255, 255, 0.015); }
        tr.item-hidden { opacity: 0.5; }

        .item-thumb {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            object-fit: cover;
            background: #1e2228;
            border: 1px solid #2a3038;
            display: block;
        }
        .item-info { max-width: 340px; }
        .item-name { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 2px; }
        .item-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        /* Price Input Box */
        .price-box {
            display: inline-flex;
            align-items: center;
            background: var(--bg-input);
            border: 1px solid var(--border-card);
            border-radius: 8px;
            padding: 2px 8px;
            min-height: 44px; /* 44px dokunma hedefi */
            transition: all 0.2s;
        }
        .price-box:focus-within { border-color: var(--accent-orange); }
        .price-box input {
            width: 80px;
            background: transparent;
            border: none;
            color: #fff;
            font-size: 16px;
            font-weight: 700;
            text-align: right;
            padding: 8px 4px;
            outline: none;
        }
        .price-box .cur { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-left: 2px; }

        .badge { font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 700; display: inline-block; white-space: nowrap; }
        .badge-cat { background: rgba(255, 255, 255, 0.06); color: var(--text-secondary); border: 1px solid #2a3038; }
        .badge-chef { background: rgba(255, 107, 0, 0.15); color: #ff9d4d; border: 1px solid rgba(255, 107, 0, 0.3); }

        /* Toggle Switches */
        .switch { position: relative; display: inline-block; width: 44px; height: 26px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #2a3038; transition: .2s; border-radius: 26px; }
        .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: #fff; transition: .2s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--accent-orange); }
        input.slider-danger:checked + .slider { background-color: var(--danger); }
        input:checked + .slider:before { transform: translateX(18px); }

        .btn-edit {
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid #333a42;
            background: rgba(255, 255, 255, 0.05);
            color: #cbd5e1;
            min-height: 40px;
        }
        .btn-edit:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }

        /* Mobile Card View (<= 768px) */
        .mobile-cards-grid {
            display: none;
            flex-direction: column;
            gap: 12px;
        }
        .m-card {
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: var(--card-radius);
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        .m-card.item-hidden { opacity: 0.55; }
        .m-card-top {
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }
        .m-card-thumb {
            width: 56px;
            height: 56px;
            border-radius: 10px;
            object-fit: cover;
            background: #1e2228;
            flex-shrink: 0;
            border: 1px solid #2a3038;
        }
        .m-card-meta { flex: 1; min-width: 0; }
        .m-card-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 2px; }
        .m-card-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.35; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

        .m-card-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            gap: 10px;
            flex-wrap: wrap;
        }
        .m-toggles { display: flex; align-items: center; gap: 14px; }
        .m-toggle-item { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: var(--text-secondary); }

        /* Floating Save Bar */
        .save-bar {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(120%);
            background: #1a1e24;
            border: 1px solid var(--accent-orange);
            border-radius: 12px;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            z-index: 999;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            max-width: 90vw;
        }
        .save-bar.visible { transform: translateX(-50%) translateY(0); }
        .save-text { font-size: 13px; font-weight: 600; color: #fff; }
        .btn-save-now {
            background: var(--accent-orange);
            color: #fff;
            border: none;
            padding: 10px 18px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            min-height: 44px;
        }

        /* Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 16px;
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s ease;
        }
        .modal-overlay.open { opacity: 1; visibility: visible; }
        .modal {
            background: var(--bg-card);
            border: 1px solid var(--border-card);
            border-radius: 16px;
            width: 100%;
            max-width: 520px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 24px;
        }
        .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid var(--border-card); }
        .modal-header h2 { font-size: 17px; font-weight: 800; color: #fff; }
        .modal-close { background: none; border: none; color: var(--text-secondary); font-size: 22px; cursor: pointer; }
        .form-row { margin-bottom: 14px; }
        .form-row label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
        .form-row input[type="text"], .form-row input[type="number"], .form-row textarea, .form-row select {
            width: 100%;
            padding: 11px 14px;
            background: var(--bg-input);
            border: 1px solid var(--border-card);
            border-radius: 8px;
            color: #fff;
            font-size: 16px; /* Mobil Safari zoom engeli */
            outline: none;
        }
        .form-row input:focus, .form-row textarea:focus, .form-row select:focus { border-color: var(--accent-orange); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .upload-zone {
            border: 2px dashed #2d333b;
            border-radius: 10px;
            padding: 16px;
            text-align: center;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.01);
        }
        .upload-zone:hover { border-color: var(--accent-orange); }
        .upload-preview { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; margin: 0 auto 8px; display: none; }

        .danger-zone {
            margin-top: 24px;
            padding: 14px;
            background: rgba(239, 68, 68, 0.06);
            border: 1px solid rgba(239, 68, 68, 0.25);
            border-radius: 10px;
        }

        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 14px 20px;
            border-radius: 10px;
            background: #1b2027;
            color: #fff;
            border: 1px solid var(--border-card);
            font-size: 14px;
            display: none;
            z-index: 2000;
        }

        @media (max-width: 768px) {
            .table-card { display: none; }
            .mobile-cards-grid { display: flex; }
            .stats-grid { grid-template-columns: 1fr 1fr; }
            .navbar { padding: 10px 14px; }
            .controls-wrapper, .table-container { padding: 0 14px; }
            .save-bar { width: calc(100% - 28px); justify-content: space-between; }
        }
    </style>
</head>
<body>

    <!-- Üst Menü -->
    <header class="navbar">
        <div class="nav-inner">
            <a href="/yonetim/" class="brand">
                <img src="<?= htmlspecialchars(BRAND_LOGO) ?>" alt="Logo" class="brand-img" onerror="this.style.display='none'">
                <div class="brand-text">
                    <h1><?= htmlspecialchars(BRAND_NAME) ?></h1>
                    <span>Yönetim Paneli</span>
                </div>
            </a>
            <div class="nav-actions">
                <span class="user-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <?= htmlspecialchars($userName) ?> (<?= $userRole === 'yonetici' ? 'Yönetici' : 'Personel' ?>)
                </span>
                <a href="/" target="_blank" class="nav-link" title="Canlı Menüyü Aç">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    Menü
                </a>
                <?php if ($userRole === 'yonetici'): ?>
                    <a href="/yonetim/yedekler.php" class="nav-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                        Yedekler
                    </a>
                    <a href="/yonetim/kullanicilar.php" class="nav-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        Kullanıcılar
                    </a>
                    <a href="/yonetim/tani.php" class="nav-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        Tanı
                    </a>
                <?php endif; ?>
                <button type="button" class="nav-link" onclick="openLogsModal()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Son İşlemler
                </button>
                <a href="/yonetim/sifre.php" class="nav-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
                    Şifre Değiştir
                </a>
                <a href="/yonetim/cikis.php" class="nav-link" style="color: #f87171;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Çıkış
                </a>
            </div>
        </div>
    </header>

    <?php if (!IS_EXTERNAL_STORAGE): ?>
        <div class="storage-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
                <strong>Güvenlik Tavsiyesi:</strong> Kullanıcı verileri web klasörü (public) içinde çalışıyor. Maksimum güvenlik için cPanel'de <code>public_html</code> dışında <code>tasfirin-data</code> klasörü oluşturun. Detaylar <a href="/yonetim/tani.php" style="color:#fff; text-decoration:underline;">Tanı Sayfası</a> ve KURULUM.md'de anlatılmıştır.
            </div>
        </div>
    <?php endif; ?>

    <!-- İstatistik Kartları -->
    <section class="stats-grid">
        <div class="stat-card">
            <div class="stat-info">
                <h3>Toplam Ürün</h3>
                <div class="num" id="stat-total"><?= count($items) ?></div>
            </div>
            <svg class="stat-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
        </div>
        <div class="stat-card">
            <div class="stat-info">
                <h3>Tükendi</h3>
                <div class="num" id="stat-soldout" style="color: #f87171;">0</div>
            </div>
            <svg class="stat-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        </div>
        <div class="stat-card">
            <div class="stat-info">
                <h3>Gizlenen</h3>
                <div class="num" id="stat-hidden" style="color: #9aa2ad;">0</div>
            </div>
            <svg class="stat-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
        </div>
        <div class="stat-card">
            <div class="stat-info">
                <h3>Şefin Seçimi</h3>
                <div class="num" id="stat-chef" style="color: #ff9d4d;">0</div>
            </div>
            <svg class="stat-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff9d4d" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
    </section>

    <!-- Kontroller ve Filtreler -->
    <section class="controls-wrapper">
        <div class="controls-top">
            <div class="search-box">
                <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="searchInput" placeholder="Ürün adı, açıklama veya kategori ara...">
            </div>
            <?php if ($userRole === 'yonetici'): ?>
                <button type="button" class="btn btn-add" onclick="openAddProductModal()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Yeni Ürün Ekle
                </button>
            <?php endif; ?>
        </div>

        <!-- Durum ve Uyarı Filtre Çipleri -->
        <div class="filter-chips-row" id="issueFilterRow">
            <button type="button" class="filter-chip active" data-filter="all">Tümü (<span id="fc-all">0</span>)</button>
            <button type="button" class="filter-chip" data-filter="missing-desc">Açıklaması Eksik (<span id="fc-desc">0</span>)</button>
            <button type="button" class="filter-chip" data-filter="missing-img">Görseli Eksik (<span id="fc-img">0</span>)</button>
            <button type="button" class="filter-chip" data-filter="soldout">Tükendi (<span id="fc-soldout">0</span>)</button>
            <button type="button" class="filter-chip" data-filter="hidden">Gizli (<span id="fc-hidden">0</span>)</button>
            <button type="button" class="filter-chip" data-filter="chef">Şefin Seçimi (<span id="fc-chef">0</span>)</button>
        </div>

        <!-- Kategori Çipleri (Asla kesilmez) -->
        <div class="category-filter" id="categoryFilter">
            <button type="button" class="cat-chip active" data-cat="all">Tüm Kategoriler</button>
            <?php foreach ($categories as $cat): ?>
                <button type="button" class="cat-chip" data-cat="<?= htmlspecialchars($cat['id']) ?>">
                    <?= htmlspecialchars($cat['name']) ?>
                </button>
            <?php endforeach; ?>
        </div>
    </section>

    <!-- Ürün Görünümü (Masaüstü Tablo + Mobil Kartlar) -->
    <main class="table-container">
        <!-- Masaüstü Tablo -->
        <div class="table-card">
            <table>
                <thead>
                    <tr>
                        <th style="width: 56px;">Görsel</th>
                        <th>Ürün Bilgisi</th>
                        <th style="width: 140px;">Kategori</th>
                        <th style="width: 150px;">Fiyat (TL)</th>
                        <th style="width: 90px; text-align: center;">Tükendi</th>
                        <th style="width: 80px; text-align: center;">Gizle</th>
                        <th style="width: 100px; text-align: right;">İşlemler</th>
                    </tr>
                </thead>
                <tbody id="productTableBody"></tbody>
            </table>
        </div>

        <!-- Mobil Kart Listesi (<= 768px) -->
        <div class="mobile-cards-grid" id="mobileCardsContainer"></div>
    </main>

    <!-- Alt Kaydetme Çubuğu -->
    <div id="saveBar" class="save-bar">
        <div class="save-text">
            Kaydedilmemiş <span id="unsavedCount" style="color: var(--accent-orange); font-weight:800;">0</span> değişiklik!
        </div>
        <button type="button" class="btn-save-now" onclick="saveMenuToServer()">
            💾 Şimdi Kaydet
        </button>
    </div>

    <!-- Ürün Ekle / Düzenle Modalı -->
    <div id="productModal" class="modal-overlay">
        <div class="modal">
            <div class="modal-header">
                <h2 id="modalTitle">Ürünü Düzenle</h2>
                <button type="button" class="modal-close" onclick="closeProductModal()">&times;</button>
            </div>
            <form id="productForm" onsubmit="handleProductFormSubmit(event)">
                <input type="hidden" id="editItemId">

                <div class="form-row">
                    <label for="prodName">Ürün Adı *</label>
                    <input type="text" id="prodName" required placeholder="Örn: Kuşbaşı Kaşarlı Pide">
                </div>

                <div class="form-grid">
                    <div class="form-row">
                        <label for="prodCategory">Kategori *</label>
                        <select id="prodCategory" required>
                            <?php foreach ($categories as $cat): ?>
                                <option value="<?= htmlspecialchars($cat['id']) ?>"><?= htmlspecialchars($cat['name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-row">
                        <label for="prodPrice">Fiyat (TL) *</label>
                        <input type="number" id="prodPrice" required step="1" min="0" placeholder="Örn: 240">
                    </div>
                </div>

                <div class="form-row">
                    <label for="prodDesc">Açıklama / İçerik</label>
                    <textarea id="prodDesc" rows="3" placeholder="Ürün malzemeleri ve detaylar"></textarea>
                </div>

                <?php if ($userRole === 'yonetici'): ?>
                    <div class="form-row">
                        <label>Ürün Fotoğrafı</label>
                        <div class="upload-zone" onclick="document.getElementById('imageFileInput').click()">
                            <img id="imagePreview" class="upload-preview" alt="Önizleme">
                            <div id="uploadPlaceholder">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:4px;"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><br>
                                <span style="font-size: 13px; color: var(--text-secondary);">Görsel seçmek için tıklayın</span><br>
                                <span style="font-size: 11px; color: #64748b;">(Otomatik 400x400 kare WebP yapılır)</span>
                            </div>
                        </div>
                        <input type="file" id="imageFileInput" accept="image/jpeg,image/png,image/webp" style="display: none;" onchange="handleImageFileSelected(this)">
                        <input type="hidden" id="prodImage" value="">
                    </div>
                <?php endif; ?>

                <div class="form-grid" style="margin-top: 10px;">
                    <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#fff; cursor:pointer;">
                        <input type="checkbox" id="prodChef" style="width:16px; height:16px; accent-color:var(--accent-orange);"> ⭐ Şefin Seçimi
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#fff; cursor:pointer;">
                        <input type="checkbox" id="prodSpicy" style="width:16px; height:16px; accent-color:var(--accent-orange);"> 🌶️ Acılı
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#fff; cursor:pointer;">
                        <input type="checkbox" id="prodNew" style="width:16px; height:16px; accent-color:var(--accent-orange);"> 🟢 Yeni Rozeti
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#fff; cursor:pointer;">
                        <input type="checkbox" id="prodSoldOut" style="width:16px; height:16px; accent-color:var(--accent-orange);"> 🚫 Tükendi
                    </label>
                </div>

                <!-- Güvenli Ürünü Kaldır / Gizle Bölümü (Yönetici) -->
                <?php if ($userRole === 'yonetici'): ?>
                    <div id="dangerZoneWrap" class="danger-zone" style="display: none;">
                        <div style="font-size: 13px; font-weight: 700; color: #f87171; margin-bottom: 6px;">Ürünü Kaldır veya Gizle</div>
                        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 10px;">
                            Ürünü tamamen silmek yerine geçici olarak <strong>Gizlemeyi</strong> tercih edebilirsiniz. Kalıcı silmek istiyorsanız aşağıdaki kutuya ürünün tam adını yazınız.
                        </p>
                        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                            <button type="button" class="btn" style="background:#22272e; color:#cbd5e1; font-size:12px;" onclick="hideCurrentEditingProduct()">
                                👁️ Ürünü Gizle
                            </button>
                        </div>
                        <div style="margin-top: 8px;">
                            <input type="text" id="confirmDeleteInput" placeholder="Onaylamak için ürünün adını yazın" style="font-size: 13px; padding: 8px 12px; margin-bottom: 8px;">
                            <button type="button" class="btn" style="background:var(--danger); color:#fff; font-size:12px; width:100%;" onclick="confirmDeleteCurrentProduct()">
                                🗑️ Ürünü Kalıcı Olarak Sil
                            </button>
                        </div>
                    </div>
                <?php endif; ?>

                <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button type="button" class="btn" style="background:#22272e; color:#fff;" onclick="closeProductModal()">İptal</button>
                    <button type="submit" class="btn btn-add">Kaydet</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Son İşlemler (Audit Log) Modalı -->
    <div id="logsModal" class="modal-overlay">
        <div class="modal" style="max-width: 650px;">
            <div class="modal-header">
                <h2>Son İşlemler (Audit Log)</h2>
                <button type="button" class="modal-close" onclick="closeLogsModal()">&times;</button>
            </div>
            <div id="logsContainer" style="max-height: 380px; overflow-y: auto; font-family: monospace; font-size: 12px; background: #0b0d10; padding: 12px; border-radius: 8px; border: 1px solid var(--border-card); line-height: 1.6; color: #cbd5e1;">
                Yükleniyor...
            </div>
            <div style="margin-top: 18px; text-align: right;">
                <button type="button" class="btn" style="background:#22272e; color:#fff;" onclick="closeLogsModal()">Kapat</button>
            </div>
        </div>
    </div>

    <!-- Toast Bildirimi -->
    <div id="toast" class="toast" role="alert" aria-live="polite"></div>

    <script>
        const CSRF_TOKEN = <?= json_encode($csrfToken) ?>;
        const USER_ROLE = <?= json_encode($userRole) ?>;
        let currentRevision = <?= (int)$revision ?>;
        let menuCategories = <?= json_encode($categories) ?>;
        let menuItems = <?= json_encode($items) ?>;

        const originalItemsMap = new Map();
        menuItems.forEach(it => { originalItemsMap.set(it.id, JSON.parse(JSON.stringify(it))); });

        let currentCategory = 'all';
        let currentIssueFilter = 'all';
        let searchQuery = '';
        let hasUnsavedChanges = false;
        let currentlyEditingItemId = null;

        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'Kaydedilmemiş değişiklikleriniz var!';
            }
        });

        function showToast(msg, isError = false) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.style.borderColor = isError ? '#ef4444' : '#10b981';
            toast.style.display = 'block';
            setTimeout(() => { toast.style.display = 'none'; }, 3800);
        }

        function updateCounts() {
            document.getElementById('stat-total').textContent = menuItems.length;
            document.getElementById('stat-soldout').textContent = menuItems.filter(i => i.soldOut).length;
            document.getElementById('stat-hidden').textContent = menuItems.filter(i => i.hidden).length;
            document.getElementById('stat-chef').textContent = menuItems.filter(i => i.tags && i.tags.includes('sef')).length;

            document.getElementById('fc-all').textContent = menuItems.length;
            document.getElementById('fc-desc').textContent = menuItems.filter(i => !i.description || i.description.trim() === '').length;
            document.getElementById('fc-img').textContent = menuItems.filter(i => !i.image || i.image.includes('placeholder') || i.image.includes('logo-badge')).length;
            document.getElementById('fc-soldout').textContent = menuItems.filter(i => i.soldOut).length;
            document.getElementById('fc-hidden').textContent = menuItems.filter(i => i.hidden).length;
            document.getElementById('fc-chef').textContent = menuItems.filter(i => i.tags && i.tags.includes('sef')).length;
        }

        function checkUnsaved() {
            let count = 0;
            menuItems.forEach(it => {
                const orig = originalItemsMap.get(it.id);
                if (!orig || JSON.stringify(orig) !== JSON.stringify(it)) count++;
            });
            originalItemsMap.forEach((orig, id) => {
                if (!menuItems.some(it => it.id === id)) count++;
            });

            hasUnsavedChanges = count > 0;
            const bar = document.getElementById('saveBar');
            document.getElementById('unsavedCount').textContent = count;
            if (hasUnsavedChanges) bar.classList.add('visible');
            else bar.classList.remove('visible');
        }

        function renderList() {
            const tbody = document.getElementById('productTableBody');
            const mContainer = document.getElementById('mobileCardsContainer');
            tbody.innerHTML = '';
            mContainer.innerHTML = '';

            const filtered = menuItems.filter(item => {
                if (currentCategory !== 'all' && item.category !== currentCategory) return false;

                // Sorun / Durum filtresi
                if (currentIssueFilter === 'missing-desc' && item.description && item.description.trim() !== '') return false;
                if (currentIssueFilter === 'missing-img' && item.image && !item.image.includes('logo-badge')) return false;
                if (currentIssueFilter === 'soldout' && !item.soldOut) return false;
                if (currentIssueFilter === 'hidden' && !item.hidden) return false;
                if (currentIssueFilter === 'chef' && (!item.tags || !item.tags.includes('sef'))) return false;

                // Arama
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const inName = item.name.toLowerCase().includes(q);
                    const inDesc = (item.description || '').toLowerCase().includes(q);
                    const inCat = item.category.toLowerCase().includes(q);
                    if (!inName && !inDesc && !inCat) return false;
                }
                return true;
            });

            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--text-secondary);">Kriterlere uygun ürün bulunamadı.</td></tr>`;
                mContainer.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-secondary);">Kriterlere uygun ürün bulunamadı.</div>`;
                return;
            }

            filtered.forEach(item => {
                const catObj = menuCategories.find(c => c.id === item.category);
                const catName = catObj ? catObj.name : item.category;
                const isChef = item.tags && item.tags.includes('sef');
                const imgSrc = item.image || '/logo-badge.png';

                // 1. Masaüstü Tablo Satırı
                const tr = document.createElement('tr');
                if (item.hidden) tr.classList.add('item-hidden');
                tr.innerHTML = `
                    <td>
                        <img src="${imgSrc}" class="item-thumb" alt="${item.name}" onerror="this.src='/logo-badge.png'">
                    </td>
                    <td>
                        <div class="item-info">
                            <div class="item-name">
                                ${item.name}
                                ${isChef ? '<span class="badge badge-chef" style="margin-left:6px;">⭐ Şef</span>' : ''}
                                ${item.isNew ? '<span class="badge badge-cat" style="color:#6ee7b7; border-color: rgba(16,185,129,0.3); margin-left:4px;">Yeni</span>' : ''}
                            </div>
                            <div class="item-desc">${item.description || '<em style="color:#64748b;">Açıklama girilmemiş</em>'}</div>
                        </div>
                    </td>
                    <td><span class="badge badge-cat">${catName}</span></td>
                    <td>
                        <div class="price-box">
                            <input type="number" value="${item.price}" min="0" step="1" onchange="handlePriceChange('${item.id}', this.value, this)">
                            <span class="cur">TL</span>
                        </div>
                    </td>
                    <td style="text-align: center;">
                        <label class="switch">
                            <input type="checkbox" class="slider-danger" ${item.soldOut ? 'checked' : ''} onchange="toggleSoldOut('${item.id}', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </td>
                    <td style="text-align: center;">
                        <label class="switch">
                            <input type="checkbox" ${item.hidden ? 'checked' : ''} onchange="toggleHidden('${item.id}', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </td>
                    <td style="text-align: right;">
                        <button type="button" class="btn-edit" onclick="openEditProductModal('${item.id}')">Düzenle</button>
                    </td>
                `;
                tbody.appendChild(tr);

                // 2. Mobil Kart Satırı (<= 768px)
                const mc = document.createElement('div');
                mc.className = `m-card ${item.hidden ? 'item-hidden' : ''}`;
                mc.innerHTML = `
                    <div class="m-card-top">
                        <img src="${imgSrc}" class="m-card-thumb" alt="${item.name}" onerror="this.src='/logo-badge.png'">
                        <div class="m-card-meta">
                            <div class="m-card-title">${item.name} ${isChef ? '⭐' : ''}</div>
                            <div style="margin-bottom: 4px;"><span class="badge badge-cat">${catName}</span></div>
                            <div class="m-card-desc">${item.description || 'Açıklama girilmemiş'}</div>
                        </div>
                    </div>
                    <div class="m-card-controls">
                        <div class="price-box">
                            <input type="number" value="${item.price}" min="0" step="1" onchange="handlePriceChange('${item.id}', this.value, this)">
                            <span class="cur">TL</span>
                        </div>
                        <div class="m-toggles">
                            <div class="m-toggle-item">
                                <span>Tükendi</span>
                                <label class="switch">
                                    <input type="checkbox" class="slider-danger" ${item.soldOut ? 'checked' : ''} onchange="toggleSoldOut('${item.id}', this.checked)">
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="m-toggle-item">
                                <span>Gizle</span>
                                <label class="switch">
                                    <input type="checkbox" ${item.hidden ? 'checked' : ''} onchange="toggleHidden('${item.id}', this.checked)">
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        <button type="button" class="btn-edit" onclick="openEditProductModal('${item.id}')">Düzenle</button>
                    </div>
                `;
                mContainer.appendChild(mc);
            });

            updateCounts();
        }

        function handlePriceChange(id, newPriceVal, inputEl) {
            const item = menuItems.find(i => i.id === id);
            if (!item) return;

            const newPrice = parseFloat(newPriceVal);
            if (isNaN(newPrice) || newPrice < 0) {
                alert('Geçersiz fiyat!');
                inputEl.value = item.price;
                return;
            }

            const orig = originalItemsMap.get(id);
            const basePrice = orig ? orig.price : item.price;

            if (basePrice > 0) {
                const diffPercent = Math.abs((newPrice - basePrice) / basePrice) * 100;
                if (diffPercent >= 40) {
                    const confirmMsg = `Dikkat: "${item.name}" fiyatı %${Math.round(diffPercent)} oranında değişiyor!\n\nEski Fiyat: ${basePrice} TL\nYeni Fiyat: ${newPrice} TL\n\nBu değişikliği onaylıyor musunuz?`;
                    if (!confirm(confirmMsg)) {
                        inputEl.value = item.price;
                        return;
                    }
                }
            }

            item.price = newPrice;
            checkUnsaved();
        }

        function toggleSoldOut(id, val) {
            const item = menuItems.find(i => i.id === id);
            if (item) {
                item.soldOut = val;
                checkUnsaved();
                updateCounts();
            }
        }

        function toggleHidden(id, val) {
            const item = menuItems.find(i => i.id === id);
            if (item) {
                item.hidden = val;
                checkUnsaved();
                renderList();
            }
        }

        // Filtre Olayları
        document.getElementById('searchInput').addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            renderList();
        });

        document.getElementById('issueFilterRow').addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-chip');
            if (!chip) return;
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentIssueFilter = chip.dataset.filter;
            renderList();
        });

        document.getElementById('categoryFilter').addEventListener('click', (e) => {
            const chip = e.target.closest('.cat-chip');
            if (!chip) return;
            document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCategory = chip.dataset.cat;
            renderList();
        });

        // Sunucuya Kaydetme (API /api/menu.php with Concurrency Revision)
        async function saveMenuToServer() {
            const saveBtn = document.querySelector('.btn-save-now');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Kaydediliyor...';

            try {
                const payload = {
                    revision: currentRevision,
                    categories: menuCategories,
                    items: menuItems
                };

                const res = await fetch('/api/menu.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': CSRF_TOKEN
                    },
                    body: JSON.stringify(payload)
                });

                if (res.status === 409) {
                    // Eşzamanlılık Çatışması (409 Conflict)
                    const errData = await res.json();
                    localStorage.setItem('lovemacun_menu_conflict_draft', JSON.stringify(menuItems));
                    alert(errData.error || 'Menü başka bir kullanıcı tarafından güncellendi! Taslağınız tarayıcınızda saklandı.');
                    location.reload();
                    return;
                }

                const data = await res.json();
                if (data.success) {
                    currentRevision = data.revision;
                    showToast('✓ Menü başarıyla kaydedildi ve yedeklendi!');
                    originalItemsMap.clear();
                    menuItems.forEach(it => { originalItemsMap.set(it.id, JSON.parse(JSON.stringify(it))); });
                    checkUnsaved();
                } else {
                    alert('Hata: ' + (data.error || 'Kaydedilemedi.'));
                }
            } catch (err) {
                alert('İstek hatası: ' + err.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = '💾 Şimdi Kaydet';
            }
        }

        // Modal İşlemleri
        function openAddProductModal() {
            currentlyEditingItemId = null;
            document.getElementById('modalTitle').textContent = 'Yeni Ürün Ekle';
            document.getElementById('editItemId').value = '';
            document.getElementById('prodName').value = '';
            document.getElementById('prodCategory').value = currentCategory !== 'all' ? currentCategory : (menuCategories[0]?.id || 'lahmacun');
            document.getElementById('prodPrice').value = '';
            document.getElementById('prodDesc').value = '';
            if (document.getElementById('prodImage')) document.getElementById('prodImage').value = '';
            if (document.getElementById('imagePreview')) document.getElementById('imagePreview').style.display = 'none';
            if (document.getElementById('uploadPlaceholder')) document.getElementById('uploadPlaceholder').style.display = 'block';
            document.getElementById('prodChef').checked = false;
            document.getElementById('prodSpicy').checked = false;
            document.getElementById('prodNew').checked = true;
            document.getElementById('prodSoldOut').checked = false;

            const dz = document.getElementById('dangerZoneWrap');
            if (dz) dz.style.display = 'none';

            document.getElementById('productModal').classList.add('open');
        }

        function openEditProductModal(id) {
            const item = menuItems.find(i => i.id === id);
            if (!item) return;

            currentlyEditingItemId = id;
            document.getElementById('modalTitle').textContent = 'Ürünü Düzenle: ' + item.name;
            document.getElementById('editItemId').value = item.id;
            document.getElementById('prodName').value = item.name;
            document.getElementById('prodCategory').value = item.category;
            document.getElementById('prodPrice').value = item.price;
            document.getElementById('prodDesc').value = item.description || '';
            if (document.getElementById('prodImage')) document.getElementById('prodImage').value = item.image || '';

            const preview = document.getElementById('imagePreview');
            const placeholder = document.getElementById('uploadPlaceholder');
            if (preview && placeholder) {
                if (item.image) {
                    preview.src = item.image;
                    preview.style.display = 'block';
                    placeholder.style.display = 'none';
                } else {
                    preview.style.display = 'none';
                    placeholder.style.display = 'block';
                }
            }

            document.getElementById('prodChef').checked = item.tags && item.tags.includes('sef');
            document.getElementById('prodSpicy').checked = item.tags && item.tags.includes('acili');
            document.getElementById('prodNew').checked = !!item.isNew;
            document.getElementById('prodSoldOut').checked = !!item.soldOut;

            // Güvenli Silme Alanını Göster
            const dz = document.getElementById('dangerZoneWrap');
            if (dz) {
                dz.style.display = 'block';
                document.getElementById('confirmDeleteInput').value = '';
            }

            document.getElementById('productModal').classList.add('open');
        }

        function closeProductModal() {
            document.getElementById('productModal').classList.remove('open');
        }

        function hideCurrentEditingProduct() {
            if (!currentlyEditingItemId) return;
            toggleHidden(currentlyEditingItemId, true);
            closeProductModal();
            showToast('Ürün gizlendi. Kaydet butonuna basmayı unutmayın.');
        }

        function confirmDeleteCurrentProduct() {
            if (!currentlyEditingItemId) return;
            const item = menuItems.find(i => i.id === currentlyEditingItemId);
            if (!item) return;

            const inputVal = document.getElementById('confirmDeleteInput').value.trim();
            if (inputVal.toLowerCase() !== item.name.toLowerCase()) {
                alert(`Lütfen onaylamak için ürünün adını tam olarak yazın: "${item.name}"`);
                return;
            }

            menuItems = menuItems.filter(i => i.id !== currentlyEditingItemId);
            closeProductModal();
            renderList();
            checkUnsaved();
            showToast(`"${item.name}" menüden silindi. Kaydet butonuna basmayı unutmayın.`);
        }

        // Görsel Yükleme (Otomatik 400x400 WebP)
        async function handleImageFileSelected(input) {
            if (!input.files || !input.files[0]) return;
            const file = input.files[0];
            const cat = document.getElementById('prodCategory').value;

            const formData = new FormData();
            formData.append('image', file);
            formData.append('category', cat);
            formData.append('csrf_token', CSRF_TOKEN);

            const placeholder = document.getElementById('uploadPlaceholder');
            placeholder.innerHTML = '<span>Yükleniyor ve kırpılıyor... ⏳</span>';

            try {
                const res = await fetch('/api/upload.php', {
                    method: 'POST',
                    headers: { 'X-CSRF-Token': CSRF_TOKEN },
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    document.getElementById('prodImage').value = data.path;
                    const preview = document.getElementById('imagePreview');
                    preview.src = data.path;
                    preview.style.display = 'block';
                    placeholder.style.display = 'none';
                    showToast('Görsel başarıyla yüklendi!');
                } else {
                    alert('Görsel yüklenemedi: ' + (data.error || 'Bilinmeyen hata'));
                    placeholder.style.display = 'block';
                    placeholder.innerHTML = '<span>Görsel seçmek için tıklayın</span>';
                }
            } catch (err) {
                alert('Yükleme hatası: ' + err.message);
            }
        }

        function handleProductFormSubmit(e) {
            e.preventDefault();

            const editId = document.getElementById('editItemId').value;
            const name = document.getElementById('prodName').value.trim();
            const category = document.getElementById('prodCategory').value;
            const price = parseFloat(document.getElementById('prodPrice').value);
            const desc = document.getElementById('prodDesc').value.trim();
            const imageInput = document.getElementById('prodImage');
            const image = imageInput ? imageInput.value.trim() : '';

            const tags = [];
            if (document.getElementById('prodChef').checked) tags.push('sef');
            if (document.getElementById('prodSpicy').checked) tags.push('acili');

            const isNew = document.getElementById('prodNew').checked;
            const soldOut = document.getElementById('prodSoldOut').checked;

            if (editId) {
                const item = menuItems.find(i => i.id === editId);
                if (item) {
                    item.name = name;
                    item.category = category;
                    item.price = price;
                    item.description = desc;
                    if (image) item.image = image;
                    item.tags = tags;
                    item.isNew = isNew;
                    item.soldOut = soldOut;
                }
            } else {
                const slugId = category + '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const newItem = {
                    id: slugId,
                    category: category,
                    name: name,
                    price: price,
                    description: desc,
                    image: image || '/logo-badge.png',
                    tags: tags,
                    featuredOrder: 0,
                    isNew: isNew,
                    soldOut: soldOut,
                    hidden: false
                };
                menuItems.unshift(newItem);
            }

            closeProductModal();
            renderList();
            checkUnsaved();
            showToast(`"${name}" güncellendi. Kaydet butonuna basın.`);
        }

        async function openLogsModal() {
            const modal = document.getElementById('logsModal');
            const container = document.getElementById('logsContainer');
            container.textContent = 'Loglar yükleniyor...';
            modal.classList.add('open');

            try {
                const res = await fetch('/api/logs.php');
                const data = await res.json();
                if (data.success && data.logs && data.logs.length > 0) {
                    container.innerHTML = data.logs.map(line => `<div>${escapeHtml(line)}</div>`).join('');
                } else {
                    container.textContent = 'Henüz kayıtlı denetim izi bulunamadı.';
                }
            } catch (err) {
                container.textContent = 'Loglar alınamadı: ' + err.message;
            }
        }

        function closeLogsModal() {
            document.getElementById('logsModal').classList.remove('open');
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        renderList();
        updateCounts();
    </script>
</body>
</html>
