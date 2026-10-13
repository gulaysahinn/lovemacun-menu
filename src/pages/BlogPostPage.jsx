import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  User,
  ArrowLeft,
  UtensilsCrossed,
  MapPin,
  Clock,
  Share2,
  Check,
  Flame,
  Sparkles,
  ShieldCheck,
  Lightbulb,
  Phone,
  ArrowRight
} from 'lucide-react'
import { PageMeta } from '../components/PageMeta.jsx'
import { CONFIG } from '../config.js'
import { BLOG_POSTS } from '../data/blog.js'
import images from '../images.json'
import { asset } from '../utils/asset.js'

function InstagramIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

import { CATS, FEATURED } from '../menu.js'

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

// Menü Verisinden Okunan Öne Çıkan Ürünler (Tek kaynak: menu.js)
const FEATURED_MENU_ITEMS = FEATURED.map((featuredName) => {
  for (const cat of CATS) {
    for (const item of cat.items) {
      const itemName = Array.isArray(item) ? item[0] : item.name
      if (itemName === featuredName) {
        const price = Array.isArray(item) ? item[1] : item.price
        const imgEntry = images[slug(featuredName)]
        const img = asset(
          typeof imgEntry === 'string'
            ? imgEntry
            : imgEntry?.sm || imgEntry?.lg || '/img/lahmacun-hero.webp'
        )
        return { name: featuredName, price, catId: cat.id, img }
      }
    }
  }
  return null
}).filter(Boolean)

export function BlogPostPage() {
  const post = BLOG_POSTS[0]
  const [copied, setCopied] = useState(false)
  const [galleryImages, setGalleryImages] = useState(null)
  const [coverSrc, setCoverSrc] = useState(asset('/blog/WhatsApp-Image-2026-06-08-at-16.16.22.webp'))
  const progressBarRef = useRef(null)

  // Kelime sayısı ve okuma süresi hesabı (dakikada ~200 kelime)
  const fullText = post.paragraphs.join(' ')
  const wordCount = fullText.trim().split(/\s+/).length
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200))

  // Kapak ve Galeri görselleri kontrolü (varsa cover / gallery-1,2,3 kullan)
  useEffect(() => {
    // cover.webp kontrolü
    const testCover = new Image()
    const targetCover = asset('/blog/cover.webp')
    testCover.src = targetCover
    testCover.onload = () => setCoverSrc(targetCover)

    // gallery kontrolü (1, 2, 3 tamamsa render edilir)
    const g1 = new Image()
    const g2 = new Image()
    const g3 = new Image()
    const src1 = asset('/blog/gallery-1.webp')
    const src2 = asset('/blog/gallery-2.webp')
    const src3 = asset('/blog/gallery-3.webp')
    let loadedCount = 0
    const onImgLoad = () => {
      loadedCount++
      if (loadedCount === 3) {
        setGalleryImages([src1, src2, src3])
      }
    }
    g1.onload = onImgLoad
    g2.onload = onImgLoad
    g3.onload = onImgLoad
    g1.src = src1
    g2.src = src2
    g3.src = src3
  }, [])

  // Header altında 3px turuncu okuma ilerleme çubuğu
  useEffect(() => {
    let ticking = false
    const updateProgress = () => {
      const bar = progressBarRef.current
      if (!bar) return
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollHeight > 0 ? Math.min(Math.max(window.scrollY / scrollHeight, 0), 1) : 0
      bar.style.transform = `scaleX(${progress})`
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    updateProgress()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // Paylaş Düğmesi (Web Share API, yoksa panoya kopyala)
  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: post.summary,
      url: window.location.href
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // sessiz fallback
    }
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author
    },
    publisher: {
      '@type': 'Restaurant',
      name: CONFIG.name,
      logo: 'https://tasfirinlovemacun.com/logo-badge.png'
    },
    image: `https://tasfirinlovemacun.com${coverSrc}`,
    description: post.summary
  }

  // Paragraf indeksleri:
  // p[0]: Lead
  // p[1]: Pull-quote
  // p[2]: Başlık: "Neden Bu Kadar Seviliyor?"
  // p[3]: "Gerçek Taş Fırın Lezzeti: ..."
  // p[4]: "Çıtır Çıtır ve İncecik: ..."
  // p[5]: "Malzeme Kalitesi: ..."
  // p[6]: Başlık: "Menüde Neler Var? (Sadece Lahmacun mu?)"
  // p[7]: "Tabii ki kral koltuğunda lahmacun oturuyor..."
  // p[8]: "Ancak fırından sadece lahmacun çıkmıyor:"
  // p[9]: "Nefis Pideler: ..."
  // p[10]: "Fırından Sıcak Çıkanlar: ..."
  // p[11]: "Küçük Bir Ada Tavsiyesi: ..."
  // p[12]: Başlık: "Taşfırınlovemacun’a Nasıl Gidilir?"
  // p[13]: "Büyükada iskelesinde indikten sonra..."
  // p[14]: "Kapanış Değerlendirmesi: ..."
  // p[15]: "Sizin adadaki favori lezzet durağınız neresi? Yorumlarda buluşalım! 👇"

  const featureCards = [
    {
      icon: Flame,
      title: 'Gerçek Taş Fırın Lezzeti',
      text: post.paragraphs[3].replace(/^Gerçek Taş Fırın Lezzeti:\s*/, '')
    },
    {
      icon: Sparkles,
      title: 'Çıtır Çıtır ve İncecik',
      text: post.paragraphs[4].replace(/^Çıtır Çıtır ve İncecik:\s*/, '')
    },
    {
      icon: ShieldCheck,
      title: 'Malzeme Kalitesi',
      text: post.paragraphs[5].replace(/^Malzeme Kalitesi:\s*/, '')
    }
  ]

  return (
    <article className="blog-post-page">
      <PageMeta
        title={`${post.title} | ${CONFIG.name}`}
        description={post.summary}
        canonical={`https://tasfirinlovemacun.com/${post.slug}`}
        jsonLd={articleJsonLd}
      />

      {/* Header'ın alt kenarına yapışık 3px turuncu okuma ilerleme çubuğu */}
      <div className="post-sticky-progress-wrap" aria-hidden="true">
        <div className="post-sticky-progress-bar" ref={progressBarRef} />
      </div>

      <div className="container post-container-wide">
        {/* Üst Navigasyon: ← Blog Geri Butonu */}
        <div className="post-header-nav">
          <Link to="/blog" className="btn-back-blog">
            <ArrowLeft size={16} /> Blog
          </Link>
        </div>

        {/* 1. YAZI KAPAĞI HERO: Tam Genişlik, Koyu Gradient, Fraunces Başlık, Çip, Süre, Paylaş */}
        <div className="post-hero-hero">
          <img
            src={coverSrc}
            alt={post.title}
            className="post-hero-img"
            width="1200"
            height="675"
            loading="eager"
            fetchpriority="high"
          />
          <div className="post-hero-overlay">
            <div className="post-hero-top">
              <span className="post-hero-category">{post.category}</span>
            </div>

            <div className="post-hero-bottom">
              <h1 className="post-hero-title">{post.title}</h1>

              <div className="post-hero-meta-row">
                <div className="post-hero-meta-left">
                  <span className="post-meta-part">
                    <Calendar size={14} /> {post.formattedDate}
                  </span>
                  <span className="post-meta-sep">·</span>
                  <span className="post-meta-part">
                    <User size={14} /> {post.author}
                  </span>
                  <span className="post-meta-sep">·</span>
                  <span className="post-meta-part post-meta-read">
                    <Clock size={14} /> {readMinutes} dk okuma
                  </span>
                </div>

                <button
                  type="button"
                  className={`btn-post-share ${copied ? 'copied' : ''}`}
                  onClick={handleShare}
                  aria-label="Yazıyı Paylaş"
                >
                  {copied ? (
                    <>
                      <Check size={15} /> Kopyalandı!
                    </>
                  ) : (
                    <>
                      <Share2 size={15} /> Paylaş
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. İÇERİK BLOKLARI (Metin Birebir Aynı) */}
        <div className="post-content-wrap">
          {/* Paragraf 0: Lead Paragraf (19-20px, satır yüksekliği 1.6, daha açık renk) */}
          <p className="post-lead-p">{post.paragraphs[0]}</p>

          {/* Paragraf 1: Alıntı Stili (Sol turuncu çizgi, 22px italik Fraunces, metin tekrarlanmaz) */}
          <blockquote className="post-pull-quote">
            {post.paragraphs[1]}
          </blockquote>

          {/* Bölüm 1: Neden Bu Kadar Seviliyor? (Emoji yok, 36px Flame rozeti, 1px turuncu %20 ayırıcı) */}
          <div className="post-section-divider" />
          <div className="post-section-head">
            <span className="post-section-badge">
              <Flame size={18} />
            </span>
            <h2 className="post-section-title">Neden Bu Kadar Seviliyor?</h2>
          </div>

          {/* 3 Kolonlu Kart Grid'i (Gerçek Taş Fırın Lezzeti, Çıtır Çıtır ve İncecik, Malzeme Kalitesi) */}
          <div className="post-feature-grid">
            {featureCards.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.title} className="post-feature-card">
                  <span className="post-feature-icon-wrap">
                    <Icon size={18} />
                  </span>
                  <h3 className="post-feature-card-title">{c.title}</h3>
                  <p className="post-feature-card-body">{c.text}</p>
                </div>
              )
            })}
          </div>

          {/* Bölüm 2: Menüde Neler Var? (Emoji yok, 36px UtensilsCrossed rozeti, 1px turuncu %20 ayırıcı) */}
          <div className="post-section-divider" />
          <div className="post-section-head">
            <span className="post-section-badge">
              <UtensilsCrossed size={18} />
            </span>
            <h2 className="post-section-title">Menüde Neler Var? (Sadece Lahmacun mu?)</h2>
          </div>

          <p className="post-p">{post.paragraphs[7]}</p>
          <p className="post-p">{post.paragraphs[8]}</p>

          <p className="post-p">
            <strong className="post-highlight">Nefis Pideler:</strong>{' '}
            {post.paragraphs[9].replace(/^Nefis Pideler:\s*/, '')}
          </p>

          <p className="post-p">
            <strong className="post-highlight">Fırından Sıcak Çıkanlar:</strong>{' '}
            {post.paragraphs[10].replace(/^Fırından Sıcak Çıkanlar:\s*/, '')}
          </p>

          {/* Menü Verisinden 4 Gerçek Ürünlük Kompakt Kart Şeridi */}
          <div className="post-menu-strip-wrap">
            <div className="post-menu-strip-header">
              <span className="post-menu-strip-kicker">✦ TAŞ FIRINDAN SOFRAYA</span>
              <h3 className="post-menu-strip-title">Menüden öne çıkanlar</h3>
            </div>
            <div className="post-menu-strip-scroll">
              {FEATURED_MENU_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  to={`/#${item.catId}`}
                  className="post-menu-card notranslate"
                  translate="no"
                >
                  <div className="post-menu-card-img-wrap">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="post-menu-card-img"
                      loading="lazy"
                    />
                  </div>
                  <div className="post-menu-card-info">
                    <span className="post-menu-card-name">{item.name}</span>
                    <span className="post-menu-card-price">{item.price} ₺</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* İsteğe Bağlı Fotoğraf Galerisi (varsa 3'lü 16:10 grid, yoksa render edilmez) */}
          {galleryImages && (
            <div className="post-gallery-grid">
              {galleryImages.map((src, i) => (
                <div key={i} className="post-gallery-item">
                  <img
                    src={src}
                    alt={`Büyükada Taş Fırın Lovemacun lezzet karesi ${i + 1}`}
                    className="post-gallery-img"
                    loading="lazy"
                    width="1200"
                    height="750"
                  />
                </div>
              ))}
            </div>
          )}

          {/* İpucu Kutusu: Küçük Bir Ada Tavsiyesi (İnce turuncu border, hafif turuncu zemin, lamba ikonu) */}
          <div className="post-tip-box">
            <div className="post-tip-icon-wrap">
              <Lightbulb size={22} className="post-tip-icon" />
            </div>
            <div className="post-tip-content">
              <h3 className="post-tip-title">Küçük Bir Ada Tavsiyesi</h3>
              <p className="post-tip-text">
                {post.paragraphs[11].replace(/^Küçük Bir Ada Tavsiyesi:\s*/, '')}
              </p>
            </div>
          </div>

          {/* Bölüm 3: Taşfırınlovemacun’a Nasıl Gidilir? (Emoji yok, 36px MapPin rozeti, 1px turuncu %20 ayırıcı) */}
          <div className="post-section-divider" />
          <div className="post-section-head">
            <span className="post-section-badge">
              <MapPin size={18} />
            </span>
            <h2 className="post-section-title">Taşfırınlovemacun’a Nasıl Gidilir?</h2>
          </div>

          <p className="post-p">{post.paragraphs[13]}</p>

          {/* Konum Kartı (Adres, saat, Yol Tarifi Al, Ara butonları - süre/mesafe içermez) */}
          <div className="post-location-card">
            <div className="post-location-info">
              <div className="post-location-row">
                <MapPin size={17} className="post-location-icon" />
                <span className="post-location-text notranslate" translate="no">
                  {CONFIG.address}
                </span>
              </div>
              <div className="post-location-row">
                <Clock size={17} className="post-location-icon" />
                <span className="post-location-text">
                  Her gün {CONFIG.hours}
                </span>
              </div>
            </div>
            <div className="post-location-btns">
              <a
                href={CONFIG.mapsDirectionsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-loc-route"
              >
                <MapPin size={16} /> Yol Tarifi Al
              </a>
              <a
                href={`tel:${CONFIG.phonePrimary.tel}`}
                className="btn btn-loc-phone notranslate"
                translate="no"
              >
                <Phone size={16} /> Ara ({CONFIG.phonePrimary.display})
              </a>
            </div>
          </div>

          {/* Kapanış Paragrafları */}
          <p className="post-p">
            <strong className="post-highlight">Kapanış Değerlendirmesi:</strong>{' '}
            {post.paragraphs[14].replace(/^Kapanış Değerlendirmesi:\s*/, '')}
          </p>

          <p className="post-p post-outro-call">{post.paragraphs[15]}</p>

          {/* Kapanış Lezzet Molası Kartı */}
          <div className="post-actions-card">
            <div className="post-actions-head">
              <span className="actions-kicker">🍕 TAŞ FIRIN LOVEMACUN</span>
              <h3 className="actions-title">Büyükada’da Sıcak Bir Lezzet Molası</h3>
              <p className="actions-sub">
                Geleneksel taş fırınımızda pişen çıtır lezzetlerimizi yerinde tatmak için sizleri soframıza bekliyoruz.
              </p>
            </div>
            <div className="post-actions-btns">
              <Link to="/" className="btn btn-post-menu">
                <UtensilsCrossed size={17} /> Menüyü Gör
              </Link>
              <a
                href={CONFIG.mapsDirectionsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-post-route"
              >
                <MapPin size={17} /> Yol Tarifi Al
              </a>
            </div>
          </div>

          {/* Instagram Takip Bandı: İkon + Handle + Takip Et butonu */}
          <div className="post-insta-strip">
            <div className="post-insta-strip-left">
              <span className="post-insta-strip-icon-wrap">
                <InstagramIcon size={20} />
              </span>
              <div className="post-insta-strip-text">
                <span className="post-insta-strip-handle">@tasfirinlovemacun</span>
                <span className="post-insta-strip-sub">Büyükada'dan en taze lezzet anları</span>
              </div>
            </div>
            <a
              href={CONFIG.instagram}
              target="_blank"
              rel="noreferrer"
              className="btn btn-insta-follow"
              aria-label="Instagram sayfamızı takip edin"
            >
              Takip Et <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
