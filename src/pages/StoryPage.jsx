import { useEffect, useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame,
  Sparkles,
  MapPin,
  UtensilsCrossed,
  Award,
  Compass,
  Volume2,
  VolumeX,
  Play,
  Pause
} from 'lucide-react'
import { PageMeta } from '../components/PageMeta.jsx'
import { HeroVideo } from '../components/HeroVideo.jsx'
import { INFO, useMenuData } from '../menu.js'
import { CONFIG } from '../config.js'
import { asset } from '../utils/asset.js'

const VALUES_LIST = [
  { icon: '🌿', title: 'Günlük Taze Malzeme', desc: 'Her sabah seçilen taze yeşillikler, etler ve baharatlar' },
  { icon: '🔥', title: 'Odun Ateşi & Taş Fırın', desc: 'Geleneksel taş fırında nar gibi kızaran çıtır hamur' },
  { icon: '👨‍🍳', title: 'Usta Ellerden', desc: 'Nesiller boyu aktarılan reçeteler ve el açması özen' },
  { icon: '🏡', title: 'Sıcak Ada Sofrası', desc: 'Büyükada’da kendinizi evinizde hissedeceğiniz samimi ortam' },
]

const PROMO_VIDEOS = [
  {
    id: 'tanitim-2',
    src: '/video/tanitimvideosu2.mp4',
    poster: '/video/tanitimvideosu2-poster.webp',
    badge: '🎙️ SESLİ TANITIM FİLMİ',
    title: 'Büyükada’da Lezzet Aşkla Başlar',
    desc: 'Vapur yolculuğundan taş fırın ateşine; çıtır lahmacun, uzayan kaşarlı pide, kömür ateşinde İskender ve sıcacık ada soframız.',
    quote: '“Her tabakta emek, her lokmada sıcacık bir lezzet var.”',
  },
  {
    id: 'tanitim-1',
    src: '/video/tanitimvideosu.mp4',
    poster: '/video/tanitimvideosu-poster.webp',
    badge: '🔥 TAŞ FIRIN & USTALIK',
    title: 'Taş Fırından Çıtır Lezzetler',
    desc: 'Ustalarımızın ellerinde açılan incecik hamurlar, taş fırın ateşinde nar gibi kızaran lahmacunlar ve misafirlerimizin keyifli sofrası.',
    quote: '“Taş fırının sıcaklığı, ada esnafının samimiyetiyle buluşuyor.”',
  },
]

const SIGNATURE_HIGHLIGHTS = [
  {
    name: 'Taş Fırın Lahmacun',
    tag: 'İncecik & Çıtır',
    desc: 'Zırh kıyması, taze baharatlar ve taş fırın ateşinde çıtırdayan el açması hamur.',
    img: '/img/lahmacun/lovemacunn-restaurant-kebapli-lahmacun-400x400.webp',
  },
  {
    name: 'Kaşarlı & Kuşbaşılı Pide',
    tag: 'Fırından Sıcak',
    desc: 'Altın sarısı kızarmış kenarlar, yumuşacık dinlendirilmiş et ve uzayan sıcak kaşar.',
    img: '/img/pide/lovemacunn-restaurant-kusbasi-kasar-400x400.webp',
  },
  {
    name: 'Tereyağlı İskender Kebap',
    tag: 'Kömür Ateşinde',
    desc: 'Tırnak pidesi üzerinde yaprak döner, özel domates sosu ve cızırdayan köpüklü tereyağı.',
    img: '/img/et/lovemacunn-restaurant-iskender-400x400.webp',
  },
  {
    name: 'Sıcak Fırın Künefe',
    tag: 'Tatlı Final',
    desc: 'Şerbeti tam kıvamında, içi bol peynirli ve üzeri Antep fıstıklı çıtır kadayıf lezzeti.',
    img: '/img/tatlilar/lovemacunn-restaurant-kunefe-400x400.webp',
  },
]

function PromoVideoCard({ video, isAudioActive, onToggleAudio }) {
  const videoRef = useRef(null)
  const cardRef = useRef(null)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isNearViewport, setIsNearViewport] = useState(false)
  const [pageIdleReady, setPageIdleReady] = useState(false)

  // 1) Sayfa ilk açılışını ve Hero videosunu asla yavaşlatmamak için ilk yükleme tamamlanana kadar bekle
  useEffect(() => {
    let timerId = null
    const markReady = () => {
      timerId = setTimeout(() => {
        setPageIdleReady(true)
      }, 450)
    }

    if (typeof document !== 'undefined' && document.readyState === 'complete') {
      markReady()
    } else if (typeof window !== 'undefined') {
      window.addEventListener('load', markReady, { once: true })
    }

    return () => {
      if (timerId) clearTimeout(timerId)
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', markReady)
      }
    }
  }, [])

  // 2) Yalnızca kullanıcı Tanıtım Filmleri bölümüne yaklaştığında (IntersectionObserver) videoyu yükle
  useEffect(() => {
    const node = cardRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearViewport(entry.isIntersecting)
      },
      { rootMargin: '120px 0px', threshold: 0.15 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // 3) Hem sayfa açılışı tamamlandığında hem de kart ekrana yaklaştığında (ve veri tasarrufu kapalıysa) videoyu DOM'a ekle
  useEffect(() => {
    if (shouldLoadVideo) return
    const saveData = typeof navigator !== 'undefined' && navigator.connection?.saveData === true
    if (pageIdleReady && isNearViewport && !saveData) {
      setShouldLoadVideo(true)
    }
  }, [pageIdleReady, isNearViewport, shouldLoadVideo])

  // 4) Ekranda görünürken oynat, ekrandan çıkınca duraklat
  useEffect(() => {
    const el = videoRef.current
    if (!el || !shouldLoadVideo) return

    if (isNearViewport) {
      el.play().then(() => setIsPlaying(true)).catch(() => {})
    } else {
      el.pause()
      setIsPlaying(false)
    }
  }, [isNearViewport, shouldLoadVideo])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = !isAudioActive
  }, [isAudioActive, shouldLoadVideo])

  const handleTogglePlay = (e) => {
    e.stopPropagation()
    if (!shouldLoadVideo) {
      setShouldLoadVideo(true)
      return
    }
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => {})
    } else {
      el.pause()
      setIsPlaying(false)
    }
  }

  const handleCardClick = () => {
    if (!shouldLoadVideo) {
      setShouldLoadVideo(true)
    }
    onToggleAudio(video.id)
  }

  const posterUrl = asset(video.poster)

  return (
    <article ref={cardRef} className={`story-reel-card ${isAudioActive ? 'audio-on' : ''}`}>
      <div className="story-reel-media" onClick={handleCardClick}>
        {/* Hafif WebP poster görseli: Sayfa açılışında yalnızca bu yüklenir (~25KB) */}
        <img
          src={posterUrl}
          alt={video.title}
          loading="lazy"
          decoding="async"
          className={`story-reel-poster ${videoReady ? 'is-hidden' : ''}`}
        />

        {shouldLoadVideo && (
          <video
            ref={videoRef}
            className={`story-reel-video ${videoReady ? 'is-ready' : ''}`}
            src={asset(video.src)}
            poster={posterUrl}
            muted={!isAudioActive}
            loop
            playsInline
            preload="metadata"
            onPlaying={() => {
              setVideoReady(true)
              setIsPlaying(true)
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
        <div className="story-reel-gradient" aria-hidden="true" />

        <span className="story-reel-badge">{video.badge}</span>

        <button
          type="button"
          className={`story-reel-sound-btn ${isAudioActive ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            if (!shouldLoadVideo) setShouldLoadVideo(true)
            onToggleAudio(video.id)
          }}
          aria-label={isAudioActive ? 'Sesi Kapat' : 'Sesi Aç'}
        >
          {isAudioActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span>{isAudioActive ? 'Ses Açık' : 'Sesi Aç'}</span>
        </button>

        <button
          type="button"
          className="story-reel-play-btn"
          onClick={handleTogglePlay}
          aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>

        <div className="story-reel-overlay-info">
          <h3 className="story-reel-title">{video.title}</h3>
          <p className="story-reel-quote">{video.quote}</p>
        </div>
      </div>

      <div className="story-reel-body">
        <p className="story-reel-desc">{video.desc}</p>
      </div>
    </article>
  )
}

export function StoryPage() {
  const { cats } = useMenuData()
  const validCats = useMemo(() => {
    return (cats || []).map((c) => ({
      ...c,
      items: (c.items || []).filter((i) => (Array.isArray(i) ? true : !i.hidden)),
    })).filter((c) => c.items && c.items.length > 0)
  }, [cats])

  const totalDishes = useMemo(() => {
    return validCats.reduce((n, c) => n + c.items.length, 0)
  }, [validCats])

  const catCount = validCats.length

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

  const imgMainIskender = asset('/img/et/lovemacunn-restaurant-iskender-400x400.webp')
  const imgSubLahmacun = asset('/img/lahmacun/lovemacunn-restaurant-kebapli-lahmacun-400x400.webp')
  const imgSubPide = asset('/img/pide/lovemacunn-restaurant-kusbasi-kasar-400x400.webp')

  const [activeAudioId, setActiveAudioId] = useState(null)

  const handleToggleAudio = (videoId) => {
    setActiveAudioId((prev) => (prev === videoId ? null : videoId))
  }

  return (
    <div className="story-page">
      <PageMeta
        title="Hakkımızda & Hikayemiz | Taş Fırın Lovemacun Büyükada"
        description="Büyükada'nın kalbinde ateşin, ustalığın ve lezzetin buluştuğu sıcacık adres: Taş Fırın Lovemacun'un hikayesi, tanıtım filmleri ve geleneksel lezzet aşkı."
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
          <span className="kicker">HİKAYEMİZ · BÜYÜKADA’NIN LEZZET DURAĞI</span>
          <h1 className="story-hero-h1">
            Ateşin, ustalığın ve<br />
            <em>lezzetin buluştuğu sofra.</em>
          </h1>
          <p className="story-hero-sub">
            Her sabah harlanan taş fırınımız, günlük açılan taze hamurumuz ve nesiller boyu aktarılan tariflerimizle Büyükada’da sıcacık bir lezzet hikayesi yazıyoruz.
          </p>
          <div className="story-hero-actions">
            <a
              href="#tanitim-filmleri"
              className="btn btn-story-menu-top"
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById('tanitim-filmleri')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <Play size={15} /> Tanıtım Filmlerimiz
            </a>
            <Link to="/" className="btn ghost story-hero-secondary-btn">
              <UtensilsCrossed size={15} /> Menüyü Keşfet
            </Link>
          </div>
        </div>
      </section>

      {/* 1) BİZ KİMİZ? GİRİŞ BÖLÜMÜ */}
      <section className="about container">
        <div className="about-grid">
          {/* Görsel Alanı: Profesyonel Restoran Lezzet Kolajı (Editorial Bento) */}
          <div
            className="story-editorial-collage"
            ref={visualRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Ana Büyük Lezzet Kartı */}
            <div className="editorial-main-card">
              <img
                src={imgMainIskender}
                alt="Kömür Ateşinde Tereyağlı İskender"
                className="editorial-main-img"
                loading="lazy"
              />
              <div className="editorial-main-overlay" />
              <span className="editorial-top-pill">🔥 TAŞ FIRIN &amp; KÖMÜR ATEŞİ</span>
              <div className="editorial-main-caption">
                <strong>Usta Eliyle Hazırlanan İmza Tatlar</strong>
                <span>Kömür ateşinde yaprak döner, halis tereyağı ve günlük taş fırın lezzetleri</span>
              </div>
            </div>

            {/* Alt İkili Vitrin Kartları */}
            <div className="editorial-sub-grid">
              <div className="editorial-sub-card">
                <img
                  src={imgSubLahmacun}
                  alt="Taş Fırın Kebaplı Lahmacun"
                  className="editorial-sub-img"
                  loading="lazy"
                />
                <div className="editorial-sub-overlay" />
                <div className="editorial-sub-caption">
                  <strong>Taş Fırın Lahmacun</strong>
                  <small>İncecik çıtır hamur</small>
                </div>
              </div>

              <div className="editorial-sub-card">
                <img
                  src={imgSubPide}
                  alt="Odun Ateşinde Kuşbaşılı Kaşarlı Pide"
                  className="editorial-sub-img"
                  loading="lazy"
                />
                <div className="editorial-sub-overlay" />
                <div className="editorial-sub-caption">
                  <strong>Odun Ateşinde Pide</strong>
                  <small>Kuşbaşı &amp; taze kaşar</small>
                </div>
              </div>
            </div>

            {/* Entegre Ustalık & Kalite Rozet Bandı */}
            <div className="editorial-badges-bar">
              <div className="editorial-badge-pill">
                <span className="editorial-badge-ico">🔥</span>
                <div className="editorial-badge-info">
                  <strong>Taş Fırın Ustalığı</strong>
                  <small>Geleneksel odun ateşi</small>
                </div>
              </div>
              <div className="editorial-badge-pill">
                <span className="editorial-badge-ico">✨</span>
                <div className="editorial-badge-info">
                  <strong>Günlük Taze Hamur</strong>
                  <small>Özel zırh ve el yapımı tarif</small>
                </div>
              </div>
            </div>
          </div>

          {/* Biz Kimiz Metin Alanı */}
          <div className="about-content">
            <span className="kicker">BİZ KİMİZ?</span>
            <h2 className="about-title">
              Büyükada’da Lezzet <br />
              <span className="txt-gradient">Aşkla Başlar</span>
            </h2>
            <p className="about-lead">
              Büyükada’nın kalbinde, taş fırın ateşinin sıcaklığını ve ustalığın en doğal halini buluşturduğumuz samimi bir adres var: <strong>Taş Fırın Lovemacun</strong>.
            </p>
            <p className="about-desc">
              Geleneksel Türk mutfağının vazgeçilmez tatlarını; çıtır çıtır lahmacunlarımızı, taş fırından yeni çıkmış kaşarlı ve kuşbaşılı pidelerimizi, kömür ateşinde pişen kebaplarımızı ve tereyağlı İskenderimizi her gün ilk günkü heyecanla hazırlıyoruz.
            </p>
          </div>
        </div>

        {/* 2) TANITIM FİLMLERİMİZ & TAŞ FIRIN VİTRİNİ */}
        <div id="tanitim-filmleri" className="story-photo-showcase">
          <div className="story-reels-header">
            <span className="kicker">🎬 TANITIM FİLMLERİMİZ</span>
            <h2 className="story-reels-heading">
              Taş Fırından Sofranıza <span className="txt-gradient">Canlı Lezzet Hikayemiz</span>
            </h2>
            <p className="story-reels-sub">
              Fırınımızın ateşini, ustalarımızın el emeğini ve Büyükada’daki sıcacık atmosferimizi yakından izleyin. Videoların üzerindeki <strong>Sesi Aç</strong> butonuna dokunarak sesli izleyebilirsiniz.
            </p>
          </div>

          <div className="story-reels-grid">
            {PROMO_VIDEOS.map((vid) => (
              <PromoVideoCard
                key={vid.id}
                video={vid}
                isAudioActive={activeAudioId === vid.id}
                onToggleAudio={handleToggleAudio}
              />
            ))}
          </div>

          {/* Konum & Slogan Şeridi */}
          <div className="story-photo-caption-card">
            <span className="caption-tag">BÜYÜKADA · NİZAM MAHALLESİ · İSKELEYE 2 DK</span>
            <h3 className="caption-title">Taş Fırında Gerçek Lezzet · Dumanı Üstünde Sofranızda</h3>
            <p className="caption-sub">“Her tabakta emek, her lokmada sıcacık bir lezzet var.”</p>
          </div>

          {/* Değer Rozetleri */}
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

        {/* 2.5) İŞTAH AÇICI İMZA LEZZETLER VİTRİNİ */}
        <div className="story-signature-showcase">
          <div className="story-reels-header">
            <span className="kicker">🍽️ SOFRAMIZIN YILDIZLARI</span>
            <h2 className="story-reels-heading">
              Fırından ve Izgaradan <span className="txt-gradient">İmza Lezzetlerimiz</span>
            </h2>
            <p className="story-reels-sub">
              Misafirlerimizin Büyükada’ya her gelişinde tekrar tekrar tattığı, dumanı üstünde favori lezzetlerimiz.
            </p>
          </div>

          <div className="story-sig-grid">
            {SIGNATURE_HIGHLIGHTS.map((item) => (
              <Link to="/" key={item.name} className="story-sig-card">
                <div className="story-sig-img-wrap">
                  <img
                    src={asset(item.img)}
                    alt={item.name}
                    className="story-sig-img"
                    loading="lazy"
                  />
                  <span className="story-sig-tag">{item.tag}</span>
                </div>
                <div className="story-sig-body">
                  <h3 className="story-sig-title">{item.name}</h3>
                  <p className="story-sig-desc">{item.desc}</p>
                </div>
              </Link>
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
