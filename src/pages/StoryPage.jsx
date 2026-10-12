import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta.jsx'
import { HeroVideo } from '../components/HeroVideo.jsx'
import { CATS, INFO } from '../menu.js'
import { CONFIG } from '../config.js'

const validCats = CATS.filter((c) => c.items && c.items.length > 0)
const totalDishes = validCats.reduce((n, c) => n + c.items.length, 0)
const catCount = validCats.length

const PILLARS = [
  ['01', 'Taş Fırında', 'Lahmacun ve pideler taş fırında odun ateşinde çıtır çıtır pişer.'],
  ['02', 'Kömür Ateşinde', 'Adana, şiş ve pirzolalar közün üzerinde lezzetle mühürlenir.'],
  ['03', 'El Emeği & Taze', 'Usta ellerde açılan hamur ve Büyükada\'da günlük taze malzemeler.'],
]

function useCounter(targetNumber, isVisible, duration = 800) {
  const [count, setCount] = useState(targetNumber)
  const animatedRef = useRef(false)

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setCount(targetNumber)
      return
    }

    if (!isVisible || targetNumber === 0 || animatedRef.current) {
      return
    }
    animatedRef.current = true
    setCount(0)

    let startTime = null
    let animId = null

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(1, elapsed / duration)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(easeOut * targetNumber))

      if (progress < 1) {
        animId = requestAnimationFrame(step)
      } else {
        setCount(targetNumber)
      }
    }

    animId = requestAnimationFrame(step)
    return () => {
      if (animId) cancelAnimationFrame(animId)
      setCount(targetNumber)
    }
  }, [isVisible, targetNumber, duration])

  return count
}

export function StoryPage() {
  const visualRef = useRef(null)
  const targetTilt = useRef({ x: 0, y: 0 })
  const currentTilt = useRef({ x: 0, y: 0 })
  const animFrameId = useRef(null)

  const statsRef = useRef(null)
  const [statsVisible, setStatsVisible] = useState(false)

  const countTotal = useCounter(totalDishes, statsVisible, 800)
  const countCats = useCounter(catCount, statsVisible, 800)

  useEffect(() => {
    if (!statsRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  // Desktop mouse tilt
  useEffect(() => {
    const isDesktop = window.matchMedia('(hover: hover) and (min-width: 820px)').matches
    if (!isDesktop) return

    let running = true
    const loop = () => {
      if (!running) return
      currentTilt.current.x += (targetTilt.current.x - currentTilt.current.x) * 0.08
      currentTilt.current.y += (targetTilt.current.y - currentTilt.current.y) * 0.08

      const clampedX = Math.max(-6, Math.min(6, currentTilt.current.x))
      const clampedY = Math.max(-6, Math.min(6, currentTilt.current.y))

      if (visualRef.current) {
        visualRef.current.style.setProperty('--tilt-x', `${clampedX.toFixed(2)}deg`)
        visualRef.current.style.setProperty('--tilt-y', `${clampedY.toFixed(2)}deg`)
      }
      animFrameId.current = requestAnimationFrame(loop)
    }
    animFrameId.current = requestAnimationFrame(loop)
    return () => {
      running = false
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
    }
  }, [])

  const handleMouseMove = (e) => {
    if (!visualRef.current) return
    const rect = visualRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    targetTilt.current = {
      x: -y * 12,
      y: x * 12,
    }
  }

  const handleMouseLeave = () => {
    targetTilt.current = { x: 0, y: 0 }
  }

  const platePide = '/img-cut/pide/lovemacunn-restaurant-kiymali-kasarli-400x400.webp'
  const plateIskender = '/img-cut/et/lovemacunn-restaurant-iskender-400x400.webp'
  const plateKunefe = '/img-cut/tatlilar/lovemacunn-restaurant-kunefe-400x400.webp'

  return (
    <div className="story-page">
      <PageMeta
        title="Hikayemiz | Taş Fırın Lovemacun Büyükada"
        description="Büyükada'da aşkla yoğrulan hamur ve odun ateşi: Taş Fırın Lovemacun'un lezzet hikayesi ve ustalığı."
        canonical="https://tasfirinlovemacun.com/hikayemiz"
      />

      {/* Hero Video Section (İskender videosu arka plan, ~50vh) */}
      <section className="story-hero-section">
        <HeroVideo
          baseName="iskender"
          poster="/video/iskender-poster.webp"
          alt="Taş Fırın İskender ve Kömür Ateşi"
        />
        <div className="hero-video-shade" aria-hidden="true" />
        <div className="hero-embers" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <div className="steam" aria-hidden="true"><i /><i /><i /></div>

        <div className="container story-hero-content">
          <span className="kicker">BÜYÜKADA · TAŞ FIRIN USTALIĞI</span>
          <h1 className="story-hero-h1">Aşkla yoğrulan hamur,<br /><em>çıtır lezzet.</em></h1>
          <p className="story-hero-sub">
            Geleneksel taş fırında odun ateşiyle pişen çıtır lahmacun ve pideler, kömür ateşinde pişen nefis kebaplar.
          </p>
          <div className="story-hero-actions">
            <Link to="/" className="btn btn-story-menu-top">
              Menüyü Keşfet
            </Link>
            <Link to="/iletisim" className="btn ghost">
              Bizi Ziyaret Edin
            </Link>
          </div>
        </div>
      </section>

      {/* Narrative & Visual Plates Section */}
      <section className="about container">
        <div className="about-grid">
          {/* Görsel Alani (Pide, İskender, Künefe) */}
          <div
            className="about-visual"
            ref={visualRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="about-halo-wrap" aria-hidden="true">
              <div className="about-halo-ring" />
              <div className="about-halo-core" />
            </div>

            <div className="about-steam" aria-hidden="true">
              <i className="wisp wisp-1" />
              <i className="wisp wisp-2" />
              <i className="wisp wisp-3" />
            </div>

            <div className="about-parallax-layer">
              <div className="about-dish-wrap dish-pide">
                <img src={platePide} alt="Taş Fırın Pide" className="about-dish-img" loading="lazy" />
              </div>

              <div className="about-dish-wrap dish-iskender">
                <img src={plateIskender} alt="Kömür Ateşinde İskender" className="about-dish-img" loading="lazy" />
              </div>

              <div className="about-dish-wrap dish-kunefe">
                <img src={plateKunefe} alt="Sıcak Künefe" className="about-dish-img" loading="lazy" />
              </div>

              <div className="about-badges-row">
                <div className="about-badge-item badge-left">
                  <span className="about-badge-icon">🔥</span>
                  <div className="about-badge-text">
                    <strong>Taş Fırın</strong>
                    <small>Odun Ateşi</small>
                  </div>
                </div>

                <div className="about-badge-item badge-right">
                  <span className="about-badge-icon">✨</span>
                  <div className="about-badge-text">
                    <strong>Özel Tarif</strong>
                    <small>Günlük Hamur</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metin Alanı */}
          <div className="about-content" style={{ transitionDelay: '80ms' }}>
            <span className="kicker">HİKAYEMİZ</span>
            <h2 className="about-title">
              Büyükada'nın <span className="txt-gradient">taş fırını</span>
            </h2>
            <p className="about-desc">
              Aşkla yoğrulan hamur taş fırında çıtır çıtır pişer, kömür ateşinin kokusu kebaba karışır. Büyükada'da fırın lezzetleri ve kömür ateşinde kebap tek sofrada buluşuyor.
            </p>
            <p className="about-subdesc" style={{ color: '#c4b3a3', lineHeight: 1.6, fontSize: '0.96rem', marginTop: '0.75rem' }}>
              Her sabah günün ilk ışıklarıyla yakılan fırınımızda odun ateşi közlenir, ustalarımızın hünerli ellerinde açılan incecik hamurlar sıcak fırın taşıyla buluşur.
            </p>
          </div>
        </div>

        {/* İstatistik Kutuları (Mobilde tek satırda 3 küçük kart, ikon yok, rakam üstte, etiket altta) */}
        <div className="about-stats" ref={statsRef}>
          <div className="about-stat-card">
            <div className="stat-meta">
              <b>{countTotal}+</b>
              <span>çeşit lezzet</span>
            </div>
          </div>

          <div className="about-stat-card">
            <div className="stat-meta">
              <b>{countCats}</b>
              <span>kategori</span>
            </div>
          </div>

          <div className="about-stat-card">
            <div className={`stat-meta stat-fade ${statsVisible ? 'visible' : ''}`}>
              <b>{INFO.hours.replace(' – ', '–')}</b>
              <span>her gün açık</span>
            </div>
          </div>
        </div>

        {/* 01-02-03 Değerleri */}
        <div className="pillars">
          {PILLARS.map(([n, t, d], i) => (
            <div key={n} className="pillar-simple" style={{ transitionDelay: i * 80 + 'ms' }}>
              <span className="pillar-badge">{n}</span>
              <span className="pillar-text"><strong>{t}:</strong> {d}</span>
            </div>
          ))}
        </div>

        {/* Sayfa Altı Menü Butonu */}
        <div className="story-bottom-cta">
          <Link to="/" className="btn btn-story-menu-bottom">
            Menüyü Gör & Sipariş Ver
          </Link>
        </div>
      </section>
    </div>
  )
}
