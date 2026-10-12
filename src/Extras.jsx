import { useEffect, useState, useRef } from 'react'

export const TAG_META = {
  sef: { label: 'Şefin Seçimi', icon: '★' },
  aci: { label: 'Acılı', icon: '🌶' },
  vegan: { label: 'Vegan', icon: 'V' },
  glutensiz: { label: 'Glutensiz', icon: 'GF' },
}
const KEY = 'lovemacun-liste'

export function useList() {
  const [list, setList] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {} }, [list])
  const toggle = (n, p) => setList((l) => { const c = { ...l }; c[n] ? delete c[n] : (c[n] = { p, q: 1 }); return c })
  const setQty = (n, d) => setList((l) => {
    if (!l[n]) return l
    const c = { ...l, [n]: { ...l[n], q: l[n].q + d } }
    if (c[n].q < 1) delete c[n]
    return c
  })
  const clear = () => setList({})
  const count = Object.values(list).reduce((a, x) => a + x.q, 0)
  return { list, toggle, setQty, clear, count }
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

// Asset listesi (derleme anında statik kontrol için)
const VIDEO_GLOB = import.meta.glob('/public/video/*.{mp4,webm,MP4}', { eager: true })
const POSTER_GLOB = import.meta.glob('/public/video/*-poster.{webp,jpg,png,jpeg}', { eager: true })
const PIDE_CUTOUT_GLOB = import.meta.glob('/public/img-cut/pide/*.{webp,png}', { eager: true })

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

  // 1) Poster tespiti: /video/<catId>-poster.webp -> fallbackCutout -> ilk pide cutout'ı
  const posterKey = `/public/video/${catId}-poster.webp`
  let posterSrc = null
  if (POSTER_GLOB[posterKey]) {
    posterSrc = `/video/${catId}-poster.webp`
  } else if (fallbackCutout) {
    posterSrc = fallbackCutout
  } else {
    const firstCutoutKey = Object.keys(PIDE_CUTOUT_GLOB).find((k) => !k.endsWith('-sm.webp'))
    if (firstCutoutKey) {
      posterSrc = firstCutoutKey.replace(/^\/public/, '')
    }
  }

  // 2) Video dosyası tespiti: /public/video/<catId>.mp4
  const videoKey = `/public/video/${catId}.mp4`
  const videoExists = Boolean(VIDEO_GLOB[videoKey])
  const videoSrc = videoExists ? `/video/${catId}.mp4` : null

  const usePosterOnly = isMobile || saveData

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

export function ListSheet({ L, onClose }) {
  const [show, setShow] = useState(false)
  const rows = Object.entries(L.list)
  const total = rows.reduce((a, [, x]) => a + x.p * x.q, 0)
  return (
    <div className="lsheet-bg" onClick={onClose}>
      <div className={'lsheet' + (show ? ' big' : '')} onClick={(e) => e.stopPropagation()}>
        <div className="lhead">
          <h3>{show ? 'Masa Listemiz' : 'Listem'}</h3>
          <button onClick={onClose} aria-label="Kapat">✕</button>
        </div>
        {rows.length === 0 && <p className="lempty">Henüz bir şey eklemedin. Kartlardaki ♥ ile yemekleri listene ekle.</p>}
        {rows.map(([n, x]) => (
          <div key={n} className="lrow">
            <span className="ln">{n}</span>
            {show ? <b>× {x.q}</b> : (
              <span className="lq">
                <button onClick={() => L.setQty(n, -1)} aria-label="Azalt">−</button>
                <b>{x.q}</b>
                <button onClick={() => L.setQty(n, 1)} aria-label="Artır">+</button>
              </span>
            )}
          </div>
        ))}
        {rows.length > 0 && (
          <>
            <div className="ltotal"><span>Tahmini toplam</span><b>{total.toLocaleString('tr-TR')} ₺</b></div>
            <p className="lnote">Bu liste garsonla veya servis personeliyle paylaşmanız için hazırlanmıştır.</p>
            <div className="lbtns">
              <button className="btn" onClick={() => setShow(!show)}>{show ? 'Düzenle' : 'Garsona Göster'}</button>
              {!show && <button className="btn ghost" onClick={L.clear}>Temizle</button>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
