import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { CATS } from '../menu.js'
import images from '../images.json'

const fmt = (n) => n.toLocaleString('tr-TR') + ' ₺'

// Türkçe karakter ve aksan normalizasyonu (kasarli -> kaşarlı, iskender -> İskender)
function normalizeText(str) {
  if (!str) return ''
  return str
    .toLocaleLowerCase('tr')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

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

const getImg = (name, manualImg) => {
  if (manualImg) {
    const lg = manualImg.replace(/-sm\.webp$/, '.webp')
    const cut = manualImg.replace(/\/img\//, '/img-cut/').replace(/-sm\.webp$/, '.webp')
    return { sm: manualImg, lg, cut: cut || lg }
  }
  const entry = images[slug(name)]
  if (!entry) return null
  if (typeof entry === 'string') {
    const lg = entry.replace(/-sm\.webp$/, '.webp')
    return { sm: entry, lg, cut: lg }
  }
  return { sm: entry.sm, lg: entry.lg, cut: entry.cut || entry.lg }
}

const allProducts = CATS.flatMap((c) =>
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
      // Hızlı arama için önceden normalize edilmiş metinler
      normName: normalizeText(name),
      normDesc: normalizeText(desc),
      normCat: normalizeText(c.name)
    }
  })
)

// Gerçek menü ürünlerine dayalı popüler aramalar (her çip sonuç döndürür)
const POPULAR_SEARCHES = ['Lahmacun', 'Kaşarlı Pide', 'İskender', 'Künefe', 'Ayran']

export function SearchModal({ isOpen, onClose, onSelectProduct }) {
  const [query, setQuery] = useState('')
  const [panelHeight, setPanelHeight] = useState('100dvh')
  const inputRef = useRef(null)

  // 1. Android Geri Tuşu (popstate) & ESC desteği
  useEffect(() => {
    if (!isOpen) return

    window.history.pushState({ searchOpen: true }, '')
    const handlePopState = () => {
      onClose()
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // 2. Arka plan kaydırma kilidi ve otomatik odaklama
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => {
        document.body.style.overflow = originalOverflow
        clearTimeout(timer)
      }
    } else {
      setQuery('')
    }
  }, [isOpen])

  // 3. Mobil klavye açıkken visualViewport takibi
  useEffect(() => {
    if (!isOpen) return
    const updateHeight = () => {
      if (window.visualViewport) {
        setPanelHeight(`${window.visualViewport.height}px`)
      } else {
        setPanelHeight('100dvh')
      }
    }
    updateHeight()
    window.visualViewport?.addEventListener('resize', updateHeight)
    window.visualViewport?.addEventListener('scroll', updateHeight)
    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight)
      window.visualViewport?.removeEventListener('scroll', updateHeight)
    }
  }, [isOpen])

  if (!isOpen) return null

  const trimmed = query.trim()
  const normQuery = normalizeText(trimmed)

  // Filtreleme: İsim, açıklama veya kategori adında Türkçe/aksan duyarsız arama
  const results = trimmed
    ? allProducts.filter(
        (p) =>
          p.normName.includes(normQuery) ||
          p.normDesc.includes(normQuery) ||
          p.normCat.includes(normQuery)
      )
    : []

  const handleCancel = () => {
    onClose()
  }

  const handleSelect = (item) => {
    onClose()
    onSelectProduct?.(item)
  }

  // React Portal ile doğrudan body'ye eklenir (Z-index hiyerarşisi garantilenir)
  return createPortal(
    <div
      className="search-portal-root"
      style={{ height: panelHeight }}
      role="dialog"
      aria-modal="true"
      aria-label="Menüde Arama"
    >
      <div className="search-portal-inner">
        {/* Üst Arama Çubuğu */}
        <div className="search-portal-header">
          <div className="search-portal-input-wrap">
            <Search size={18} className="search-portal-ico" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              placeholder="Lezzet ara… (lahmacun, kaşarlı pide)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Menüde lezzet ara"
              className="search-portal-input"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {query && (
              <button
                type="button"
                className="btn-search-clear"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
                aria-label="Aramayı Temizle"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn-search-cancel"
            onClick={handleCancel}
            aria-label="Aramayı İptal Et"
          >
            Vazgeç
          </button>
        </div>

        {/* Gövde: Popüler Aramalar veya Sonuç Listesi */}
        <div className="search-portal-body">
          {/* Giriş boşken Popüler Aramalar Çipleri */}
          {!trimmed && (
            <div className="search-chips-section">
              <span className="search-chips-label">Popüler aramalar</span>
              <div className="search-chips-grid">
                {POPULAR_SEARCHES.map((chipText) => (
                  <button
                    key={chipText}
                    type="button"
                    className="search-chip-btn notranslate"
                    translate="no"
                    onClick={() => {
                      setQuery(chipText)
                      inputRef.current?.focus()
                    }}
                  >
                    {chipText}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Yazıldığında Sonuç Bulunamadı Mesajı */}
          {trimmed && results.length === 0 && (
            <div className="search-empty-state">
              <span className="search-empty-icon" aria-hidden="true">🍽️</span>
              <p className="search-empty-title">"{query}" ile eşleşen lezzet bulunamadı.</p>
              <span className="search-empty-sub">Farklı bir arama terimi deneyebilirsiniz.</span>
            </div>
          )}

          {/* Yazıldığında Sonuç Listesi (56px görsel, ad, kategori, fiyat) */}
          {results.length > 0 && (
            <div className="search-results-list" role="list">
              {results.map((item) => {
                const thumb = item.img?.cut || item.img?.sm || item.img?.lg
                return (
                  <button
                    key={item.name}
                    type="button"
                    className="search-result-row notranslate"
                    translate="no"
                    onClick={() => handleSelect(item)}
                    role="listitem"
                  >
                    <div className="search-result-thumb-wrap">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.name}
                          className="search-result-thumb-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="search-result-thumb-placeholder">
                          <span>TF</span>
                        </div>
                      )}
                    </div>

                    <div className="search-result-meta">
                      <span className="search-result-cat">{item.catName}</span>
                      <strong className="search-result-name">{item.name}</strong>
                      {item.desc && (
                        <span className="search-result-desc">{item.desc}</span>
                      )}
                    </div>

                    <div className="search-result-price-wrap">
                      <span className="search-result-price">{fmt(item.price)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
