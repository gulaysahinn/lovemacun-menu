import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame,
  Sparkles,
  MapPin,
  UtensilsCrossed,
  ShieldCheck,
  Award,
  Users,
  Compass,
  Clock,
  ArrowRight
} from 'lucide-react'
import { PageMeta } from '../components/PageMeta.jsx'
import { HeroVideo } from '../components/HeroVideo.jsx'
import { CATS, INFO } from '../menu.js'
import { CONFIG } from '../config.js'
import { asset } from '../utils/asset.js'

const validCats = CATS.filter((c) => c.items && c.items.length > 0)
const totalDishes = validCats.reduce((n, c) => n + c.items.length, 0)
const catCount = validCats.length

const VALUES_LIST = [
  { icon: '🌿', title: 'Taze Malzeme', desc: 'Günlük yeşillikler ve taze malzemeler' },
  { icon: '🔥', title: 'Taş Fırın Lezzeti', desc: 'Geleneksel taş fırında nar gibi kızaran hamur' },
  { icon: '⭐', title: 'Kaliteli Hizmet', desc: 'Güler yüzlü ada esnafı samimiyeti' },
  { icon: '🏡', title: 'Sıcak Ortam', desc: 'Kendinizi rahat hissedeceğiniz samimi sofra' },
]

export function StoryPage() {
  const visualRef = useRef(null)
  const targetTilt = useRef({ x: 0, y: 0 })
  const currentTilt = useRef({ x: 0, y: 0 })
  const animFrameId = useRef(null)

  // Desktop mouse tilt for floating plates
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

  const platePide = asset('/img-cut/pide/lovemacunn-restaurant-kiymali-kasarli-400x400.webp')
  const plateIskender = asset('/img-cut/et/lovemacunn-restaurant-iskender-400x400.webp')
  const plateKunefe = asset('/img-cut/tatlilar/lovemacunn-restaurant-kunefe-400x400.webp')

  return (
    <div className="story-page">
      <PageMeta
        title="Hakkımızda & Hikayemiz | Taş Fırın Lovemacun Büyükada"
        description="Büyükada'nın kalbinde, taş fırın ustalığı ve nesiller boyu aktarılan tarifler: Taş Fırın Lovemacun'un hikayesi ve geleneksel lezzet aşkı."
        canonical="https://tasfirinlovemacun.com/hikayemiz"
      />

      {/* Hero Video Section (İskender videosu arka plan, ~54vh) */}
      <section className="story-hero-section">
        <HeroVideo
          baseName="iskender"
          poster={asset('/video/iskender-poster.webp')}
          alt="Taş Fırın İskender ve Kömür Ateşi"
        />
        <div className="hero-video-shade" aria-hidden="true" />
        <div className="hero-embers" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <div className="steam" aria-hidden="true"><i /><i /><i /></div>

        <div className="container story-hero-content">
          <span className="kicker">BÜYÜKADA · TAŞ FIRIN USTALIĞI</span>
          <h1 className="story-hero-h1">Aşkla yoğrulan hamur,<br /><em>çıtır lezzet.</em></h1>
          <p className="story-hero-sub">
            Büyükada’nın kalbinde, taş fırın ustalığı ve nesiller boyu aktarılan tariflerle hazırlanan lezzet durağı.
          </p>
          <div className="story-hero-actions">
            <Link to="/" className="btn btn-story-menu-top">
              Menüyü Keşfet
            </Link>
            <a href={CONFIG.mapsDirectionsUrl} target="_blank" rel="noreferrer" className="btn ghost">
              <MapPin size={15} /> Bizi Ziyaret Edin
            </a>
          </div>
        </div>
      </section>

      {/* 1) BİZ KİMİZ? GİRİŞ BÖLÜMÜ */}
      <section className="about container">
        <div className="about-grid">
          {/* Görsel Alanı (Pide, İskender, Künefe 3D Tilt) */}
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
                    <small>Usta Dokunuşu</small>
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

          {/* Biz Kimiz Metin Alanı */}
          <div className="about-content">
            <span className="kicker">BİZ KİMİZ?</span>
            <h2 className="about-title">
              Büyükada'nın Kalbinde <br />
              <span className="txt-gradient">Taş Fırın Ustalığı</span>
            </h2>
            <p className="about-lead">
              Büyükada’nın kalbinde, taş fırın lezzetleri tutkunları için çok özel bir durak var: <strong>Taş Fırın Lovemacun</strong>.
            </p>
            <p className="about-desc">
              Biz, geleneksel Türk mutfağının en sevilen lezzetlerini, adanın o kendine has büyüleyici ve samimi atmosferiyle harmanlayan bir taş fırın mutfağıyız. Çıktığımız bu lezzet yolculuğunda amacımız; misafirlerimize nesiller boyu aktarılan tariflerle taze, özenli ve keyifli bir lezzet deneyimi sunmak.
            </p>
          </div>
        </div>

        {/* 2) GERÇEK FOTOĞRAF VİTRİNİ & RESTORAN POSTERİ */}
        <div className="story-photo-showcase">
          <div className="story-photo-frame">
            <img
              src={asset('/about/lovemacun-story-banner.jpg')}
              alt="Taş Fırın Lovemacun Büyükada Restoranı ve Ustalarımız"
              className="story-banner-img"
              loading="lazy"
            />
          </div>
          {/* Fotoğrafın altındaki başlık alanı görsel dışına alındı (üst üste binmeyi önler) */}
          <div className="story-photo-caption-card">
            <span className="caption-tag">BÜYÜKADA · NİZAM MAHALLESİ</span>
            <h3 className="caption-title">Taş Fırında Gerçek Lezzet · 2 Dk Mesafede</h3>
            <p className="caption-sub">Aşkımızı kattık, lezzet oldu!</p>
          </div>

          {/* Poster Altı Değer Rozetleri */}
          <div className="story-values-grid">
            {VALUES_LIST.map((val, idx) => (
              <div key={idx} className="story-val-card">
                <span className="story-val-ico">{val.icon}</span>
                <div className="story-val-info">
                  <strong>{val.title}</strong>
                  <span>{val.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3) GELENEKSEL REÇETE & TAŞ FIRIN AŞKI */}
        <div className="story-tradition-section">
          <div className="tradition-head">
            <span className="kicker">👨‍🍳 USTALIK & TUTKU</span>
            <h2 className="tradition-title">
              Geleneksel Reçete, <span className="txt-gradient">Taş Fırın Aşkı</span>
            </h2>
            <p className="tradition-intro">
              Bizi biz yapan, ismimize de ilham veren geleneksel taş fırına ve işimize duyduğumuz sevgidir. Her sabah taş fırınımızı özenle hazırlıyor, hamurumuzu taze malzemeler ve nesiller boyu aktarılan tariflerle yoğuruyoruz.
            </p>
          </div>

          <div className="tradition-cards-grid">
            <div className="tradition-card">
              <div className="tradition-card-ico">
                <Flame size={24} />
              </div>
              <h3 className="tradition-card-title">İncecik ve Çıtır</h3>
              <p className="tradition-card-desc">
                Nesillerden gelen özel tarifimizle açılan incecik hamurlarımız, fırından tam kıvamında, çıtır çıtır çıkıyor.
              </p>
            </div>

            <div className="tradition-card">
              <div className="tradition-card-ico">
                <Sparkles size={24} />
              </div>
              <h3 className="tradition-card-title">Özenle Seçilen Malzemeler</h3>
              <p className="tradition-card-desc">
                Lahmacun ve pidelerimizde kullandığımız etlerden sebzelere, baharatlardan yeşilliklere kadar her malzemeyi özenle ve taze olarak seçiyoruz.
              </p>
            </div>
          </div>
        </div>

        {/* 4) MİSYONUMUZ & VİZYONUMUZ */}
        <div className="story-mission-section">
          <div className="mission-card">
            <div className="mission-badge">
              <Award size={20} />
              <span>MİSYONUMUZ</span>
            </div>
            <h3 className="mission-title">Hakiki Taş Fırın Lezzeti</h3>
            <p className="mission-text">
              Büyükada’nın yerlilerine ve adayı ziyarete gelen misafirlerimize, samimi bir esnaf anlayışı ve güler yüzle, özenle hazırlanan taş fırın lezzetlerini sunmaktır.
            </p>
          </div>

          <div className="mission-card vision-card">
            <div className="mission-badge">
              <Compass size={20} />
              <span>VİZYONUMUZ</span>
            </div>
            <h3 className="mission-title">Ada Kültürünün Bir Parçası</h3>
            <p className="mission-text">
              Ada kültürünün bir parçası haline gelerek, Büyükada denince akla gelen lezzet duraklarından biri olmak ve taş fırın sevgisini paylaşmaktır.
            </p>
          </div>
        </div>

        {/* 5) İSTATİSTİK KARTLARI (Doğrudan veriden son değer, animasyonsuz) */}
        <div className="about-stats">
          <div className="about-stat-card">
            <div className="stat-meta">
              <b>{totalDishes}+</b>
              <span>çeşit lezzet</span>
            </div>
          </div>

          <div className="about-stat-card">
            <div className="stat-meta">
              <b>{catCount}</b>
              <span>kategori</span>
            </div>
          </div>

          <div className="about-stat-card">
            <div className="stat-meta">
              <b>{INFO.hours.replace(' – ', '–')}</b>
              <span>her gün açık</span>
            </div>
          </div>
        </div>

        {/* 6) SİZİ DE SOFRAMIZA BEKLERİZ (KAPANIŞ VE DAVET) */}
        <div className="story-invite-card">
          <div className="invite-glow" aria-hidden="true" />
          <div className="invite-content">
            <span className="invite-kicker">🍕 SİZİ DE SOFRAMIZA BEKLERİZ!</span>
            <h2 className="invite-title">
              Dostlukla ve Sevgiyle Paylaşılan Bir Sofra
            </h2>
            <p className="invite-text">
              İster adada keyifli bir bisiklet turunun ardından mola vermiş olun, ister ada havasıyla acıkmış bir gezgin… 
              Taş Fırın Lovemacun’a adım attığınızda, samimi bir ortam ve dumanı tüten, çıtır lezzetler sizi bekliyor.
            </p>
            <p className="invite-quote">
              “Biz, lahmacunu ve taş fırın lezzetlerini; dostlukla, sevgiyle paylaşılan bir sofra olarak görüyoruz.”
            </p>
            <span className="invite-signature">— Taş Fırın Lovemacun</span>

            <div className="invite-actions">
              <Link to="/" className="btn btn-story-menu-bottom">
                <UtensilsCrossed size={16} /> Menüyü Keşfet & Sipariş Ver
              </Link>
              <a
                href={CONFIG.mapsDirectionsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-invite-route"
              >
                <MapPin size={16} /> Yol Tarifi Al (2 Dk Mesafede)
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
