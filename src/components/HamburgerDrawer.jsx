import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import {
  X,
  UtensilsCrossed,
  Sparkles,
  BookOpen,
  MapPin,
  Search,
  ChevronRight,
  Phone,
  Clock,
  Check,
  Calendar
} from 'lucide-react'
import { CONFIG } from '../config.js'
import { LANGUAGES, getInitialLang, applyLanguage, loadGoogleTranslateScript } from './LanguageSwitcher.jsx'
import { asset } from '../utils/asset.js'
import { useLang, t } from '../utils/i18n.js'

function InstagramIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export function HamburgerDrawer({ isOpen, onClose, onOpenSearch }) {
  const location = useLocation()
  const pathname = location.pathname
  const closeBtnRef = useRef(null)
  const currentLang = getInitialLang()
  const lang = useLang()
  const [isClosing, setIsClosing] = useState(false)

  // Body scroll lock
  useEffect(() => {
    setIsClosing(false)
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      closeBtnRef.current?.focus()
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  const handleClose = () => {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const isMenu = pathname === '/'
  const isStory = pathname === '/hikayemiz' || pathname === '/hakkimizda'
  const isContact = pathname === '/iletisim'
  const isBlog = pathname.startsWith('/blog') || pathname.includes('buyukadada-ezber-bozan')
  const isReservation = pathname === '/rezervasyon'

  const NAV_LINKS = [
    {
      to: '/',
      label: t('menu', lang),
      sub: lang === 'en' ? 'Stone oven lahmacun, pide & kebabs' : 'Taş fırın lahmacun, pide ve kebaplar',
      icon: UtensilsCrossed,
      active: isMenu
    },
    {
      to: '/hikayemiz',
      label: t('story', lang),
      sub: lang === 'en' ? 'Stone oven mastery in Buyukada' : "Büyükada'da taş fırın ustalığı",
      icon: Sparkles,
      active: isStory
    },
    {
      to: '/blog',
      label: t('blog', lang),
      sub: lang === 'en' ? 'Island flavors & stories' : 'Ada lezzetleri & hikayeler',
      icon: BookOpen,
      active: isBlog
    },
    {
      to: '/rezervasyon',
      label: t('reservation', lang),
      sub: lang === 'en' ? 'Table reservation & call us' : 'Masa rezervasyonu ve telefon hattı',
      icon: Calendar,
      active: isReservation
    },
    {
      to: '/iletisim',
      label: t('contact', lang),
      sub: lang === 'en' ? 'Nizam, map & address' : 'Nizam Mahallesi, harita ve adres',
      icon: MapPin,
      active: isContact
    }
  ]

  if (typeof document === 'undefined' || (!isOpen && !isClosing)) return null

  return createPortal(
    <div
      className={`hbg-drawer-root ${isClosing ? 'is-closing' : 'is-open'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Navigasyon Menüsü"
    >
      {/* Karartılmış Arka Plan (Backdrop) */}
      <div
        className="hbg-drawer-backdrop"
        onClick={handleClose}
      />

      {/* Sağdan Kayan Koyu Çekmece */}
      <div className="hbg-drawer-panel">
            {/* 1. Üst Kısım: Logo ve Kapat (X) Butonu */}
            <div className="hbg-drawer-head">
              <Link to="/" className="hbg-drawer-brand notranslate" translate="no" onClick={onClose}>
                <img
                  src={asset('/logo-badge.png')}
                  alt="Taş Fırın Lovemacun Logosu"
                  className="hbg-drawer-logo"
                  width="38"
                  height="38"
                />
                <div className="hbg-drawer-brand-text">
                  <span className="hbg-drawer-name">{CONFIG.name}</span>
                  <span className="hbg-drawer-tagline">BÜYÜKADA · TAŞ FIRIN</span>
                </div>
              </Link>
              <button
                type="button"
                ref={closeBtnRef}
                className="hbg-drawer-close-btn"
                onClick={onClose}
                aria-label="Menüyü Kapat"
              >
                <X size={22} />
              </button>
            </div>

            <div className="hbg-drawer-body">
              {/* 2. Büyük 52px Dokunma Alanlı Bağlantılar */}
              <nav className="hbg-drawer-nav" aria-label="Mobil Ana Menü">
                {NAV_LINKS.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`hbg-nav-item notranslate ${item.active ? 'active' : ''}`}
                      translate="no"
                      onClick={onClose}
                    >
                      <div className="hbg-nav-item-left">
                        <span className="hbg-nav-icon-wrap">
                          <Icon size={20} />
                        </span>
                        <div className="hbg-nav-text">
                          <span className="hbg-nav-label">{item.label}</span>
                          <span className="hbg-nav-sub">{item.sub}</span>
                        </div>
                      </div>
                      <div className="hbg-nav-item-right">
                        {item.active && <span className="hbg-nav-active-pill">Aktif</span>}
                        <ChevronRight size={18} className="hbg-nav-arrow" />
                      </div>
                    </Link>
                  )
                })}
              </nav>

              {/* 3. Dil Seçici Satırı (Bayraklı seçenekler) */}
              <div className="hbg-section hbg-lang-section notranslate" translate="no">
                <span className="hbg-section-title">Dil / Language</span>
                <div className="hbg-lang-grid">
                  {LANGUAGES.map((lang) => {
                    const isSelected = lang.code === currentLang
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        className={`hbg-lang-pill ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          onClose()
                          applyLanguage(lang.code)
                        }}
                        onMouseEnter={loadGoogleTranslateScript}
                        onTouchStart={loadGoogleTranslateScript}
                        aria-label={lang.name}
                      >
                        <img src={asset(lang.flag)} alt="" className="hbg-lang-flag" width="20" height="15" />
                        <span className="hbg-lang-code">{lang.short}</span>
                        {isSelected && <Check size={13} className="hbg-lang-check" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 4. "Ara" ve "Yol Tarifi" Butonları */}
              <div className="hbg-section hbg-action-btns">
                <button
                  type="button"
                  className="btn btn-hbg-search"
                  onClick={() => {
                    onClose()
                    onOpenSearch?.()
                  }}
                  aria-label="Menüde Ara"
                >
                  <Search size={17} /> Menüde Ara
                </button>
                <a
                  href={CONFIG.mapsDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-hbg-route"
                  onClick={onClose}
                  aria-label="Haritada Yol Tarifi Al"
                >
                  <MapPin size={17} /> Yol Tarifi Al
                </a>
              </div>

              {/* 5. Telefon Numaraları ve Instagram */}
              <div className="hbg-section hbg-contacts">
                <span className="hbg-section-title">Sipariş & İletişim</span>
                <div className="hbg-contact-links">
                  <a
                    href={`tel:${CONFIG.phonePrimary.tel}`}
                    className="hbg-contact-row notranslate"
                    translate="no"
                  >
                    <span className="hbg-contact-icon">
                      <Phone size={16} />
                    </span>
                    <span className="hbg-contact-label">{CONFIG.phonePrimary.display}</span>
                    <span className="hbg-contact-badge">Hemen Ara</span>
                  </a>
                  <a
                    href={`tel:${CONFIG.phoneSecondary.tel}`}
                    className="hbg-contact-row notranslate"
                    translate="no"
                  >
                    <span className="hbg-contact-icon">
                      <Phone size={16} />
                    </span>
                    <span className="hbg-contact-label">{CONFIG.phoneSecondary.display}</span>
                    <span className="hbg-contact-badge">Sabit Hat</span>
                  </a>
                  <a
                    href={CONFIG.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="hbg-contact-row hbg-insta-row"
                  >
                    <span className="hbg-contact-icon">
                      <InstagramIcon size={16} />
                    </span>
                    <span className="hbg-contact-label">@tasfirinlovemacun</span>
                    <span className="hbg-contact-badge">Instagram</span>
                  </a>
                </div>
              </div>

              {/* 6. En Altta Çalışma Saati */}
              <div className="hbg-drawer-footer">
                <Clock size={15} className="hbg-footer-icon" />
                <span>Her gün {CONFIG.hours}</span>
              </div>
            </div>
          </div>
        </div>,
    document.body
  )
}
