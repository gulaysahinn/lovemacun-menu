import { CONFIG } from './config.js'

export { CONFIG }

export const INFO = {
  name: CONFIG.name,
  address: CONFIG.address,
  phone: CONFIG.phonePrimary.raw,
  phoneTel: CONFIG.phonePrimary.tel,
  phoneText: CONFIG.phonePrimary.display,
  phoneSecondaryTel: CONFIG.phoneSecondary.tel,
  phoneSecondaryText: CONFIG.phoneSecondary.display,
  hours: CONFIG.hours,
  instagram: CONFIG.instagram,
  mapsDirectionsUrl: CONFIG.mapsDirectionsUrl,
  mapsEmbedUrl: CONFIG.mapsEmbedUrl,
}

export const CATS = [
  { id: 'lahmacun', name: 'Lahmacun', emoji: '🫓', items: [
    ['Kebaplı Lahmacun', 595, 'Kömür ateşinde pişmiş Adana veya Urfa kebabı sarılarak servis edilir.'],
    ['Dönerli Lahmacun', 515, 'Çıtır lahmacunun içinde yaprak et döner.'],
    ['Yumurtalı Lahmacun', 275, 'Fırına girmeden önce üzerine taze yumurta kırılır.'],
    ['Soğanlı Lahmacun', 255, 'Şanlıurfa usulü; bol soğan ve isot.'],
    ['Sarımsaklı Lahmacun', 265, 'Gaziantep usulü; bol taze sarımsak ve özel baharat.'],
    ['Kaşarlı Lahmacun', 310, 'Kıymalı harcın üzerine fırından çıkmadan bol kaşar.'],
  ]},
  { id: 'pide', name: 'Pide', emoji: '🥖', items: [
    ['Kıymalı Pide', 540, 'Karadeniz usulü; domatesli, biberli, soğanlı kıyma.'],
    ['Kıymalı Kaşarlı Pide', 550, 'Kıymalı harcın üzerine bolca kaşar.'],
    ['Kavurmalı Kaşarlı Pide', 595, 'Lokum kıvamında dana kavurma ve erimiş kaşar.'],
    ['Kaşarlı Sucuklu Pide', 520, 'Uzayan kaşar tabanında baharatlı sucuk dilimleri.'],
    ['Kuşbaşılı Kaşarlı Pide', 565, 'Domatesli biberli dana kuşbaşı ve bol kaşar.'],
    ['Tavuklu Pide', 540, 'Kapya biberle sote edilmiş sulu tavuk göğsü.'],
    ['Karışık Pide', 560, 'Tek pidede üç lezzet.'],
    ['Vejetaryen Pide', 515, 'Biber, mantar, kabak, mısır ve yeşilliklerle.'],
    ['Kaşarlı Pide', 495, 'Bol uzayan taze kaşar peynirli fırın pidesi.'],
  ]},
  { id: 'et', name: 'Et & Kebap', emoji: '🍢', items: [
    ['Adana Kebap', 650, 'Kömür ateşinde zırh kıymasıyla pişen acılı kebap.'],
    ['Kuzu Şiş', 795, 'Marine edilmiş kuzu küpleri, lokum kıvamında.'],
    ['Kuzu Pirzola', 1150, 'Izgarada mühürlenmiş kemikli kuzu pirzola.'],
    ['İskender Kebap', 620, 'Pide yatağında yaprak et döner, sıcak tereyağı ve yoğurt.'],
    ['Fırın Beyti', 785, 'Lavaş ekmeğine sarılı nefis zırh kıyması, domates sosu ve yoğurt ile.'],
    ['Patlıcanlı Kebap', 790, 'Özel baharatlı kebap köftesi ve patlıcan dilimi.'],
    ['Izgara Köfte', 655, 'Usta ellerde yoğrulmuş, içi sulu ızgara köfte.'],
    ['Et Döner (Porsiyon)', 585, '%100 dana yaprak döner; pilav ve patates ile.'],
    ['Et Güveç', 720, 'Toprak kapta ağır ateşte pişmiş dana.'],
    ['Karışık Et', 3850, 'Kebap ustalarının seçimi ziyafet tabağı.'],
  ]},
  { id: 'tavuk', name: 'Tavuk', emoji: '🍗', items: [
    ['Tavuk Şiş', 495], ['Tavuk Pirzola', 535], ['Tavuk Kanat', 525],
    ['Tavuk Döner', 485], ['Tavuk Şinitzel', 465], ['Köri Soslu Tavuk', 535],
    ['Tavuk Güveç', 595], ['Karışık Tavuk Tabağı', 3100],
  ]},
  { id: 'makarna', name: 'Makarna', emoji: '🍝', items: [
    ['Napoliten Spaghetti', 445, 'Klasik domates ve fesleğen sosuyla'], ['Bolognese Spaghetti', 545, 'Ağır ateşte pişmiş geleneksel kıymalı sos'], ['Sosisli Spaghetti', 480, 'Özel domates sosu ve sosis dilimleriyle'],
    ['Peynirli Spaghetti', 545, 'Eritme peynir ve taze otlar ile'], ['Penne Arrabbiata', 445, 'Acılı sarımsaklı domates sosu lezzeti'], ['Kremalı Mantarlı Penne', 575, 'Taze mantar ve zengin krema sosuyla'],
    ['Fettuccine Alfredo', 545, 'Özel krema sosu ve taze parmesan ile'], ['Mantarlı Fettuccine', 555, 'Kavrulmuş mantar ve lezzetli krema sosu'], ['Kayseri Mantısı', 515, 'Sarımsaklı yoğurt ve kızgın tereyağ sosu'],
  ]},
  { id: 'pizza', name: 'Pizza', emoji: '🍕', items: [
    ['Margarita Pizza', 495], ['Pepperoni Pizza', 525], ['Karışık Pizza', 545],
    ['Vejetaryen Pizza', 525], ['Tavuklu Pizza', 545], ['Ton Balıklı Pizza', 585],
    ['Pastırmalı Pizza', 610], ['Karidesli Pizza', 610], ['Et Dönerli Pizza', 615],
  ]},
  { id: 'sokak', name: 'Sokak Lezzetleri', emoji: '🌯', items: [
    ['Tavuk Dürüm', 345], ['Et Döner Dürüm', 450], ['Adana Dürüm', 595], ['Balık Dürüm', 390],
    ['Köfte Ekmek', 405], ['Tavuk Burger Menü', 465], ['Et Burger Menü', 485],
  ]},
  { id: 'balik', name: 'Balık', emoji: '🐟', items: [
    ['Izgara Levrek', 655], ['Izgara Çupura', 645], ['Izgara Somon', 685], ['Izgara Uskumru', 545],
    ['Tava Hamsi', 585], ['Çıtır Kalamar', 695], ['Karides Güveç', 685], ['Balık Ekmek', 355],
  ]},
  { id: 'kahvalti', name: 'Kahvaltı', emoji: '🍳', items: [
    ['Serpme Kahvaltı (2 Kişilik)', 850, 'Zengin peynir çeşitleri, zeytinler, reçeller, bal-kaymak, sahanda yumurta, börek ve sınırsız çay.'],
    ['Kahvaltı Tabağı', 380, 'Beyaz peynir, kaşar, zeytin, domates, salatalık, bal, tereyağı, haşlanmış yumurta ve taze ekmek.'],
    ['Menemen', 245, 'Köy yumurtası, taze domates ve biber ile bakır sahanda.'],
    ['Sucuklu Yumurta', 275, 'Kayseri sucuğu ve tereyağında köy yumurtası.'],
    ['Kaşarlı Omlet', 235, 'Taze çırpılmış yumurta ve bol kaşar peyniri.'],
    ['Sigara Böreği', 210, 'Çıtır yufka sarımı sıcak peynirli börek.'],
    ['Sosis Tabağı', 240, 'Özel sos ve patates eşliğinde ızgara sosis dilimleri.'],
  ]},
  { id: 'arasicak', name: 'Arasıcaklar', emoji: '🍟', items: [
    ['Combo Tabak', 545], ['İçli Köfte', 475], ['Falafel', 375], ['Fırında Mantar', 405],
    ['Patates Kızartması', 350], ['Kuru Fasulye', 350], ['Pirinç Pilavı', 280],
    ['Günün Çorbası', 220, 'Geleneksel usulde hazırlanan taze sıcak çorba.'],
  ]},
  { id: 'meze', name: 'Meze', emoji: '🫒', items: [
    ['Ordövr Tabağı', 625], ['Yaprak Sarma', 310], ['Humus', 310], ['Acı Ezme', 305], ['Çiğ Köfte', 395],
    ['Haydari', 285, 'Süzme yoğurt, taze nane ve sarımsak.'], ['Cacık', 245, 'Salatalık, sarımsaklı yoğurt ve sızma zeytinyağı.'],
  ]},
  { id: 'salata', name: 'Salata', emoji: '🥗', items: [
    ['Çoban Salatası', 295], ['Mevsim Salatası', 295], ['Sezar Salata', 385], ['Ton Balıklı Salata', 385],
    ['Tebbule Salatası', 355], ['Fettuş Salatası', 395], ['Patlıcan Salatası', 285], ['Havuç Salatası', 275],
    ['Söğüş Tabağı', 270], ['Karışık Turşu', 275],
  ]},
  { id: 'tatli', name: 'Tatlı', emoji: '🍮', items: [
    ['Künefe', 395, 'Nar gibi kızarmış kadayıf arasında uzayan peynir.'],
    ['Fıstıklı Baklava', 495, '40 kat çıtır yufka, bol Antep fıstığı.'],
    ['Fırın Sütlaç', 355, 'Toprak güveçte, üzeri fırında kızarmış.'],
  ]},
  { id: 'icecek', name: 'İçecek', emoji: '🥤', items: [
    ['Su', 40], ['Ayran', 110], ['Sade / Meyveli Soda', 105], ['Fanta – Sprite – Ice Tea', 145],
    ['Limonata', 245], ['Portakal Suyu', 245], ['Nar Suyu', 265], ['Türk Kahvesi', 185], ['Cappuccino', 295],
  ]},
]

// Sadece iştah açıcı gerçek yemek fotoğrafları (insan veya yazılı afiş yok)
export const GALLERY = [
  '/img/lahmacun/lovemacunn-restaurant-kebapli-lahmacun-400x400.webp',
  '/img/pide/lovemacunn-restaurant-kiymali-kasarli-400x400.webp',
  '/img/et/lovemacunn-restaurant-iskender-400x400.webp',
  '/img/tatlilar/lovemacunn-restaurant-kunefe-400x400.webp',
  '/img/baliklar/lovemacunn-restaurant-levrek-400x400.webp',
  '/img/pizza/lovemacunn-restaurant-karisik-pizza-400x400.webp',
  '/img/et/lovemacunn-restaurant-adana-kebap-400x400.webp',
  '/img/pide/lovemacunn-restaurant-kusbasi-kasar-400x400.webp',
  '/img/tatlilar/lovemacunn-restaurant-baklava-400x400.webp',
  '/img/baliklar/lovemacunn-restaurant-kalamar-400x400.webp',
  '/img/makarnalar/lovemacunn-restaurant-fettucine-400x400.webp',
]
export const HERO = [
  '/img/lahmacun-hero.webp',
  '/img/pide/lovemacunn-restaurant-kiymali-kasarli-400x400.webp',
  '/img/et/lovemacunn-restaurant-iskender-400x400.webp',
]
export const FEATURED = ['Kebaplı Lahmacun', 'Kıymalı Kaşarlı Pide', 'İskender Kebap', 'Fettuccine Alfredo', 'Künefe']

// ETİKETLER: ürün adları listesi.
export const TAGS = {
  sef: FEATURED,
  aci: ['Adana Kebap', 'Adana Dürüm', 'Penne Arrabbiata', 'Pepperoni Pizza', 'Acı Ezme', 'Soğanlı Lahmacun'],
  vejetaryen: [
    'Vejetaryen Pide',
    'Kaşarlı Pide',
    'Margarita Pizza',
    'Vejetaryen Pizza',
    'Napoliten Spaghetti',
    'Peynirli Spaghetti',
    'Penne Arrabbiata',
    'Kremalı Mantarlı Penne',
    'Fettuccine Alfredo',
    'Mantarlı Fettuccine',
    'Menemen',
    'Kaşarlı Omlet',
    'Sigara Böreği',
    'Falafel',
    'Fırında Mantar',
    'Patates Kızartması',
    'Humus',
    'Acı Ezme',
    'Çiğ Köfte',
    'Haydari',
    'Cacık',
    'Çoban Salatası',
    'Mevsim Salatası',
    'Tebbule Salatası',
    'Fettuş Salatası',
    'Patlıcan Salatası',
    'Havuç Salatası',
    'Söğüş Tabağı',
    'Karışık Turşu'
  ],
  vegan: [],
  glutensiz: [],
}
