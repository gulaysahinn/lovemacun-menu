import React, { useState, useEffect, useRef } from 'react'
import { CATS, INFO } from './menu.js'
import { CONFIG } from './config.js'
import { Flame, ChefHat, Sparkles, UtensilsCrossed, LayoutGrid, Clock, MapPin, Phone } from 'lucide-react'

const validCats = CATS.filter((c) => c.items && c.items.length > 0)
const total = validCats.reduce((n, c) => n + c.items.length, 0)
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
    if (!isVisible || targetNumber === 0 || animatedRef.current) return
    animatedRef.current = true
    setCount(0)

    let startTime = null
    let animId = null

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(1, elapsed / duration)
      // Ease-out cubic: 1 - (1 - progress)^3
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
    }
  }, [isVisible, targetNumber, duration])

  return count
}

export function About({ feat = [] }) {
  const visualRef = useRef(null)
  const targetTilt = useRef({ x: 0, y: 0 })
  const currentTilt = useRef({ x: 0, y: 0 })
  const animFrameId = useRef(null)

  const statsRef = useRef(null)
  const [statsVisible, setStatsVisible] = useState(false)

  const countTotal = useCounter(total, statsVisible, 800)
  const countCats = useCounter(catCount, statsVisible, 800)

  // IntersectionObserver: Sayılar kutu ekrana girince tek seferlik 0'dan hedefe saysın
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

  // Masaüstünde fare hareketine göre en fazla 6° tilt/parallax (requestAnimationFrame ile)
  useEffect(() => {
    const isDesktop = window.matchMedia('(hover: hover) and (min-width: 820px)').matches
    if (!isDesktop) return

    let running = true
    const loop = () => {
      if (!running) return
      // Yumuşak lerp geçişi
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

  // Mobilde fare yok: jiroskop YOK, sadece kaydırmaya (scroll) göre 10-15px parallax
  useEffect(() => {
    const isMobile = !window.matchMedia('(hover: hover) and (min-width: 820px)').matches
    if (!isMobile) return

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (visualRef.current) {
            const rect = visualRef.current.getBoundingClientRect()
            const winH = window.innerHeight || 800
            const centerDiff = (rect.top + rect.height / 2) - winH / 2
            // 10-15px arası yumuşak parallax kayması
            const offset = Math.max(-14, Math.min(14, (centerDiff / winH) * 26))
            visualRef.current.style.setProperty('--scroll-y', `${offset.toFixed(1)}px`)
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleMouseMove = (e) => {
    if (!visualRef.current) return
    const rect = visualRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    // En fazla 6 derece tilt: [-0.5, 0.5] -> [-6, 6]
    targetTilt.current = {
      x: -y * 12,
      y: x * 12,
    }
  }

  const handleMouseLeave = () => {
    targetTilt.current = { x: 0, y: 0 }
  }

  // Üçlü dengeli lezzet kompozisyonu: Pide, İskender ve Künefe (Hero'daki Lahmacun tekrar etmez)
  const platePide = '/img-cut/pide/lovemacunn-restaurant-kiymali-kasarli-400x400.webp'
  const plateIskender = '/img-cut/et/lovemacunn-restaurant-iskender-400x400.webp'
  const plateKunefe = '/img-cut/tatlilar/lovemacunn-restaurant-kunefe-400x400.webp'

  return (
    <section id="hikaye" className="about container">
      <div className="about-grid">
        {/* SAĞ TARAF (GÖRSEL ALANI) - Dengeli Üçlü Kompozisyon (Pide, İskender, Künefe) */}
        <div
          className="about-visual rv"
          ref={visualRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Yavaş dönen turuncu ışık halkası */}
          <div className="about-halo-wrap" aria-hidden="true">
            <div className="about-halo-ring" />
            <div className="about-halo-core" />
          </div>

          {/* Hafif yükselen buhar */}
          <div className="about-steam" aria-hidden="true">
            <i className="wisp wisp-1" />
            <i className="wisp wisp-2" />
            <i className="wisp wisp-3" />
          </div>

          {/* Parallax ve Tilt Katmanı - Tabakların üstüne binmeyen rozetler */}
          <div className="about-parallax-layer">
            <div className="about-trio-stage">
              {/* Sol: Kıymalı Kaşarlı Pide */}
              <div className="about-trio-item item-pide">
                <img
                  src={platePide}
                  alt="Kıymalı Kaşarlı Pide"
                  className="img-cutout"
                  loading="lazy"
                  width="360"
                  height="360"
                />
              </div>

              {/* Merkez: Bakır Tabakta İskender Kebap */}
              <div className="about-trio-item item-iskender">
                <img
                  src={plateIskender}
                  alt="İskender Kebap"
                  className="img-cutout"
                  loading="eager"
                  width="400"
                  height="400"
                />
              </div>

              {/* Sağ: Şerbetli Künefe */}
              <div className="about-trio-item item-kunefe">
                <img
                  src={plateKunefe}
                  alt="Künefe"
                  className="img-cutout"
                  loading="lazy"
                  width="340"
                  height="340"
                />
              </div>
            </div>

            {/* Rozetler tabakların üzerine binmeyecek şekilde köşelere ve kenarlara yerleşir */}
            <div className="about-badges-row" aria-hidden="true">
              <div className="about-badge badge-pide">
                <Flame className="badge-ico" size={13} />
                <span>Taş Fırın</span>
              </div>
              <div className="about-badge badge-iskender">
                <ChefHat className="badge-ico" size={13} />
                <span>Köz Ateşinde</span>
              </div>
              <div className="about-badge badge-kunefe">
                <Sparkles className="badge-ico" size={13} />
                <span>Özel Tarif</span>
              </div>
            </div>
          </div>
        </div>

        {/* SOL TARAF (METİN ALANI) */}
        <div className="about-txt rv">
          <span className="kicker">HİKAYEMİZ</span>
          <h2 className="about-title">
            Büyükada'nın <span className="txt-gradient">taş fırını</span>
          </h2>
          <p className="about-desc">
            Aşkla yoğrulan hamur taş fırında çıtır çıtır pişer, kömür ateşinin kokusu kebaba karışır. Büyükada'da fırın lezzetleri ve kömür ateşinde kebap tek sofrada.
          </p>
          <a className="btn btn-about" href="#menu">
            Menüyü Keşfet
          </a>
        </div>
      </div>

      {/* ALT İSTATİSTİK KUTULARI - 3 eşit kart, içerik ortalı, ikon üstte, sayı altta */}
      <div className="about-stats rv" ref={statsRef}>
        <div className="about-stat-card">
          <UtensilsCrossed className="stat-ico" size={26} />
          <div className="stat-meta">
            <b>{countTotal}+</b>
            <span>çeşit lezzet</span>
          </div>
        </div>

        <div className="about-stat-card">
          <LayoutGrid className="stat-ico" size={26} />
          <div className="stat-meta">
            <b>{countCats}</b>
            <span>kategori</span>
          </div>
        </div>

        <div className="about-stat-card">
          <Clock className="stat-ico" size={26} />
          <div className={`stat-meta stat-fade ${statsVisible ? 'visible' : ''}`}>
            <b>{INFO.hours.replace(' – ', '–')}</b>
            <span>her gün açık</span>
          </div>
        </div>
      </div>

      {/* 01-02-03 SATIRI - Sade, ikonsuz, tek satır metin */}
      <div className="pillars rv">
        {PILLARS.map(([n, t, d], i) => (
          <div key={n} className="pillar-simple" style={{ transitionDelay: i * 80 + 'ms' }}>
            <span className="pillar-badge">{n}</span>
            <span className="pillar-text"><strong>{t}:</strong> {d}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Visit() {
  return (
    <section id="konum" className="visit container">
      <div className="section-head rv">
        <span className="kicker">BİZİ BULUN</span>
        <h2>Sofranız hazır</h2>
      </div>
      <div className="visit-grid">
        <div className="map-container rv">
          <iframe
            className="map"
            title="Taş Fırın Lovemacun Konum"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={CONFIG.mapsEmbedUrl}
          />
        </div>
        <div className="vinfo rv" style={{ transitionDelay: '120ms' }}>
          <div className="vcard">
            <span className="vcard-label">
              <MapPin size={16} className="vcard-ico" /> adres
            </span>
            <p>{CONFIG.address}</p>
          </div>
          <div className="vcard">
            <span className="vcard-label">
              <Clock size={16} className="vcard-ico" /> çalışma saatleri
            </span>
            <p>{CONFIG.hoursDetail}</p>
          </div>
          <div className="vcard">
            <span className="vcard-label">
              <Phone size={16} className="vcard-ico" /> telefon
            </span>
            <p>
              <a href={'tel:' + CONFIG.phonePrimary.tel}>{CONFIG.phonePrimary.display}</a>
              <span className="vcard-sub-phone" style={{ color: '#ad9b8b', fontSize: '0.9em', marginLeft: '6px' }}>
                / <a href={'tel:' + CONFIG.phoneSecondary.tel}>{CONFIG.phoneSecondary.display}</a>
              </span>
            </p>
          </div>
          <div className="vbtns">
            <a className="btn btn-visit-primary" href={CONFIG.mapsDirectionsUrl} target="_blank" rel="noreferrer">
              Yol Tarifi Al
            </a>
            <a className="btn btn-visit-outline" href={'tel:' + CONFIG.phonePrimary.tel}>
              Ara ({CONFIG.phonePrimary.display})
            </a>
            <a className="btn btn-visit-outline" href={CONFIG.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
