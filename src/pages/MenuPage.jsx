import { useState, useRef, useEffect } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { PageMeta } from '../components/PageMeta.jsx'
import { CATS, FEATURED, TAGS } from '../menu.js'
import { CONFIG } from '../config.js'
import { TagBadges, SignatureLoop } from '../Extras.jsx'
import images from '../images.json'

import { HeroVideo } from '../components/HeroVideo.jsx'

const fmt = (n) => n.toLocaleString('tr-TR') + ' ₺'
const lower = (s) => s.toLocaleLowerCase('tr')
const slug = (s) =>
  s
    ? s
        .replace(/İ/g, 'i')
        .replace(/I/g, 'i')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'c')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    : ''

import { asset } from '../utils/asset.js'

const getImg = (name, manualImg) => {
  if (manualImg) {
    const sm = asset(manualImg)
    const lg = asset(manualImg.replace(/-sm\.webp$/, '.webp'))
    const cut = asset(manualImg.replace(/\/img\//, '/img-cut/').replace(/-sm\.webp$/, '.webp'))
    const cutSm = asset(manualImg.replace(/\/img\//, '/img-cut/').replace(/\.webp$/, '-sm.webp'))
    return { sm, lg, cut: cut || lg, cutSm: cutSm || sm }
  }
  const entry = images[slug(name)]
  if (!entry) return null
  if (typeof entry === 'string') {
    const lg = asset(entry.replace(/-sm\.webp$/, '.webp'))
    return { sm: asset(entry), lg, cut: lg, cutSm: asset(entry) }
  }
  return {
    sm: asset(entry.sm),
    lg: asset(entry.lg),
    cut: asset(entry.cut || entry.lg || entry.sm),
    cutSm: asset(entry.cutSm || entry.cut || entry.sm),
  }
}

const getCategoryCutout = (cat) => {
  if (!cat?.items) return null
  for (const item of cat.items) {
    const isArr = Array.isArray(item)
    const name = isArr ? item[0] : item.name
    const manualImg = isArr ? item[3] : item.manualImg
    const entry = getImg(name, manualImg)
    if (entry?.cut) return entry.cut
    if (entry?.cutSm) return entry.cutSm
  }
  return null
}

const CAT_CUTOUTS = Object.fromEntries(CATS.map((c) => [c.id, getCategoryCutout(c)]))
const NON_EMPTY_CATS = CATS.filter((c) => c.items && c.items.length > 0)

const allItems = CATS.flatMap((c) =>
  c.items.map((i) => {
    const isArr = Array.isArray(i)
    const name = isArr ? i[0] : i.name
    const price = isArr ? i[1] : i.price
    const desc = isArr ? i[2] : i.desc
    const manualImg = isArr ? i[3] : i.manualImg
    const g = isArr ? i[4] : i.g
    return {
      name,
      price,
      desc,
      emoji: c.emoji,
      img: getImg(name, manualImg),
      catName: c.name,
      catId: c.id,
      g,
    }
  })
)

const featuredList = FEATURED.map((n) => allItems.find((a) => a.name === n)).filter(Boolean)

export function MenuPage({ onSelectProduct, onOpenSearch }) {
  const [activeCat, setActiveCat] = useState(() => NON_EMPTY_CATS[0]?.id || 'lahmacun')
  const [tagSel, setTagSel] = useState([])
  const tabsContainerRef = useRef(null)
  const tabRefs = useRef({})
  const masa = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('masa') : null

  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 767 : false))

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 767)
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Ensure category tabs always start from the first category
  useEffect(() => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollLeft = 0
    }
  }, [])

  // Mobil cihazlarda dikey kaydırmaya göre aktif kategoriyi güncelleyen Scroll-Spy
  useEffect(() => {
    if (!isMobile) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            if (id && id !== activeCat) {
              setActiveCat(id)
              const btn = tabRefs.current[id]
              const container = tabsContainerRef.current
              if (btn && container) {
                const btnLeft = btn.offsetLeft
                const btnWidth = btn.offsetWidth
                const containerWidth = container.offsetWidth
                container.scrollTo({
                  left: btnLeft - containerWidth / 2 + btnWidth / 2,
                  behavior: 'smooth',
                })
              }
            }
          }
        })
      },
      {
        rootMargin: '-105px 0px -65% 0px',
        threshold: 0,
      }
    )

    NON_EMPTY_CATS.forEach((c) => {
      const el = document.getElementById(c.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [isMobile, activeCat])

  const handleSelectCat = (catId) => {
    setActiveCat(catId)
    const btn = tabRefs.current[catId]
    const container = tabsContainerRef.current
    if (btn && container) {
      const btnLeft = btn.offsetLeft
      const btnWidth = btn.offsetWidth
      const containerWidth = container.offsetWidth
      container.scrollTo({
        left: btnLeft - (containerWidth / 2) + (btnWidth / 2),
        behavior: 'smooth',
      })
    }

    if (isMobile) {
      const targetEl = document.getElementById(catId)
      if (targetEl) {
        const topOffset = targetEl.getBoundingClientRect().top + window.scrollY - 105
        window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' })
      }
    }
  }

  const passTag = (name) => tagSel.every((t) => (TAGS[t] || []).includes(name))

  const currentCat = NON_EMPTY_CATS.find((c) => c.id === activeCat) || NON_EMPTY_CATS[0]
  const currentCatIdx = NON_EMPTY_CATS.findIndex((c) => c.id === currentCat.id)
  const nextCat = currentCatIdx >= 0 && currentCatIdx < NON_EMPTY_CATS.length - 1
    ? NON_EMPTY_CATS[currentCatIdx + 1]
    : NON_EMPTY_CATS[0]

  // Mobilde tüm kategorileri sırayla gösterip scroll-spy çalıştırır; masaüstünde seçili kategoriyi korur
  const renderedCategories = isMobile ? NON_EMPTY_CATS : (currentCat ? [currentCat] : [])

  return (
    <div className="menu-page">
      <PageMeta
        title="Taş Fırın Lovemacun | Büyükada Menü"
        description="Büyükada Taş Fırın Lovemacun: taş fırında çıtır lahmacun ve pide, kömür ateşinde kebaplar ve zengin ada lezzetleri."
        canonical="https://tasfirinlovemacun.com/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Restaurant",
          "name": CONFIG.name,
          "image": "https://tasfirinlovemacun.com/hero/hero-desktop.webp",
          "@id": "https://tasfirinlovemacun.com",
          "url": "https://tasfirinlovemacun.com",
          "telephone": CONFIG.phonePrimary.tel,
          "priceRange": "₺₺",
          "servesCuisine": ["Turkish", "Lahmacun", "Pide", "Kebap"],
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Nizam, Düz Sk. no: 1",
            "addressLocality": "Adalar",
            "addressRegion": "İstanbul",
            "postalCode": "34970",
            "addressCountry": "TR"
          },
          "hasMenu": "https://tasfirinlovemacun.com/",
          "sameAs": [CONFIG.instagram]
        }}
      />

      {/* Hero Video Section (Mobilde ~40vh, Masaüstünde ~50vh max 480px, tek h1) */}
      <section className="menu-hero-video-section">
        <HeroVideo
          baseName="lahmacun"
          poster="/video/lahmacun-poster.webp"
          alt="Taş Fırın Lahmacun"
        />
        <div className="hero-video-shade" aria-hidden="true" />
        <div className="hero-embers" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>

        <div className="container hero-video-content">
          {masa && <span className="masa-badge">Masa {masa}</span>}
          <span className="hero-video-kicker">BÜYÜKADA · TAŞ FIRIN USTALIĞI</span>
          <h1 className="hero-video-h1">
            Aşkla yoğrulan hamur,<br />
            <em>çıtır lezzet.</em>
          </h1>
          <p className="hero-video-sub">
            Geleneksel taş fırında pişen çıtır lahmacun ve pideler, kömür ateşinde kebaplar.
          </p>
          <div className="hero-video-actions">
            <button
              type="button"
              className="btn btn-hero-menu"
              onClick={() => {
                const el = document.getElementById('kategoriler')
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              Menüyü Gör ↓
            </button>
          </div>
        </div>
      </section>

      {/* Kompakt Öne Çıkan Lezzetler Şeridi (en fazla ~180-200px) */}
      {featuredList.length > 0 && (
        <section id="one-cikanlar" className="feat-strip-section container">
          <div className="feat-strip-head">
            <span className="feat-strip-kicker desktop-only">✦ MUTLAKA DENEYİN</span>
            <h2 className="feat-strip-title-sm">
              <span className="feat-strip-sparkle">✦</span>
              <span className="feat-strip-title-text">Öne Çıkanlar</span>
            </h2>
          </div>
          <div className="feat-strip-scroll">
            {featuredList.map((item) => {
              return (
                <div
                  key={item.name}
                  className="feat-strip-card"
                  onClick={() => onSelectProduct(item)}
                >
                  <div className="feat-strip-img-wrap">
                    <img
                      src={item.img?.sm || item.img?.cutSm || item.img?.lg}
                      alt={item.name}
                      className="feat-strip-img"
                      loading="lazy"
                    />
                  </div>
                  <div className="feat-strip-info">
                    <span className="feat-strip-name notranslate" translate="no">{item.name}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Sabit Kategori Çubuğu (Sticky Category Bar) */}
      <section id="kategoriler" className="menu-bar-section">
        <div className="bar" role="navigation" aria-label="Menü Kategorileri">
          <div className="bar-fade bar-fade-left" aria-hidden="true" />
          <div className="bar-fade bar-fade-right" aria-hidden="true" />
          <div className="tabs-wrapper container">
            <div className="tabs" ref={tabsContainerRef}>
              {NON_EMPTY_CATS.map((c) => {
                const isActive = c.id === activeCat
                return (
                  <button
                    key={c.id}
                    ref={(el) => (tabRefs.current[c.id] = el)}
                    className={`tab-chip ${isActive ? 'act' : ''}`}
                    onClick={() => handleSelectCat(c.id)}
                    type="button"
                  >
                    <span className="tab-chip-ico" aria-hidden="true">{c.emoji}</span>
                    <span className="tab-chip-lbl">{c.name}</span>
                    <span className="tab-chip-count">{c.items.length}</span>
                  </button>
                )
              })}
            </div>
            {/* Sağda sticky arama butonu */}
            <button
              type="button"
              className="tab-sticky-search"
              onClick={onOpenSearch}
              aria-label="Menüde Ara"
              title="Menüde Ara"
            >
              <Search size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* Menü Ürünleri Listesi (Mobilde 2 Kolonlu Grid, Tablet/Desktop 3 Kolon, Geniş 4 Kolon) */}
      <main className="menu-products-main container">
        {/* Tag Filtreleri (Şefin Seçimi, Acılı, vb.) */}
        <div className="tag-filter-bar" role="toolbar" aria-label="Filtreler">
          {Object.entries(TAGS).map(([tagKey, list]) => {
            if (!list || list.length === 0) return null
            const isSelected = tagSel.includes(tagKey)
            const labels = {
              sef: '★ Şefin Seçimi',
              aci: '🌶 Acılı',
              vegan: 'V Vegan',
              glutensiz: 'GF Glutensiz',
            }
            return (
              <button
                key={tagKey}
                type="button"
                className={`tag-chip ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setTagSel((prev) =>
                    isSelected ? prev.filter((k) => k !== tagKey) : [...prev, tagKey]
                  )
                }}
              >
                {labels[tagKey] || tagKey}
              </button>
            )
          })}
        </div>

        {renderedCategories.map((catItem) => {
          const items = (catItem?.items || []).filter((i) => passTag(Array.isArray(i) ? i[0] : i.name))
          if (items.length === 0 && isMobile) return null

          return (
            <section key={catItem.id} id={catItem.id} className="cat">
              <div className="cat-pill-head">
                <span className="cat-pill-badge">
                  {catItem.name} · {items.length} ürün
                </span>
              </div>

              <SignatureLoop catId={catItem.id} fallbackCutout={CAT_CUTOUTS[catItem.id]} />

              <div className="grid">
                {items.map((rawItem, idx) => {
                  const isArr = Array.isArray(rawItem)
                  const name = isArr ? rawItem[0] : rawItem.name
                  const price = isArr ? rawItem[1] : rawItem.price
                  const desc = isArr ? rawItem[2] : rawItem.desc
                  const manualImg = isArr ? rawItem[3] : rawItem.manualImg
                  const g = isArr ? rawItem[4] : rawItem.g
                  const img = getImg(name, manualImg)
                  const imgSrc = img?.lg || img?.sm || img?.cut || img?.cutSm

                  return (
                    <article
                      key={name}
                      className="menu-card"
                      style={{ transitionDelay: `${(idx % 6) * 35}ms` }}
                      onClick={() => onSelectProduct({ name, price, desc, img, catName: catItem.name, g })}
                    >
                      {/* Görsel: Üstte 4/3 oran, cover, tam dolu */}
                      <div className="card-media">
                        <TagBadges name={name} tags={TAGS} compact />

                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={name}
                            loading="lazy"
                            decoding="async"
                            className="card-media-img"
                          />
                        ) : (
                          <div className="card-no-img" aria-label="Fotoğraf hazırlanıyor">
                            <div className="placeholder-monogram">TF</div>
                          </div>
                        )}
                      </div>

                      {/* Kart Gövdesi: Başlık, Açıklama, Fiyat */}
                      <div className="card-body">
                        <div className="card-content-top">
                          <h2 className="card-title notranslate" translate="no">
                            {name}
                            {g ? <span className="card-gram"> ({g} g)</span> : null}
                          </h2>

                          {desc ? (
                            <p className="card-desc">{desc}</p>
                          ) : (
                            <div className="card-desc card-desc-empty" aria-hidden="true" />
                          )}
                        </div>

                        <div className="card-footer">
                          <span className="card-price-amount notranslate" translate="no">{fmt(price)}</span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* Sonraki Kategori Butonu (Masaüstünde tek kategori modunda) */}
              {!isMobile && nextCat && nextCat.id !== catItem.id && (
                <div className="next-category-wrap">
                  <button
                    type="button"
                    className="btn btn-next-category"
                    onClick={() => {
                      handleSelectCat(nextCat.id)
                      const el = document.getElementById('kategoriler')
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                  >
                    Sonraki kategori: {nextCat.name} →
                  </button>
                </div>
              )}
            </section>
          )
        })}
      </main>
    </div>
  )
}
