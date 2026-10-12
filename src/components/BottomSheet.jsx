import { useState, useRef, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { TagBadges } from '../Extras.jsx'
import { TAGS } from '../menu.js'

const fmt = (n) => n.toLocaleString('tr-TR') + ' ₺'

export function BottomSheet({ item, onClose, L }) {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const startYRef = useRef(0)
  const isDraggingRef = useRef(false)
  const currentDragYRef = useRef(0)
  const contentRef = useRef(null)

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
  const isFav = L ? Boolean(L.list[item.name]) : false

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
        {/* Sürükleme Tutamağı */}
        <div className="sheet-drag-area" title="Aşağı kaydırarak kapatabilirsiniz">
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
          <div className={`sheet-img-wrap ${item.img?.cut?.includes('/img-cut/') ? 'has-cut' : ''}`}>
            {item.img ? (
              <img
                src={item.img.cut || item.img.lg}
                alt={item.name}
                width="900"
                height="900"
                loading="eager"
                className={item.img.cut?.includes('/img-cut/') ? 'img-cutout' : ''}
              />
            ) : (
              <div className="sheet-no-img" aria-label="Fotoğraf hazırlanıyor">
                <div className="placeholder-monogram">TF</div>
                <span className="placeholder-text">Fotoğraf hazırlanıyor</span>
              </div>
            )}
          </div>

          {/* Detay Bilgileri */}
          <div className="sheet-body">
            <div className="sheet-meta">
              <span className="sheet-kicker">{item.catName || 'Taş Fırın Menü'}</span>
            </div>

            <h2 className="sheet-title">
              {item.name}
              {item.g ? <span className="card-gram"> ({item.g} g)</span> : null}
            </h2>
            <TagBadges name={item.name} tags={TAGS} />
            {item.desc && <p className="sheet-desc">{item.desc}</p>}

            <div className="sheet-foot">
              <div className="sheet-price-block">
                <span className="sheet-price-label">Fiyat</span>
                <span className="sheet-price">{fmt(item.price)}</span>
              </div>
              <div className="sheet-foot-actions">
                {L && (
                  <button
                    type="button"
                    className={`btn sheet-action-btn ${isFav ? 'on' : ''}`}
                    onClick={() => L.toggle(item.name, item.price)}
                  >
                    <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
                    <span>{isFav ? 'Listede' : 'Listeme Ekle'}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn ghost sheet-close-btn-foot"
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
