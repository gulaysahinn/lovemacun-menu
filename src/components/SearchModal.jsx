import { useState, useRef, useEffect } from 'react'
import { Search, X, Heart } from 'lucide-react'
import { CATS } from '../menu.js'
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
      g,
    }
  })
)

export function SearchModal({ isOpen, onClose, onSelectProduct, L }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const trimmed = query.trim()
  const lowerQuery = lower(trimmed)
  const results = trimmed
    ? allProducts.filter(
        (p) =>
          lower(p.name).includes(lowerQuery) ||
          (p.desc && lower(p.desc).includes(lowerQuery)) ||
          lower(p.catName).includes(lowerQuery)
      )
    : []

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <div className="search-modal-input-wrap">
            <Search size={18} className="search-modal-ico" />
            <input
              ref={inputRef}
              type="search"
              placeholder="Lezzet ara… (lahmacun, kaşarlı pide, kebap)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Menüde lezzet ara"
            />
            {query && (
              <button
                type="button"
                className="search-modal-clear"
                onClick={() => setQuery('')}
                aria-label="Aramayı temizle"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            className="search-modal-close"
            onClick={onClose}
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <div className="search-modal-results">
          {trimmed && results.length === 0 && (
            <div className="search-no-results">
              <p>"{query}" ile eşleşen lezzet bulunamadı.</p>
              <small>Farklı bir arama terimi deneyebilirsiniz.</small>
            </div>
          )}

          {!trimmed && (
            <div className="search-quick-tags">
              <span className="search-quick-lbl">Popüler Aramalar:</span>
              <div className="search-quick-btns">
                {['Lahmacun', 'Kaşarlı Pide', 'İskender', 'Künefe', 'Ayran'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="search-quick-btn"
                    onClick={() => setQuery(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="search-results-list">
              {results.map((item) => {
                const isFav = L ? Boolean(L.list[item.name]) : false
                const thumb = item.img?.cut || item.img?.sm || item.img?.lg
                return (
                  <div
                    key={item.name}
                    className="search-result-item"
                    onClick={() => {
                      onClose()
                      onSelectProduct(item)
                    }}
                  >
                    <div className="search-result-media">
                      {thumb ? (
                        <img src={thumb} alt={item.name} loading="lazy" />
                      ) : (
                        <span className="search-result-monogram">TF</span>
                      )}
                    </div>
                    <div className="search-result-info">
                      <span className="search-result-cat">{item.catName}</span>
                      <strong className="search-result-name">{item.name}</strong>
                      {item.desc && <p className="search-result-desc">{item.desc}</p>}
                    </div>
                    <div className="search-result-action">
                      <span className="search-result-price">{fmt(item.price)}</span>
                      {L && (
                        <button
                          type="button"
                          className={`search-result-heart ${isFav ? 'on' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            L.toggle(item.name, item.price)
                          }}
                          aria-label={isFav ? 'Listeden çıkar' : 'Listeye ekle'}
                        >
                          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
