import { useState, useRef, useEffect, useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { PageMeta } from '../components/PageMeta.jsx'
import { CATS, FEATURED, TAGS, useMenuData } from '../menu.js'
import { CONFIG } from '../config.js'
import { TagBadges } from '../Extras.jsx'
import { useLang, t } from '../utils/i18n.js'
import images from '../images.json'


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
    return { sm, lg, cut: lg, cutSm: sm }
  }
  const entry = images[slug(name)]
  if (!entry) return null
  if (typeof entry === 'string') {
    const lg = asset(entry.replace(/-sm\.webp$/, '.webp'))
    return { sm: asset(entry), lg, cut: lg, cutSm: asset(entry) }
  }
  const rawCut = entry.cut && !entry.cut.includes('/img-cut/') ? entry.cut : entry.lg
  const rawCutSm = entry.cutSm && !entry.cutSm.includes('/img-cut/') ? entry.cutSm : entry.sm
  return {
    sm: asset(entry.sm),
    lg: asset(entry.lg),
    cut: asset(rawCut || entry.lg || entry.sm),
    cutSm: asset(rawCutSm || rawCut || entry.sm),
  }
}

export function MenuPage({ onSelectProduct }) {
  const { cats, featured, tags, loading } = useMenuData()
  const lang = useLang()

  const NON_EMPTY_CATS = useMemo(() => {
    return (cats || []).filter((c) => c.items && c.items.length > 0)
  }, [cats])

  const allItems = useMemo(() => {
    return (cats || []).flatMap((c) =>
      (c.items || []).map((i) => {
        const isArr = Array.isArray(i)
        const name = isArr ? i[0] : i.name
        const price = isArr ? i[1] : i.price
        const desc = isArr ? i[2] : (i.description || i.desc)
        const manualImg = isArr ? i[3] : (i.image || i.manualImg)
        const g = isArr ? i[4] : i.g
        const soldOut = !isArr && Boolean(i.soldOut)
        const isNew = !isArr && Boolean(i.isNew)
        const hidden = !isArr && Boolean(i.hidden)
        return {
          id: !isArr ? i.id : name,
          name,
          price,
          desc,
          emoji: c.emoji,
          img: getImg(name, manualImg),
          catName: c.name,
          catId: c.id,
          g,
          soldOut,
          isNew,
          hidden,
        }
      })
    )
  }, [cats])

  const featuredList = useMemo(() => {
    return (featured || [])
      .map((n) => allItems.find((a) => a.name === n && !a.hidden))
      .filter(Boolean)
  }, [featured, allItems])

  const [activeCat, setActiveCat] = useState(() => NON_EMPTY_CATS[0]?.id || 'lahmacun')

  // Keep active category valid when cats update
  useEffect(() => {
    if (NON_EMPTY_CATS.length > 0 && !NON_EMPTY_CATS.some((c) => c.id === activeCat)) {
      setActiveCat(NON_EMPTY_CATS[0].id)
    }
  }, [NON_EMPTY_CATS, activeCat])
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

  // Center active category chip smoothly in the horizontal tabs bar
  const scrollToTab = (catId) => {
    const btn = tabRefs.current[catId]
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

  // Ensure category tabs always start from the first category on mount
  useEffect(() => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollLeft = 0
    }
  }, [])

  const handleSelectCat = (catId) => {
    setActiveCat(catId)
    if (tagSel.length > 0) {
      setTagSel([])
    }
    scrollToTab(catId)

    const productsEl = document.querySelector('.menu-products-main')
    if (productsEl) {
      const stickyOffset = isMobile ? 106 : 124
      const rect = productsEl.getBoundingClientRect()
      if (rect.top < stickyOffset - 16) {
        const targetTop = rect.top + window.scrollY - stickyOffset
        window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
      }
    }
  }

  const passTag = (name) => tagSel.every((t) => (tags[t] || []).includes(name))

  const currentCat = NON_EMPTY_CATS.find((c) => c.id === activeCat) || NON_EMPTY_CATS[0]
  const currentCatIdx = NON_EMPTY_CATS.findIndex((c) => c.id === currentCat?.id)
  const nextCat = currentCatIdx >= 0 && currentCatIdx < NON_EMPTY_CATS.length - 1
    ? NON_EMPTY_CATS[currentCatIdx + 1]
    : NON_EMPTY_CATS[0]

  // Etiket filtresi (Şefin Seçimi / Acılı / Vejetaryen) aktifken eşleşen ürünü olan kategorileri göster;
  // normal gezinmede hem mobil hem masaüstünde yalnızca seçili kategoriyi göster
  const renderedCategories = tagSel.length > 0
    ? NON_EMPTY_CATS.filter((c) => (c.items || []).some((i) => passTag(Array.isArray(i) ? i[0] : i.name)))
    : (currentCat ? [currentCat] : [])

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
          "acceptsReservations": "True",
          "sameAs": [CONFIG.instagram]
        }}
      />

      {/* Kompakt Öne Çıkan Lezzetler Şeridi (en fazla ~180-200px) */}
      {featuredList.length > 0 && (
        <section id="one-cikanlar" className="feat-strip-section container">
          <div className="feat-strip-head">
            <span className="feat-strip-kicker desktop-only">✦ MUTLAKA DENEYİN</span>
            <h2 className="feat-strip-title-sm">
              <span className="feat-strip-sparkle mobile-only" aria-hidden="true">✦ </span>
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
          </div>
        </div>
      </section>

      {/* Menü Ürünleri Listesi (Mobilde 2 Kolonlu Grid, Tablet/Desktop 3 Kolon, Geniş 4 Kolon) */}
      <div className="menu-products-main container">
        {/* Tag Filtreleri (Şefin Seçimi, Acılı, Vejetaryen vb.) */}
        <div className="tag-filter-bar" role="toolbar" aria-label="Filtreler">
          {Object.entries(tags || {}).map(([tagKey, list]) => {
            if (!list || list.length === 0) return null
            // SHOW_DIET_TAGS=false → yalnızca vegan/glutensiz gizle (Şefin Seçimi, Acılı ve Vejetaryen görünür)
            const dietTags = ['vegan', 'glutensiz']
            if (!CONFIG.SHOW_DIET_TAGS && dietTags.includes(tagKey)) return null
            const isSelected = tagSel.includes(tagKey)
            const labels = {
              sef: '★ Şefin Seçimi',
              aci: '🌶 Acılı',
              vejetaryen: '🌱 Vejetaryen',
              vegan: 'V Vegan',
              glutensiz: 'GF Glutensiz',
            }
            return (
              <button
                key={tagKey}
                type="button"
                className={`tag-chip tag-chip-${tagKey} ${isSelected ? 'active' : ''}`}
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

        {loading && renderedCategories.length === 0 && (
          <section className="cat">
            <div className="grid">
              {Array.from({ length: 6 }).map((_, sIdx) => (
                <div key={`init-skel-${sIdx}`} className="skeleton-card" />
              ))}
            </div>
          </section>
        )}

        {!loading && renderedCategories.length === 0 && tagSel.length > 0 && (
          <section className="cat">
            <div style={{ padding: '28px 16px', textAlign: 'center', color: '#cbbbae' }}>
              <p style={{ margin: '0 0 12px' }}>Seçili filtreye uygun ürün bulunamadı.</p>
              <button
                type="button"
                className="btn btn-next-category"
                onClick={() => setTagSel([])}
              >
                Filtreleri Temizle
              </button>
            </div>
          </section>
        )}

        {renderedCategories.map((catItem) => {
          const items = (catItem?.items || []).filter((i) => passTag(Array.isArray(i) ? i[0] : i.name))

          return (
            <section key={catItem.id} id={catItem.id} className="cat">
              <div className="cat-pill-head">
                <span className="cat-pill-badge">
                  {catItem.name} · {items.length} ürün
                </span>
              </div>

              <div className="grid">
                {loading && items.length === 0
                  ? Array.from({ length: 6 }).map((_, sIdx) => (
                      <div key={`skel-${sIdx}`} className="skeleton-card" />
                    ))
                  : items.map((rawItem, idx) => {
                    const isArr = Array.isArray(rawItem)
                    const name = isArr ? rawItem[0] : rawItem.name
                    const price = isArr ? rawItem[1] : rawItem.price
                    const desc = isArr ? rawItem[2] : (rawItem.description || rawItem.desc)
                    const manualImg = isArr ? rawItem[3] : (rawItem.image || rawItem.manualImg)
                    const g = isArr ? rawItem[4] : rawItem.g
                    const soldOut = !isArr && Boolean(rawItem.soldOut)
                    const isNew = !isArr && Boolean(rawItem.isNew)
                    const img = getImg(name, manualImg)
                    const imgSrc = img?.lg || img?.sm || img?.cut || img?.cutSm

                    return (
                      <article
                        key={name}
                        className={`menu-card ${soldOut ? 'is-sold-out' : ''}`}
                        style={{ transitionDelay: `${(idx % 6) * 35}ms` }}
                        onClick={() => onSelectProduct({ name, price, desc, img, catName: catItem.name, g, soldOut, isNew })}
                      >
                        {/* Görsel: Üstte 4/3 oran, cover, tam dolu */}
                        <div className="card-media">
                          <TagBadges name={name} tags={tags} compact />

                          {soldOut && (
                            <span className="card-badge-soldout notranslate" translate="no">
                              {t('soldOut', lang)}
                            </span>
                          )}
                          {!soldOut && isNew && (
                            <span className="card-badge-new notranslate" translate="no">
                              {t('newBadge', lang)}
                            </span>
                          )}

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

              {/* Sonraki Kategori Butonu */}
              {tagSel.length === 0 && nextCat && nextCat.id !== catItem.id && (
                <div className="next-category-wrap">
                  <button
                    type="button"
                    className="btn btn-next-category"
                    onClick={() => handleSelectCat(nextCat.id)}
                  >
                    Sonraki kategori: {nextCat.name} →
                  </button>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
