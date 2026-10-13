import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Menu, X, UtensilsCrossed, Sparkles, ChevronRight, Phone, Clock, BookOpen } from 'lucide-react'
import { CONFIG } from '../config.js'
import { LanguageSwitcher } from './LanguageSwitcher.jsx'

import { asset } from '../utils/asset.js'

export function TopBar({ onOpenSearch, onOpenHamburger, isHamburgerOpen }) {
  const location = useLocation()
  const pathname = location.pathname
  const [navScrolled, setNavScrolled] = useState(false)

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

  const isMenu = pathname === '/'
  const isStory = pathname === '/hikayemiz' || pathname === '/hakkimizda'
  const isContact = pathname === '/iletisim'
  const isBlog = pathname.startsWith('/blog') || pathname.includes('buyukadada-ezber-bozan')

  return (
    <>
      <header className={`top-bar ${navScrolled ? 'scrolled' : ''}`}>
        <div className="container top-bar-inner">
          <Link to="/" className="top-bar-brand notranslate" translate="no">
            <img src={asset('/logo-badge.png')} alt="Taş Fırın Lovemacun Logosu" className="brand-logo" width="46" height="46" />
            <span className="brand-name">{CONFIG.name}</span>
          </Link>

          {/* Desktop Navigation Links (≥ 1280px) */}
          <nav className="top-bar-links desktop-only" aria-label="Ana Gezinti">
            <Link to="/" className={isMenu ? 'active' : ''}>Menü</Link>
            <span className="top-bar-sep">·</span>
            <Link to="/hikayemiz" className={isStory ? 'active' : ''}>Hikayemiz</Link>
            <span className="top-bar-sep">·</span>
            <Link to="/blog" className={isBlog ? 'active' : ''}>Blog</Link>
            <span className="top-bar-sep">·</span>
            <Link to="/iletisim" className={isContact ? 'active' : ''}>İletişim</Link>
          </nav>

          {/* Desktop Quick Info & Action Buttons (≥ 1280px) */}
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
            <LanguageSwitcher align="right" />
          </div>

          {/* Tablet (768px - 1279px) Hamburger Button */}
          <button
            type="button"
            className="top-bar-tablet-hamburger"
            onClick={onOpenHamburger}
            aria-label="Menüyü aç"
            aria-expanded={Boolean(isHamburgerOpen)}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>
    </>
  )
}

export function MobileDock({ onOpenSearch }) {
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
    </div>
  )
}
