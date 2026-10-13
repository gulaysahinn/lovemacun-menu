import { Link } from 'react-router-dom'
import { Calendar, User, ArrowRight, Clock } from 'lucide-react'
import { PageMeta } from '../components/PageMeta.jsx'
import { BLOG_POSTS } from '../data/blog.js'
import { CONFIG } from '../config.js'
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

export function BlogListPage() {
  const post = BLOG_POSTS[0]
  const wordCount = post.paragraphs.join(' ').trim().split(/\s+/).length
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="blog-page">
      <PageMeta
        title="Blog & Ada Lezzetleri | Taş Fırın Lovemacun Büyükada"
        description="Büyükada'da taş fırın lezzetleri, lahmacun ve ada kültürüne dair yazılarımız ve lezzet rehberimiz."
        canonical="https://tasfirinlovemacun.com/blog"
      />

      <div className="container">
        {/* Başlık Alanı (Hafif turuncu radial gradient arka plan, üst padding: header + 40px) */}
        <header className="blog-header blog-header-radial">
          <span className="blog-kicker">🏝️ BÜYÜKADA GÜNLÜĞÜ</span>
          <h1 className="blog-title">Ada Lezzetleri & Hikayeler</h1>
          <p className="blog-sub">
            Büyükada’nın nostaljik sokaklarından taş fırınımızın sıcacık lezzetlerine uzanan ada notları.
          </p>
        </header>

        {/* Tek Yazı Kartı (Öne çıkan etiketi ve okuma süresi ile) */}
        <div className="blog-grid blog-grid-single">
          <article className="blog-card blog-card-featured">
            <Link to={`/${post.slug}`} className="blog-card-media-link" tabIndex={-1}>
              <div className="blog-card-media">
                <picture>
                  <source srcSet={asset('/blog/WhatsApp-Image-2026-06-08-at-16.16.22.webp')} type="image/webp" />
                  <img
                    src={asset(post.image)}
                    alt={post.title}
                    className="blog-card-img"
                    width="1200"
                    height="675"
                    loading="lazy"
                  />
                </picture>
                <div className="blog-card-badges-row">
                  <span className="blog-card-badge-feat">✦ Öne Çıkan</span>
                  <span className="blog-card-cat">{post.category}</span>
                </div>
              </div>
            </Link>

            <div className="blog-card-body">
              <div className="blog-card-meta">
                <span className="blog-meta-item">
                  <Calendar size={13} /> {post.formattedDate}
                </span>
                <span className="blog-meta-sep">·</span>
                <span className="blog-meta-item">
                  <User size={13} /> {post.author}
                </span>
                <span className="blog-meta-sep">·</span>
                <span className="blog-meta-item blog-meta-time">
                  <Clock size={13} /> {readMinutes} dk okuma
                </span>
              </div>

              <h2 className="blog-card-title">
                <Link to={`/${post.slug}`}>{post.title}</Link>
              </h2>

              <p className="blog-card-summary">{post.summary}</p>

              <div className="blog-card-footer">
                <Link to={`/${post.slug}`} className="btn-blog-read">
                  Devamını Oku <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </article>
        </div>

        {/* Sayfa Altı: Instagram Takip Bandı ve Menüyü İncele Butonu */}
        <div className="blog-page-bottom-bar">
          <div className="blog-insta-banner">
            <div className="blog-insta-left">
              <span className="blog-insta-icon-wrap">
                <InstagramIcon size={20} />
              </span>
              <div className="blog-insta-info">
                <span className="blog-insta-handle">@tasfirinlovemacun</span>
                <span className="blog-insta-sub">Büyükada lezzet günlüğü Instagram'da</span>
              </div>
            </div>
            <a
              href={CONFIG.instagram}
              target="_blank"
              rel="noreferrer"
              className="btn btn-blog-insta"
            >
              Takip Et <ArrowRight size={13} />
            </a>
          </div>

          <div className="blog-bottom-menu-cta">
            <Link to="/" className="btn btn-blog-menu-cta">
              Menüyü İncele <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
