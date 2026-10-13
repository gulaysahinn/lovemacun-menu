import { useState, useRef, useEffect } from 'react'
import { TagBadges } from '../Extras.jsx'
import { TAGS } from '../menu.js'

const fmt = (n) => n.toLocaleString('tr-TR') + ' ₺'

export function BottomSheet({ item, onClose }) {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const startYRef = useRef(0)
  const isDraggingRef = useRef(false)
  const currentDragYRef = useRef(0)
  const contentRef = useRef(null)

  // Body scroll lock while sheet is open
  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [item])

  const handleClose = () => {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 220)
  }

  const onStart = (clientY, target) => {
    if (target && (target.closest('button') || target.closest('a'))) return
    startYRef.current = clientY
    currentDragYRef.current = 0
    isDraggingRef.current = true
    setIsDragging(true)
  }

  const onMove = (clientY) => {
    if (!isDraggingRef.current) return
    const delta = clientY - startYRef.current
    const scrollTop = contentRef.current ? contentRef.current.scrollTop : 0

    if (scrollTop <= 0 && delta > 0) {
      currentDragYRef.current = delta
      setDragY(delta)
    } else if (delta <= 0 && currentDragYRef.current > 0) {
      currentDragYRef.current = 0
      setDragY(0)
    }
  }

  const onEnd = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    if (currentDragYRef.current > 75) {
      handleClose()
    } else {
      currentDragYRef.current = 0
      setDragY(0)
    }
  }

  useEffect(() => {
    const handleWindowMove = (e) => {
      if (!isDraggingRef.current) return
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      onMove(clientY)
    }
    const handleWindowEnd = () => {
      if (isDraggingRef.current) {
        onEnd()
      }
    }
    window.addEventListener('mousemove', handleWindowMove)
    window.addEventListener('mouseup', handleWindowEnd)
    window.addEventListener('touchmove', handleWindowMove, { passive: true })
    window.addEventListener('touchend', handleWindowEnd)
    window.addEventListener('touchcancel', handleWindowEnd)
    return () => {
      window.removeEventListener('mousemove', handleWindowMove)
      window.removeEventListener('mouseup', handleWindowEnd)
      window.removeEventListener('touchmove', handleWindowMove)
      window.removeEventListener('touchend', handleWindowEnd)
      window.removeEventListener('touchcancel', handleWindowEnd)
    }
  }, [])

  if (!item) return null

  return (
    <div
      className={`sheet-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
      style={{
        opacity: isClosing ? 0 : Math.max(0, 1 - dragY / 320),
      }}
    >
      <div
        className={`bottom-sheet ${isClosing ? 'closing' : ''} ${isDragging ? 'dragging' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => onStart(e.clientY, e.target)}
        onTouchStart={(e) => onStart(e.touches[0].clientY, e.target)}
        style={{
          transform: isClosing
            ? 'translateY(100%)'
            : dragY > 0
            ? `translateY(${dragY}px)`
            : undefined,
          transition: isDragging ? 'none' : undefined,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
      >
        {/* Sürükleme Tutamağı (Fotoğraf üzerinde süzülen) */}
        <div className="sheet-drag-handle-floating" title="Aşağı kaydırarak kapatabilirsiniz">
          <span className="sheet-drag-pill" />
        </div>

        {/* Kapat Butonu */}
        <button
          className="sheet-close-btn"
          onClick={handleClose}
          aria-label="Kapat"
        >
          ✕
        </button>

        <div className="sheet-scroll" ref={contentRef}>
          {/* Fotoğraf */}
          {(() => {
            const photoSrc = item.img?.lg || item.img?.sm || item.img?.cut || (typeof item.img === 'string' ? item.img : null)
            return (
              <div className="sheet-img-wrap">
                {photoSrc ? (
                  <>
                    <img
                      src={photoSrc}
                      alt={item.name}
                      width="900"
                      height="900"
                      loading="eager"
                      className="sheet-img"
                    />
                    <div className="sheet-img-gradient" />
                  </>
                ) : (
                  <div className="sheet-no-img" aria-label="Fotoğraf hazırlanıyor">
                    <div className="placeholder-monogram">TF</div>
                    <span className="placeholder-text">Fotoğraf hazırlanıyor</span>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Detay Bilgileri */}
          <div className="sheet-body">
            <div className="sheet-meta">
              <span className="sheet-kicker">{item.catName || 'Taş Fırın Menü'}</span>
              {item.g ? <span className="sheet-gram-badge">{item.g} g</span> : null}
            </div>

            <h2 className="sheet-title notranslate" translate="no">
              {item.name}
            </h2>

            <div className="sheet-tags-wrap">
              <TagBadges name={item.name} tags={TAGS} />
            </div>

            {item.desc && <p className="sheet-desc">{item.desc}</p>}

            <div className="sheet-highlights">
              <div className="sheet-highlight-item">
                <span className="sheet-highlight-dot">🔥</span>
                <span>Geleneksel taş fırında pişen çıtır lezzet</span>
              </div>
              <div className="sheet-highlight-item">
                <span className="sheet-highlight-dot">🌿</span>
                <span>Taze günlük hamur ve usta dokunuşu</span>
              </div>
            </div>

            <div className="sheet-foot">
              <div className="sheet-price-block">
                <span className="sheet-price-label">Fiyat</span>
                <span className="sheet-price notranslate" translate="no">{fmt(item.price)}</span>
              </div>
              <div className="sheet-foot-actions">
                <button
                  type="button"
                  className="sheet-close-btn-foot"
                  onClick={handleClose}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
