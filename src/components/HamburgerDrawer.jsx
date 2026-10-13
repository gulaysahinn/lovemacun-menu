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
  ChevronDown,
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

const FLAG_EMOJIS = {
  tr: '🇹🇷',
  en: '🇬🇧',
  ar: '🇸🇦',
  ru: '🇷🇺',
  de: '🇩🇪',
  fr: '🇫🇷',
  fa: '🇮🇷',
  es: '🇪🇸',
  'zh-CN': '🇨🇳',
  nl: '🇳🇱',
}

export function HamburgerDrawer({ isOpen, onClose, onOpenSearch }) {
  const location = useLocation()
  const pathname = location.pathname
  const closeBtnRef = useRef(null)
  const currentLang = getInitialLang()
  const lang = useLang()
  const [isClosing, setIsClosing] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)

  // Body scroll lock
  useEffect(() => {
    setIsClosing(false)
    setIsLangOpen(false)
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
      sub: t('subMenu', lang),
      icon: UtensilsCrossed,
      active: isMenu
    },
    {
      to: '/hikayemiz',
      label: t('story', lang),
      sub: t('subStory', lang),
      icon: Sparkles,
      active: isStory
    },
    {
      to: '/blog',
      label: t('blog', lang),
      sub: t('subBlog', lang),
      icon: BookOpen,
      active: isBlog
    },
    {
      to: '/rezervasyon',
      label: t('reservation', lang),
      sub: t('subReservation', lang),
      icon: Calendar,
      active: isReservation
    },
    {
      to: '/iletisim',
      label: t('contact', lang),
      sub: t('subContact', lang),
      icon: MapPin,
      active: isContact
    }
  ]

  const activeLangObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0]

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

        {/* Kaydırılabilir İçerik Alanı */}
        <div className="hbg-drawer-body">
          {/* 2. Menü Bağlantıları (Aktif satır rozet yerine sadece turuncu vurgu) */}
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
                    <ChevronRight size={18} className="hbg-nav-arrow" />
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* 3. Kompakt Tek Satır Dil Seçici */}
          <div className="hbg-section hbg-lang-compact-section notranslate" translate="no">
            <button
              type="button"
              className="hbg-lang-row-btn"
              onClick={() => setIsLangOpen(!isLangOpen)}
              onMouseEnter={loadGoogleTranslateScript}
              onTouchStart={loadGoogleTranslateScript}
              aria-expanded={isLangOpen}
            >
              <div className="hbg-lang-row-left">
                <span className="hbg-lang-globe-icon">🌐</span>
                <span className="hbg-lang-row-label">
                  Dil / Language · {activeLangObj.short} {FLAG_EMOJIS[activeLangObj.code] || '🇹🇷'}
                </span>
              </div>
              <ChevronDown size={17} className={`hbg-lang-chevron ${isLangOpen ? 'open' : ''}`} />
            </button>

            {isLangOpen && (
              <div className="hbg-lang-dropdown-list">
                {LANGUAGES.map((l) => {
                  const isSelected = l.code === currentLang
                  return (
                    <button
                      key={l.code}
                      type="button"
                      className={`hbg-lang-drop-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setIsLangOpen(false)
                        onClose()
                        applyLanguage(l.code)
                      }}
                      aria-label={l.name}
                    >
                      <img src={asset(l.flag)} alt="" className="hbg-lang-drop-flag" width="20" height="15" />
                      <span className="hbg-lang-drop-name">{l.name} ({l.short})</span>
                      {isSelected && <Check size={14} className="hbg-lang-check" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 4. Telefon Numaraları ve Instagram */}
          <div className="hbg-section hbg-contacts">
            <span className="hbg-section-title">Sipariş & İletişim</span>
            <div className="hbg-contact-links">
              <a
                href={`tel:${CONFIG.phonePrimary.tel}`}
                className="hbg-contact-row notranslate"
                translate="no"
              >
                <span className="hbg-contact-icon">
                  <Phone size={15} />
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
                  <Phone size={15} />
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
                  <InstagramIcon size={15} />
                </span>
                <span className="hbg-contact-label">@tasfirinlovemacunn</span>
                <span className="hbg-contact-badge">Instagram</span>
              </a>
            </div>
          </div>

          {/* 5. En Altta Çalışma Saati */}
          <div className="hbg-drawer-footer">
            <Clock size={14} className="hbg-footer-icon" />
            <span>Her gün {CONFIG.hours}</span>
          </div>
        </div>

        {/* 6. Çekmecenin Altına Yapışık (Sticky) Aksiyon Çubuğu */}
        <div className="hbg-drawer-sticky-bar">
          <button
            type="button"
            className="btn btn-hbg-search"
            onClick={() => {
              onClose()
              onOpenSearch?.()
            }}
            aria-label="Menüde Ara"
          >
            <Search size={16} /> Menüde Ara
          </button>
          <a
            href={CONFIG.mapsDirectionsUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-hbg-route"
            onClick={onClose}
            aria-label="Haritada Yol Tarifi Al"
          >
            <MapPin size={16} /> Yol Tarifi Al
          </a>
        </div>
      </div>
    </div>,
    document.body
  )
}
