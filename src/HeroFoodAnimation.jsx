import React, { useState, useEffect, useRef } from 'react'

// public/ingredients/ altındaki tüm görselleri dinamik tara
const INGREDIENTS_GLOB = import.meta.glob('/public/ingredients/*.{webp,png,jpg,svg}', { eager: true })
export const INGREDIENT_FILES = Object.keys(INGREDIENTS_GLOB).map((p) => p.replace(/^\/public/, ''))

// Gerçek ürünlerimizde kullanılan 7 malzeme konfigürasyonu
const INGREDIENT_ITEMS_CONFIG = [
  {
    key: 'domates',
    file: '/ingredients/domates.webp',
    name: 'Domates Dilimi',
    top: '8%',
    left: '74%',
    size: 58,
    depth: 1.15,
    dur: '6.4s',
    delay: '0.15s',
    fromX: -80,
    fromY: 90,
    rot: 18,
  },
  {
    key: 'maydanoz-1',
    file: '/ingredients/maydanoz-1.webp',
    name: 'Taze Maydanoz',
    top: '6%',
    left: '16%',
    size: 62,
    depth: 0.85,
    dur: '7.6s',
    delay: '0.6s',
    fromX: 75,
    fromY: 95,
    rot: -22,
  },
  {
    key: 'limon',
    file: '/ingredients/limon.webp',
    name: 'Limon Dilimi',
    top: '74%',
    left: '10%',
    size: 66,
    depth: 1.1,
    dur: '8.2s',
    delay: '0.35s',
    fromX: 85,
    fromY: -70,
    rot: 26,
  },
  {
    key: 'biber-halka',
    file: '/ingredients/biber-halka.webp',
    name: 'Sivri Biber Halkası',
    top: '26%',
    left: '4%',
    size: 46,
    depth: 0.65,
    dur: '5.8s',
    delay: '0.9s',
    fromX: 95,
    fromY: 45,
    rot: -42,
  },
  {
    key: 'kasar',
    file: '/ingredients/kasar.webp',
    name: 'Kaşar Parçası',
    top: '72%',
    left: '78%',
    size: 68,
    depth: 1.0,
    dur: '7.2s',
    delay: '0.45s',
    fromX: -90,
    fromY: -70,
    rot: 16,
  },
  {
    key: 'maydanoz-2',
    file: '/ingredients/maydanoz-2.webp',
    name: 'Yaprak Maydanoz',
    top: '40%',
    left: '86%',
    size: 52,
    depth: 0.75,
    dur: '8.6s',
    delay: '0.8s',
    fromX: -105,
    fromY: 15,
    rot: -14,
  },
  {
    key: 'biber',
    file: '/ingredients/biber.webp',
    name: 'Köz Biber',
    top: '84%',
    left: '46%',
    size: 52,
    depth: 0.9,
    dur: '6.8s',
    delay: '0.2s',
    fromX: 10,
    fromY: -95,
    rot: 24,
  },
]

export default function HeroFoodAnimation({ mouseOffset, scrollOffset }) {
  // Klasör boşsa veya hiç malzeme bulunamadıysa render etme (fallback)
  if (!INGREDIENT_FILES.length) {
    return null
  }

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // public/ingredients/ içinde gerçekten mevcut olan dosyaları filtrele
  const availableItems = INGREDIENT_ITEMS_CONFIG.filter((cfg) =>
    INGREDIENT_FILES.includes(cfg.file)
  )

  if (!availableItems.length) {
    return null
  }

  // Mobilde performans ve hafiflik için en fazla 5 malzeme çalıştır
  const displayItems = isMobile ? availableItems.slice(0, 5) : availableItems

  return (
    <div className="hero-interactive-food" aria-hidden="true">
      <div className="hero-stage">
        {/* MERKEZDEKİ BÜYÜK TABAK / LAHMACUN & KÖZ PARILTISI & DÖNEN IŞIK HALKASI */}
        <div
          className="hero-dish-wrap"
          style={{
            transform: !isMobile
              ? `translate3d(${mouseOffset.x * 4}px, ${mouseOffset.y * 4}px, 0)`
              : `translate3d(0, ${scrollOffset * 3}px, 0)`,
          }}
        >
          {/* Sıcak köz parıltısı */}
          <div className="hero-ember-glow" />

          {/* Dönen ince ışık halkası */}
          <div className="hero-ring-light" />

          {/* Büyük cutout taş fırın lahmacun */}
          <img
            src="/img-cut/lahmacun/lovemacunn-restaurant-kebapli-lahmacun-400x400.webp"
            alt="Taş Fırın Lahmacun"
            width="380"
            height="380"
            className="hero-dish-img"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* ETRAFINDA SÜZÜLEN ŞEFFAF MALZEMELER */}
        {displayItems.map((item) => {
          // Parallax hesaplaması: Masaüstünde fareye göre (maks 12px), mobilde kaydırmaya göre (maks 8px)
          const px = !isMobile
            ? Math.round(mouseOffset.x * 12 * (item.depth / 1.2))
            : 0
          const py = !isMobile
            ? Math.round(mouseOffset.y * 12 * (item.depth / 1.2))
            : Math.round(scrollOffset * 8 * (item.depth / 1.2))

          return (
            <div
              key={item.key}
              className="hero-ingredient-slot"
              style={{
                top: item.top,
                left: item.left,
                width: item.size,
                height: item.size,
                transform: `translate3d(${px}px, ${py}px, 0)`,
                '--burst-from-x': `${item.fromX}px`,
                '--burst-from-y': `${item.fromY}px`,
                '--rot-base': `${item.rot}deg`,
                '--dur': item.dur,
                '--delay': item.delay,
              }}
            >
              {/* İlk 1.2 sn'de tabağın üstünden yukarı doğru patlama / süzülme yerine oturma */}
              <div className="hero-ingredient-burst">
                {/* 5-9 sn arası desenkronize yukarı-aşağı süzülme ve hafif rotasyon döngüsü */}
                <div className="hero-ingredient-float">
                  <img
                    src={item.file}
                    alt={item.name}
                    width={item.size}
                    height={item.size}
                    className="hero-ingredient-img"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
