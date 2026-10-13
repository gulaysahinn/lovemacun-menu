import { useEffect, useState, useRef } from 'react'

export const TAG_META = {
  sef: { label: 'Şefin Seçimi', icon: '★' },
  aci: { label: 'Acılı', icon: '🌶' },
  vegan: { label: 'Vegan', icon: 'V' },
  glutensiz: { label: 'Glutensiz', icon: 'GF' },
}

export function TagBadges({ name, tags, compact = false }) {
  const on = Object.keys(TAG_META).filter((k) => (tags[k] || []).includes(name))
  if (!on.length) return null
  return (
    <div className={`tagrow ${compact ? 'compact' : ''}`}>
      {on.map((k) => (
        <span key={k} className={'tg tg-' + k} title={TAG_META[k].label}>
          <span className="tg-ico">{TAG_META[k].icon}</span>
          <span className="tg-lbl">{TAG_META[k].label}</span>
        </span>
      ))}
    </div>
  )
}

const checkIsMobileDevice = () => {
  if (typeof window === 'undefined') return false
  const narrow = window.innerWidth <= 768
  const touch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
  const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
  return narrow || (touch && narrow) || uaMobile
}

const checkSaveDataActive = () => {
  if (typeof navigator === 'undefined') return false
  return Boolean(navigator.connection?.saveData)
}

// public/video/<kategori-id>.mp4 varsa kategorinin tepesinde "İmza Lezzet" döngüsü oynar.
// Kurallar:
// - muted, loop, playsInline, preload="none"
// - IntersectionObserver ile kategori ekrana gelince yükle ve oynat
// - mobilde ve saveData açıkken video yerine poster görseli göster (public/video/pide-poster.webp, yoksa ilk pide cutout'ı)
// - dosya yoksa veya hata verirse hiçbir şey gösterme ve boşluk bırakma (return null)
export function SignatureLoop({ catId, fallbackCutout }) {
  const [failed, setFailed] = useState(false)
  const [isMobile, setIsMobile] = useState(checkIsMobileDevice)
  const [saveData, setSaveData] = useState(checkSaveDataActive)
  const [hasIntersected, setHasIntersected] = useState(false)
  const containerRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    setFailed(false)
    setHasIntersected(false)
  }, [catId])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(checkIsMobileDevice())
      setSaveData(checkSaveDataActive())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Kullanıcı kuralı: Sadece pide kategorisi için (hero videosu lahmacun ayrı tutulur)
  if (catId !== 'pide') {
    return null
  }

  if (failed) {
    return null
  }

  // 1) Poster tespiti: fallbackCutout kullan
  const posterSrc = fallbackCutout || null
  const videoSrc = null

  const usePosterOnly = true

  // Dosya yoksa bileşen hiçbir şey göstermesin ve boşluk bırakmasın
  if (usePosterOnly && !posterSrc) {
    return null
  }
  if (!usePosterOnly && !videoSrc) {
    return null
  }

  // IntersectionObserver: Kategori ekrana gelince yükle ve oynat, ekrandan çıkınca duraklat
  useEffect(() => {
    if (usePosterOnly) return

    const node = containerRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setHasIntersected(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true)
          if (videoRef.current) {
            const v = videoRef.current
            if (!v.src && videoSrc) {
              v.src = videoSrc
              v.load()
            }
            v.play().catch(() => {})
          }
        } else {
          if (videoRef.current) {
            videoRef.current.pause()
          }
        }
      },
      { root: null, rootMargin: '100px', threshold: 0.15 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [usePosterOnly, videoSrc])

  const isCutoutPoster = Boolean(posterSrc && posterSrc.includes('/img-cut/'))

  return (
    <div className="sig" ref={containerRef}>
      {usePosterOnly ? (
        <img
          className={`sig-media ${isCutoutPoster ? 'is-cutout' : ''}`}
          src={posterSrc}
          alt="Taş Fırın Pide"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <video
          ref={videoRef}
          key={catId}
          className="sig-media"
          poster={posterSrc || undefined}
          muted
          loop
          playsInline
          preload="none"
          onError={() => setFailed(true)}
        />
      )}
      <div className="sig-overlay">
        <span className="sig-badge">✦ Taş Fırından İmza Pide</span>
      </div>
    </div>
  )
}
