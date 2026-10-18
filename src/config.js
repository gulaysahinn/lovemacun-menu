// Taş Fırın Lovemacun - Merkezi İletişim ve Yapılandırma Bilgileri
export const CONFIG = {
  name: 'Taş Fırın Lovemacun',
  slogan: 'Büyükada Taş Fırın & Kebap Lezzetleri',
  address: 'Nizam, Düz Sk. no: 1, 34970 Adalar/İstanbul',
  siteUrl: 'https://tasfirinlovemacun.com',

  // Telefon Numaraları (Kullanıcı teyidi: 0216 382 15 05 ana hat, 0216 382 19 94 yedek/ikincil hat)
  phonePrimary: {
    raw: '02163821505',
    tel: '+902163821505',
    display: '0216 382 15 05',
    label: 'Ana Hat',
  },
  phoneSecondary: {
    raw: '02163821994',
    tel: '+902163821994',
    display: '0216 382 19 94',
    label: 'İkincil Hat',
  },

  // WhatsApp Rezervasyon Numarası (Kullanıcı sonradan ekleyecek; boşken buton gizlenir, arama butonları gösterilir)
  whatsappNumber: '',

  // Çalışma Saatleri
  hours: '08:30 – 23:00',
  hoursDetail: 'Haftanın her günü 08:30 – 23:00 arası açık',

  // Sosyal Medya (Doğrulanmış resmi hesap)
  instagram: 'https://www.instagram.com/tasfirinlovemacunn/',

  // Harita ve Yol Tarifi Linkleri (Büyükada Taşfırın LoveMacun doğrulanmış yer konumu)
  mapsDirectionsUrl: 'https://www.google.com/maps/place/Ta%C5%9Ff%C4%B1r%C4%B1n+LoveMacun/@40.8735777,29.1284167,17z/data=!3m1!4b1!4m6!3m5!1s0x14cac1df6857961f:0x8e6f8355a0cf344e!8m2!3d40.8735777!4d29.1284167',
  mapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3015.4!2d29.1272!3d40.8744!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cac1df6857961f%3A0x8e6f8355a0cf344e!2sTa%C5%9Ff%C4%B1r%C4%B1n%20LoveMacun!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str',

  // QR Menü Linki (Doğrudan kök adres)
  qrMenuUrl: 'https://tasfirinlovemacun.com',

  // Beslenme etiketleri gösterim bayrağı
  // false = Vejetaryen / Vegan / Glutensiz etiketleri gizlenir (kod silinmez, mutfakla onaylanana kadar kapalı)
  // Şefin Seçimi (sef) ve Acılı (aci) her zaman görünür
  SHOW_DIET_TAGS: false,
}
