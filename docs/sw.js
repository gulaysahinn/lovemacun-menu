const CACHE_NAME = 'lovemacun-shell-v3'
const DATA_CACHE_NAME = 'lovemacun-data-v3'
const IMAGE_CACHE_NAME = 'lovemacun-images-v3'

// Uygulama kabuğu varlıkları
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo-badge.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.svg'
]

// İlk 20 popüler ürün görseli (önbelleğe alınır)
const INITIAL_IMAGES = [
  '/img-cut/lahmacun/lovemacunn-restaurant-lahmacun-400x400.webp',
  '/img-cut/pide/lovemacunn-restaurant-kiymali-kasarli-400x400.webp',
  '/img-cut/pide/lovemacunn-restaurant-kasarli-pide-400x400.webp',
  '/img-cut/pide/lovemacunn-restaurant-kusbasi-kasar-400x400.webp',
  '/img-cut/et/lovemacunn-restaurant-iskender-400x400.webp',
  '/img-cut/et/lovemacunn-restaurant-adana-kebap-400x400.webp',
  '/img-cut/et/lovemacunn-restaurant-urfa-kebap-400x400.webp',
  '/img-cut/et/lovemacunn-restaurant-beyti-400x400.webp',
  '/img-cut/tatlilar/lovemacunn-restaurant-kunefe-400x400.webp',
  '/img-cut/tatlilar/lovemacunn-restaurant-baklava-400x400.webp'
]

// Kurulum (Install): Kabuk ve ilk görselleri önbellekle, hemen etkinleş
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        // Hata durumunda devam et
        return Promise.allSettled(INITIAL_IMAGES.map((url) => cache.add(url)))
      })
    ]).then(() => self.skipWaiting())
  )
})

// Etkinleştirme (Activate): Eski sürümleri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![CACHE_NAME, DATA_CACHE_NAME, IMAGE_CACHE_NAME].includes(key)) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// İstek Yönetimi (Fetch)
self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // 1. VİDEOLARI ASLA ÖNBELLEĞE ALMA (Büyük boyut ve Range istekleri)
  if (
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.webm') ||
    url.pathname.includes('/video/') ||
    req.headers.get('range')
  ) {
    return // Doğrudan ağa bırak
  }

  // 2. Google Translate isteklerini atla
  if (url.hostname.includes('google') || url.hostname.includes('gstatic')) {
    return
  }

  // 3. Görseller: Stale-While-Revalidate (önce önbellekten ver, arka planda güncelle)
  if (
    req.destination === 'image' ||
    url.pathname.startsWith('/img/') ||
    url.pathname.startsWith('/img-cut/') ||
    url.pathname.startsWith('/hero/')
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(req).then((cachedResponse) => {
          const fetchPromise = fetch(req)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(req, networkResponse.clone())
              }
              return networkResponse
            })
            .catch(() => cachedResponse)

          return cachedResponse || fetchPromise
        })
      })
    )
    return
  }

  // 4. HTML ve Menü Verisi: Network-First (önce ağ, çevrimdışıysa önbellek - güncel fiyat garantisi)
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy))
          }
          return networkResponse
        })
        .catch(() => {
          return caches.match(req).then((cached) => {
            return cached || caches.match('/index.html') || caches.match('/')
          })
        })
    )
    return
  }

  // 5. Statik Varlıklar (JS, CSS, Fontlar): Cache-First
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy))
        }
        return networkResponse
      })
    })
  )
})
