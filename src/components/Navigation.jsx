import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Menu, X, Heart, UtensilsCrossed, Sparkles, ChevronRight, Phone, Clock } from 'lucide-react'
import { CONFIG } from '../config.js'

export function TopBar({ onOpenSearch, onOpenList, favCount = 0 }) {
  const location = useLocation()
  const pathname = location.pathname
  const [navScrolled, setNavScrolled] = useState(false)
  const [navMenuOpen, setNavMenuOpen] = useState(false)
  const hamburgerButtonRef = useRef(null)

  // Scroll detection for header style
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setNavScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (navMenuOpen) {
      const sy = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${sy}px`
      document.body.style.width = '100%'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, sy)
        hamburgerButtonRef.current?.focus()
      }
    }
  }, [navMenuOpen])

  // Close drawer on route change
  useEffect(() => {
    setNavMenuOpen(false)
  }, [pathname])

  const isMenu = pathname === '/'
  const isStory = pathname === '/hikayemiz'
  const isContact = pathname === '/iletisim'

  const NAV_ITEMS = [
    {
      path: '/',
      label: 'Menü',
      sub: 'Taş fırın lahmacun, pide ve kebaplar',
      icon: UtensilsCrossed,
      active: isMenu,
    },
    {
      path: '/hikayemiz',
      label: 'Hikayemiz',
      sub: 'Büyükada\'da odun ateşi ve ustalık',
      icon: Sparkles,
      active: isStory,
    },
    {
      path: '/iletisim',
      label: 'İletişim & Konum',
      sub: 'Nizam Mahallesi, harita ve yol tarifi',
      icon: MapPin,
      active: isContact,
    },
  ]

  return (
    <>
      <header className={`top-bar ${navScrolled ? 'scrolled' : ''}`}>
        <div className="container top-bar-inner">
          <Link to="/" className="top-bar-brand" onClick={() => setNavMenuOpen(false)}>
            <img src="/logo-badge.png" alt="Taş Fırın Lovemacun Logosu" className="brand-logo" width="46" height="46" />
            <span className="brand-name">{CONFIG.name}</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="top-bar-links desktop-only" aria-label="Ana Gezinti">
            <Link to="/" className={isMenu ? 'active' : ''}>Menü</Link>
            <span className="top-bar-sep">·</span>
            <Link to="/hikayemiz" className={isStory ? 'active' : ''}>Hikayemiz</Link>
            <span className="top-bar-sep">·</span>
            <Link to="/iletisim" className={isContact ? 'active' : ''}>İletişim</Link>
          </nav>

          {/* Desktop Quick Info & Action Buttons */}
          <div className="top-bar-actions desktop-only">
            <span className="top-bar-hours">Her gün {CONFIG.hours}</span>
            <button
              type="button"
              className="btn btn-top-search"
              onClick={onOpenSearch}
              aria-label="Menüde ara"
            >
              <Search size={15} /> Ara
            </button>
            <a
              className="btn btn-top-route"
              href={CONFIG.mapsDirectionsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={15} /> Yol Tarifi
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            ref={hamburgerButtonRef}
            className="top-bar-hamburger mobile-only"
            onClick={() => setNavMenuOpen((prev) => !prev)}
            aria-label={navMenuOpen ? 'Menüyü Kapat' : 'Menüyü Aç'}
            aria-expanded={navMenuOpen}
          >
            <span className={`hamburger-box ${navMenuOpen ? 'open' : ''}`} aria-hidden="true">
              <span className="hamburger-line line-1" />
              <span className="hamburger-line line-2" />
              <span className="hamburger-line line-3" />
            </span>
          </button>
        </div>

        {/* Mobile Full Screen Drawer Menu */}
        <AnimatePresence>
          {navMenuOpen && (
            <motion.div
              className="mobile-nav-overlay mobile-only"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setNavMenuOpen(false)}
            >
              <motion.div
                className="mobile-nav-panel"
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mobile-nav-brand">
                  <img src="/logo-badge.png" alt="Taş Fırın Lovemacun" className="mobile-nav-logo" width="48" height="48" />
                  <div className="mobile-nav-title">
                    <span className="mobile-nav-name">{CONFIG.name}</span>
                    <span className="mobile-nav-tagline">BÜYÜKADA · TAŞ FIRIN & KEBAP</span>
                  </div>
                </div>

                <div className="mobile-nav-links">
                  {NAV_ITEMS.map((item, idx) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 + idx * 0.05, duration: 0.2 }}
                    >
                      <Link
                        to={item.path}
                        className={`mobile-nav-card ${item.active ? 'active' : ''}`}
                        onClick={() => setNavMenuOpen(false)}
                      >
                        <div className="mobile-nav-card-icon">
                          <item.icon size={20} />
                        </div>
                        <div className="mobile-nav-card-text">
                          <span className="mobile-nav-card-label">{item.label}</span>
                          <span className="mobile-nav-card-sub">{item.sub}</span>
                        </div>
                        <div className="mobile-nav-card-arrow">
                          {item.active && <span className="mobile-nav-badge">Aktif</span>}
                          <ChevronRight size={17} />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="mobile-nav-bottom">
                  <div className="mobile-nav-btns">
                    <button
                      type="button"
                      className="btn btn-nav-search"
                      onClick={() => {
                        setNavMenuOpen(false)
                        onOpenSearch?.()
                      }}
                    >
                      <Search size={16} /> Menüde Ara
                    </button>
                    <a
                      className="btn btn-nav-route"
                      href={CONFIG.mapsDirectionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setNavMenuOpen(false)}
                    >
                      <MapPin size={16} /> Yol Tarifi
                    </a>
                  </div>

                  <div className="mobile-nav-meta">
                    <span className="mobile-nav-hours">Her gün {CONFIG.hours}</span>
                    <a href={'tel:' + CONFIG.phonePrimary.tel} className="mobile-nav-phone" style={{ color: '#f5a623', textDecoration: 'none' }}>
                      📞 {CONFIG.phonePrimary.display}
                    </a>
                    <a href={CONFIG.instagram} target="_blank" rel="noreferrer" className="mobile-nav-insta">
                      📷 Instagram
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}

export function MobileDock({ onOpenSearch, onOpenList, favCount = 0 }) {
  const location = useLocation()
  const isMenu = location.pathname === '/'

  return (
    <div className="dock" role="navigation" aria-label="Hızlı Erişim">
      <button
        type="button"
        className="dock-item"
        onClick={onOpenSearch}
        aria-label="Menüde Ara"
      >
        <Search size={20} className="dock-icon" />
        <span className="dock-label">Ara</span>
      </button>

      <a
        href={CONFIG.mapsDirectionsUrl}
        target="_blank"
        rel="noreferrer"
        className="dock-item"
        aria-label="Yol Tarifi"
      >
        <MapPin size={20} className="dock-icon" />
        <span className="dock-label">Yol Tarifi</span>
      </a>

      <Link
        to="/"
        className={`dock-item ${isMenu ? 'active' : ''}`}
        aria-label="Menü"
        onClick={() => {
          if (isMenu) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }}
      >
        <UtensilsCrossed size={20} className="dock-icon" />
        <span className="dock-label">Menü</span>
        {isMenu && <span className="dock-active-dot" aria-hidden="true" />}
      </Link>

      <button
        type="button"
        className="dock-item"
        onClick={onOpenList}
        aria-label="Listem"
      >
        <Heart size={20} className="dock-icon" fill={favCount > 0 ? '#ff5722' : 'none'} color={favCount > 0 ? '#ff5722' : 'currentColor'} />
        <span className="dock-label">Listem</span>
        {favCount > 0 && <span className="dock-badge">{favCount}</span>}
      </button>
    </div>
  )
}
