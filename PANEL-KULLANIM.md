# Lovemacun Menü Yönetim Paneli - Kullanım Kılavuzu

Bu kılavuz, restoran yetkilileri ve personelin kod bilmeden menü fiyatlarını, ürün durumlarını ve görsellerini nasıl güncelleyeceğini adım adım anlatır.

---

## 1. Panele Giriş Yapma

1. Tarayıcınızdan yönetim adresi olan **`/yonetim/`** veya **`/yonetim/login.php`** adresini açın.
2. Kurulumda belirlediğiniz şifreyi girip **"Güvenli Giriş Yap"** butonuna tıklayın.
3. 30 dakika boyunca hiçbir işlem yapmazsanız oturumunuz güvenlik nedeniyle otomatik olarak kapanır ve tekrar şifre ister.

---

## 2. Ürün Fiyatı Güncelleme (Hızlı ve Toplu)

1. Menü listesinde değiştirmek istediğiniz ürünün yanındaki **Fiyat (TL)** kutucuğuna tıklayın.
2. Yeni fiyatı yazın.
3. **%40'tan Fazla Fiyat Değişikliği Güvenlik Uyarısı:**
   - Eğer yanlışlıkla çok yüksek veya düşük bir fiyat yazarsanız (örneğin 100 TL olan ürünü 200 TL yaparsanız), sistem ekranda bir onay kutusu çıkararak sizi uyarır:  
     *`"Dikkat: [Ürün Adı] fiyatı %X oranında değişiyor. Onaylıyor musunuz?"`*
4. İstediğiniz tüm ürünlerin fiyatlarını bu şekilde değiştirebilirsiniz.
5. Değişiklik yaptığınız anda ekranın altında turuncu **"Değişiklikleri Kaydet"** çubuğu belirir.
6. İşiniz bittiğinde **"💾 Şimdi Kaydet"** butonuna basarak tüm değişiklikleri canlı menüye yansıtın.

---

## 3. Ürünü "Tükendi" Olarak İşaretleme

Bir ürün o gün kalmadıysa veya servisi durdurulduysa:
1. İlgili ürünün satırındaki **Tükendi** anahtarına tıklayın (kırmızı renge döner).
2. Sayfanın altındaki **"💾 Şimdi Kaydet"** butonuna basın.
3. Canlı menüde ürünün üzerinde şık bir **"Tükendi"** rozeti çıkar ve müşteriler ürünün o an servis edilemediğini görür.
4. Ürün tekrar hazır olduğunda anahtarı kapatıp kaydetmeniz yeterlidir.

---

## 4. Ürünü Menüden Geçici Olarak Gizleme

Bir ürünü tamamen silmek yerine menüde geçici olarak müşterilere göstermemek için:
1. Ürün satırındaki **Gizle** anahtarına tıklayın.
2. Ürün satırı yönetim panelinde yarı saydam hale gelir.
3. **"💾 Şimdi Kaydet"** butonuna bastığınızda ürün canlı menüden ve arama sonuçlarından anında gizlenir.
4. İleride tekrar satışa açmak için anahtarı kapatıp kaydedebilirsiniz.

---

## 5. Yeni Ürün Ekleme veya Mevcut Ürünü Düzenleme

### Yeni Ürün Ekleme:
1. Üstteki turuncu **"➕ Yeni Ürün Ekle"** butonuna tıklayın.
2. Açılan pencerede:
   - **Ürün Adı:** Örn. *Kuşbaşı Kaşarlı Pide*
   - **Kategori:** Açılır menüden kategorisini seçin.
   - **Fiyat:** Satış fiyatını TL cinsinden girin.
   - **Açıklama:** Ürün içeriği, gramaj veya porsiyon bilgisi.
   - **Ürün Görseli:** Fotoğraf yükleme alanına tıklayarak telefonunuzdan veya bilgisayarınızdan ürün fotoğrafını seçin.  
     *(Fotoğrafınız otomatik olarak 400x400 kare ve yüksek kaliteli WebP formatına dönüştürülür, elle kırpmanıza gerek yoktur).*
   - **Etiketler:** İsteğe bağlı olarak *Şefin Seçimi*, *Acılı* veya *Yeni Ürün* kutularını işaretleyin.
3. **"Kaydet"** butonuna tıklayın ve ardından ana sayfadaki **"💾 Şimdi Kaydet"** butonuna basarak işlemi tamamlayın.

---

## 6. Yedekler ve Yanlış Bir İşlemi Geri Alma

Yaptığınız bir işlemi eski haline getirmek veya geçmiş bir tarihteki menüye dönmek isterseniz:
1. Üst menüdeki **"📦 Yedekler"** butonuna tıklayın.
2. Burada yaptığınız her kaydetme işleminin tarih, saat ve ürün sayısıyla listelendiğini göreceksiniz.
3. Geri dönmek istediğiniz tarihin yanındaki **"↺ Geri Yükle"** butonuna tıklayın.
4. Çıkan onay kutusuna onay verin.
5. Sistem önce o anki durumun güvenlik yedeğini alır, ardından menüyü seçtiğiniz tarihteki haline saniyeler içinde geri döndürür.

---

## 7. Şifre Değiştirme ve Güvenli Çıkış

- Şifrenizi güncellemek için üst menüdeki **"🔑 Şifre Değiştir"** bağlantısına tıklayın. Mevcut şifrenizi ve yeni şifrenizi girerek güncelleyin.
- İşiniz bittiğinde sağ üstteki **"🚪 Çıkış Yap"** bağlantısına tıklayarak oturumunuzu güvenle kapatın.
