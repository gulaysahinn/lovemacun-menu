# Taş Fırın Lovemacun — Proje Temizlik ve Güvenlik Raporu

> **Tarih:** 2026-10-20  
> **Dal (Branch):** `cleanup`  
> **Başlangıç Etiketi (Baseline Tag):** `pre-cleanup-2026-10-18`

---

## 1. Silinen ve Taşınan Öğeler Özeti

| Kategori | Dosya / Dizin | Boyut | Silinme / Taşınma Nedeni | Geri Alma Yolu |
| :--- | :--- | :--- | :--- | :--- |
| **Ölü Kaynak Kod** | `src/HeroFoodAnimation.jsx` | 5.9 KB | Hiçbir bileşende import edilmiyordu, ölü kod. | `git checkout pre-cleanup-2026-10-18 -- src/HeroFoodAnimation.jsx` |
| **Kullanılmayan Medya** | `public/hero.mp4` | 5.1 MB | Sitede `public/video/` altındaki optimize webm/mp4 videolar kullanılıyor. Kök `hero.mp4` kullanılmıyordu. | `git checkout pre-cleanup-2026-10-18 -- public/hero.mp4` |
| **Kullanılmayan Medya** | `public/ingredients/` (7 webp) | ~110 KB | Silinen `HeroFoodAnimation.jsx` bileşeninin artıklarıydı. | `git checkout pre-cleanup-2026-10-18 -- public/ingredients/` |
| **Ham Videolar (Taşındı)** | `raw-assets/` (2 video) | ~10.0 MB | Ham çekim dosyaları. Güvenli şekilde `C:\Users\gulay\Downloads\` klasörüne taşındı ve repodan çıkarıldı. | Harici konumdan repoya geri kopyalanabilir. |
| **Eski Yedek Kalıntıları** | `public/backups/*.json` | ~202 KB | Canlı menü yedekleri `tasfirin-data/backups/` altında saklanır; public dizinindeki eski kopyalar kaldırıldı. | `git checkout pre-cleanup-2026-10-18 -- public/backups/` |
| **Eski Görseller** | `public/about/lovemacun-story-banner.jpg` | 436 KB | `StoryPage` yeni görseller kullanıyor; eski banner ve boş `about/` klasörleri silindi. | `git checkout pre-cleanup-2026-10-18 -- public/about/` |
| **Dev / Test Artıkları** | `scripts/*.png` (40 ekran görüntüsü) | 18.4 MB | Tek seferlik doğrulama ekran görüntüleri. | `git checkout pre-cleanup-2026-10-18 -- scripts/` |
| **Dev / Test Artıkları** | `screenshots/` klasörü | 68.6 MB | Yerel geliştirme ekran görüntüleri. | .gitignore'a eklendi, gerekirse yerel yedekten alınabilir. |
| **Dev Scriptleri** | `scripts/test-*.mjs`, `verify-*.mjs` (28 script) | ~250 KB | Geliştirme sürecinde kullanılan geçici doğrulama betikleri. Yerine tek merkezli `npm run test:release` eklendi. | `git checkout pre-cleanup-2026-10-18 -- scripts/` |
| **Hassas Script** | `scripts/reset-admin.php` | 2.1 KB | Yetkisiz erişim riski olmaması için silindi; panel şifre sıfırlama adımı dokümante edildi. | `git checkout pre-cleanup-2026-10-18 -- scripts/reset-admin.php` |

---

## 2. Dışarıya Taşınan Ham Videoların Bütünlük Doğrulaması

Proje dışındaki güvenli kopyalar (`C:\Users\gulay\Downloads\`):
- `lahmacun.mp4`: `DC3186FB275FF705064A2A6E7021CF221237AC9A31DFDB13511EF84C5E5EC2B1`
- `gemini_generated_video_be160e46.mp4`: `9E1929BCD7E68DB7B65013C76E366187BFDF6A838F43CD532F2CF8073017918F`

---

## 3. Güvenlik ve Yasaklı Dosya Denetimi

Üretilen ZIP paketlerinde (`release/lovemacun-staging-*.zip` ve `release/lovemacun-prod-*.zip`):
- `users.json`, `kurulum.lock`, `.env`, `setup_key`, `KURULUM-ANAHTARI`, `.git`, `node_modules` gibi hassas öğe eşleşmesi: **0 (SIFIR)**.
- Staging paketinde `noindex` ve `Disallow: /` zorunlu aktif.
- Production paketinde temiz SEO ve sitemap yönlendirmesi aktif.

---

## 4. Geri Alma (Rollback) Prosedürü

Temizlik öncesindeki tam duruma geri dönmek gerekirse:
```bash
# Temizlik öncesi etiketine geri dön
git checkout pre-cleanup-2026-10-18

# Veya mevcut cleanup dalındaki değişiklikleri temizle
git reset --hard pre-cleanup-2026-10-18
```
