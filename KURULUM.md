# Taş Fırın Lovemacun — Yayınlama ve Kurulum Kılavuzu

> **Önemli Güvenlik Notu:** Bu belgeyi cPanel / sunucuya yüklemeden önce okuyun.  
> Şifre, kurulum anahtarı veya hash gibi gizli bilgiler bu belgeye asla yazılmaz.  
> Üretilen kurulum anahtarı yalnızca `release/KURULUM-ANAHTARI-<tarih>.txt` içinde yerel bilgisayarınızda saklanır ve ZIP paketlerinin içine konmaz.

---

## 1. Ön Gereksinimler

| Bileşen | Minimum | Tavsiye Edilen |
|---|---|---|
| **PHP Sürümü** | 7.4 | PHP 8.1 / 8.2 |
| **PHP Uzantıları** | `json`, `mbstring`, `fileinfo`, `gd` (WebP destekli), `session` | Tüm modern cPanel kurulumlarında varsayılandır |
| **Web Sunucusu** | Apache 2.4 veya LiteSpeed (`mod_rewrite`, `mod_headers`) | cPanel standart |
| **Disk Alanı** | 200 MB | 500 MB+ |
| **SSL / HTTPS** | Zorunlu (Güvenli oturum çerezleri için) | Let's Encrypt / cPanel AutoSSL |

---

## 2. Dağıtım Paketlerinin Hazırlanması (Lokalde)

Projeyi derlemek ve kuruluma hazır ZIP paketlerini `release/` klasörüne oluşturmak için:

```bash
# Projeyi derle
npm run build

# 1) Staging (Test / Demo) Paketi Oluştur:
# (Arama motorlarına kapatılmıştır: noindex meta etiketi, X-Robots-Tag, robots.txt Disallow: /, sitemap yok)
npm run package:staging

# 2) Production (Canlı Yayın) Paketi Oluştur:
# (SEO meta etiketleri, sitemap.xml ve robots.txt aktif)
npm run package:prod
```

Paketleme komutu çalıştığında `release/` klasöründe iki dosya oluşur:
1. `release/lovemacun-staging-<YYYY-MM-DD>.zip` (veya `lovemacun-prod-...zip`)
2. `release/KURULUM-ANAHTARI-<YYYY-MM-DD>.txt` (Yalnızca sizin bilgisayarınızda, 32 karakterlik rastgele kurulum anahtarı)

> **Güvenlik Güvencesi:**  
> ZIP dosyası içerisine `users.json`, `kurulum.lock`, `.env`, `backups/`, `logs/` veya **açık metin kurulum anahtarı ASLA konmaz**.  
> ZIP içinde yalnızca anahtarın tek yönlü SHA-256 özeti (`yonetim/install_hash.php`) bulunur.

---

## 3. İlk Kurulum Adımları (cPanel / Sunucu)

### Adım 1 — ZIP Dosyasını Yükle ve Çıkar
1. cPanel'e giriş yapın → **Dosya Yöneticisi** (File Manager) → `public_html/` dizinine gidin.
2. `release/lovemacun-prod-<tarih>.zip` (veya staging) dosyasını `public_html/` içine yükleyin.
3. ZIP dosyasına sağ tıklayıp **Extract** (Çıkar) seçeneğiyle dosyaları `public_html/` içerisine açın.

### Adım 2 — ZIP Dosyasını Sunucudan Silin (Zorunlu)
> ⚠️ **KRİTİK GÜVENLİK ADIMI:** ZIP dosyasını sunucuda bırakmayın!  
> Dosyalar açıldıktan hemen sonra `lovemacun-*.zip` arşivini cPanel Dosya Yöneticisi'nden silin (`rm lovemacun-*.zip`).

### Adım 3 — Kurulum Sihirbazını Çalıştırın
1. Tarayıcınızda şu adresi açın:
   ```
   https://siteniz.com/yonetim/setup.php
   ```
2. `release/KURULUM-ANAHTARI-<tarih>.txt` dosyasındaki 32 karakterlik anahtarı yapıştırın.
3. İlk yönetici kullanıcı adını ve güçlü bir şifre (en az 12 karakter) belirleyin:
   - *"admin" veya "yonetici" gibi tahmin edilebilir adlardan kaçının.*
4. **"Kurulumu Tamamla ve Kilitle"** düğmesine tıklayın.
5. Kurulum başarıyla tamamlandığında sistem:
   - `yonetim/setup.lock` ve `tasfirin-data/kurulum.lock` kilit dosyalarını oluşturur.
   - `yonetim/install_hash.php` dosyasını sunucudan otomatik siler.
   - Sihirbaz tekrar açılamaz hale gelir.

### Adım 4 — Sağlık Kontrolü (Tanı Sayfası)
Tarayıcınızda tanı sayfasını açarak 9 kritik kontrolü doğrulayın:
```
https://siteniz.com/yonetim/tani.php
```
- PHP sürümü, uzantılar, yazma izinleri, HTTPS ve depolama modu (güvenli `tasfirin-data/`) "BAŞARILI" olmalıdır.

---

## 4. Canlı Siteyi Güncelleme (Yeni Sürüm Yüklerken)

Sitede mevcut ürünleriniz, fiyatlarınız veya kullanıcılarınız varken yeni bir kod güncellemesi yaparken:

### Hangi Dosyalar Asla Ezilmez?
Paketleme sistemi veri kaybını önlemek üzere tasarlanmıştır:
- ✅ **`data/menu.json`**: ZIP paketine bilerek DAHİL EDİLMEZ. Yalnızca fabrika yedeği olan `data/menu.seed.json` bulunur. Bu sayede paneli güncellerken güncel menünüz ve fiyatlarınız **kesinlikle ezilmez**.
- ✅ **`tasfirin-data/users.json`**: Kullanıcı hesaplarınız `public_html` dışında veya korumalı alanda tutulur, ZIP ile ezilmez.
- ✅ **`tasfirin-data/backups/`**: Daha önce aldığınız yedekler korunur.
- ✅ **`tasfirin-data/logs/`**: Değişiklik ve denetim kayıtları korunur.
- ✅ **`img/uploads/`**: Yüklediğiniz ürün resimleri silinmez veya ezilmez.

### Güncelleme Adımı:
1. Lokal bilgisayarınızda `npm run package:prod` çalıştırın.
2. Yeni ZIP dosyasını cPanel `public_html/` içine yükleyin ve Extract yapın (üzerine yazmayı onaylayın).
3. ZIP dosyasını sunucudan hemen silin.
4. Menünüz, kullanıcılarınız ve ayarlarınız aynen yerinde kalır!

---

## 5. Güvenlik ve Depolama Mimarisi

Sistem verileri otomatik olarak hiyerarşik iki konumdan birinde saklar:

```
/home/kullaniciadi/
├── public_html/              ← Web erişimine açık klasör
│   ├── index.html            ← React menü arayüzü
│   ├── yonetim/              ← PHP yönetim paneli
│   │   ├── setup.php         ← Kurulum sihirbazı (kilitli)
│   │   ├── setup.lock        ← Kurulum kilidi
│   │   └── tani.php          ← Sistem sağlık testi
│   ├── data/
│   │   ├── menu.json         ← Canlı menü verisi (web okuyabilir, panel yazar)
│   │   └── menu.seed.json    ← Fabrika şablonu (ilk kurulumda kopyalanır)
│   └── img/uploads/          ← Yüklenen ürün görselleri (.htaccess ile PHP çalıştırma engelli)
│
└── tasfirin-data/            ← GÜVENLİ DEPOLAMA (Web erişimine tamamen kapalı)
    ├── users.json            ← Kullanıcı hesapları (Argon2ID/BCRYPT hash'li)
    ├── kurulum.lock          ← İkincil kurulum kilidi
    ├── backups/              ← Otomatik ve manuel menü yedekleri
    └── logs/                 ← Denetim, oturum ve değişiklik logları
```

> **Not:** Hosting PHP ayarları `public_html` dışına çıkmaya izin vermiyorsa (open_basedir kısıtı varsa), sistem otomatik olarak `public_html/yonetim/tasfirin-data/` içerisine geçer ve `.htaccess` kuralıyla tüm HTTP erişimini 403 Forbidden ile bloke eder.

---

## 6. Kurtarma ve Sıfırlama Senaryoları

### Senaryo A — İlk Kurulum Anahtarını Kaybettim (Henüz Kurulum Yapılmadıysa)
1. cPanel Dosya Yöneticisi'ne gidin.
2. `public_html/yonetim/setup.lock` ve `yonetim/kurulum.lock` varsa silin.
3. Lokal bilgisayarınızda tekrar `npm run package:prod` çalıştırın veya `node scripts/generate-setup-key.mjs` ile yeni anahtar üretip sunucuya `yonetim/install_hash.php` dosyasını yükleyin.

### Senaryo B — Yönetici Şifresini Unuttum
Sunucuya SSH erişiminiz varsa:
```bash
php scripts/reset-admin.php
```
Veya cPanel Dosya Yöneticisi üzerinden `tasfirin-data/users.json` dosyasını geçici olarak silip/yeniden adlandırıp `yonetim/setup.lock` dosyasını kaldırırsanız kurulum sihirbazı yeniden yeni bir yönetici oluşturmanıza olanak tanır.

### Senaryo C — Menüde Yanlış Değişiklik Yapıldı (Geri Yükleme - Rollback)
1. **Panelden:** Yönetim Paneli → **Yedekler** sekmesine gidin. İstediğiniz tarihli yedeğin yanındaki **"Geri Yükle"** düğmesine tıklayın.
2. **Elle (Panel açılmıyorsa):** `tasfirin-data/backups/` klasöründeki en son geçerli `.json` yedeğini alıp `public_html/data/menu.json` üzerine kopyalayın.

---

## 7. Yapılandırma ve İzinler Özeti

| Dizin / Dosya | Tavsiye Edilen İzin | Açıklama |
|---|---|---|
| `public_html/data/menu.json` | `644` (veya web yazabilir `664`) | Canlı menü dosyası |
| `public_html/img/uploads/` | `755` | Ürün resimleri yükleme klasörü |
| `tasfirin-data/` | `700` veya `750` | Web dışı veri alanı |
| `tasfirin-data/users.json` | `600` | Kullanıcı kimlik bilgileri |
| `.htaccess` dosyaları | `644` | Güvenlik yönergeleri |
