import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  X,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Copy,
  Check,
  BookOpen
} from 'lucide-react'
import { CONFIG } from '../config.js'
import { asset } from '../utils/asset.js'
import { useLang, t } from '../utils/i18n.js'

function InstagramIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function getIstanbulStatus(lang = 'tr') {
  try {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Istanbul',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23'
    }).formatToParts(now)

    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10)
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10)
    const currentMins = hour * 60 + minute

    // 08:30 - 23:00 (510 - 1380 mins)
    const isOpen = currentMins >= 510 && currentMins < 1380

    if (isOpen) {
      return {
        isOpen: true,
        text: lang === 'en' ? 'Open now · until 23:00' : 'Şu an açık · 23:00\'e kadar',
      }
    } else {
      return {
        isOpen: false,
        text: lang === 'en' ? 'Closed now · opens at 08:30' : 'Şu an kapalı · 08:30\'da açılır',
      }
    }
  } catch {
    return {
      isOpen: true,
      text: lang === 'en' ? 'Every day 08:30–23:00' : 'Her gün 08:30–23:00',
    }
  }
}

export function InfoDrawer({ isOpen, onClose }) {
  const [isClosing, setIsClosing] = useState(false)
  const [copied, setCopied] = useState(false)
  const lang = useLang()
  const status = getIstanbulStatus(lang)

  // Body scroll lock
  useEffect(() => {
    setIsClosing(false)
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
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
    }, 220)
  }

  // ESC key and Android back button simulation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Android back button popstate
  useEffect(() => {
    if (!isOpen) return
    window.history.pushState({ infoDrawerOpen: true }, '')
    const handlePopState = () => {
      onClose()
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen])

  const handleCopyAddress = (e) => {
    e.stopPropagation()
    try {
      navigator.clipboard.writeText(CONFIG.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (typeof document === 'undefined' || (!isOpen && !isClosing)) return null

  return createPortal(
    <div
      className={`info-bs-root notranslate ${isClosing ? 'is-closing' : 'is-open'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Restoran Bilgileri"
      translate="no"
    >
      {/* Backdrop (Karanlık zemin) */}
      <div className="info-bs-backdrop" onClick={handleClose} />

      {/* Alttan Açılan Bottom Sheet Kartı */}
      <div className="info-bs-sheet">
        {/* Sürükleme Tutacağı */}
        <div className="info-bs-drag-bar" onClick={handleClose}>
          <div className="info-bs-drag-handle" />
        </div>

        {/* 1. Üst Kısım: Logo, Marka Adı ve 44x44 Kapat (X) Butonu */}
        <div className="info-bs-head">
          <div className="info-bs-brand">
            <img
              src={asset('/logo-badge.png')}
              alt="Taş Fırın Lovemacun Logosu"
              className="info-bs-logo"
              width="40"
              height="40"
            />
            <div className="info-bs-brand-text">
              <h2 className="info-bs-name">{CONFIG.name}</h2>
              <span className="info-bs-sub">Büyükada · Taş Fırın Ustalığı</span>
            </div>
          </div>
          <button
            type="button"
            className="info-bs-close-btn"
            onClick={handleClose}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <div className="info-bs-scroll-body">
          {/* 2. Açık/Kapalı Durumu Çipi (Europe/Istanbul Saati) */}
          <div className="info-bs-status-wrap">
            <div className={`info-bs-status-chip ${status.isOpen ? 'status-open' : 'status-closed'}`}>
              <span className="status-dot" aria-hidden="true" />
              <span className="status-text">{status.text}</span>
            </div>
          </div>

          {/* 3. 2x2 Hızlı İşlem Düğmeleri (En az 64px yükseklik) */}
          <div className="info-bs-quick-grid">
            {/* a) Ara */}
            <a
              href={`tel:${CONFIG.phonePrimary.tel}`}
              className="info-bs-tile tile-call"
              aria-label={`${t('callNow', lang)}: ${CONFIG.phonePrimary.display}`}
            >
              <div className="tile-icon-box">
                <Phone size={22} />
              </div>
              <span className="tile-title">{t('callNow', lang)}</span>
            </a>

            {/* b) Yol Tarifi */}
            <a
              href={CONFIG.mapsDirectionsUrl}
              target="_blank"
              rel="noreferrer"
              className="info-bs-tile tile-route"
              aria-label={t('directions', lang)}
            >
              <div className="tile-icon-box">
                <MapPin size={22} />
              </div>
              <span className="tile-title">{t('directions', lang)}</span>
            </a>

            {/* c) Rezervasyon */}
            <Link
              to="/rezervasyon"
              onClick={handleClose}
              className="info-bs-tile tile-res"
              aria-label={t('reservation', lang)}
            >
              <div className="tile-icon-box">
                <Calendar size={22} />
              </div>
              <span className="tile-title">{t('reservation', lang)}</span>
            </Link>

            {/* d) Instagram */}
            <a
              href={CONFIG.instagram}
              target="_blank"
              rel="noreferrer"
              className="info-bs-tile tile-insta"
              aria-label="Instagram"
            >
              <div className="tile-icon-box">
                <InstagramIcon size={22} />
              </div>
              <span className="tile-title">Instagram</span>
            </a>
          </div>

          {/* 4. Bilgi Kartları */}
          <div className="info-bs-details">
            {/* a) Çalışma Saatleri */}
            <div className="info-bs-card">
              <div className="card-ico-col">
                <Clock size={18} className="card-ico" />
              </div>
              <div className="card-content-col">
                <span className="card-label">{t('hours', lang)}</span>
                <span className="card-val">{t('hoursEveryday', lang)}</span>
              </div>
            </div>

            {/* b) Adres (Haritada açılır + Kopyala butonu) */}
            <div className="info-bs-card card-address-row">
              <div className="card-ico-col">
                <MapPin size={18} className="card-ico" />
              </div>
              <a
                href={CONFIG.mapsDirectionsUrl}
                target="_blank"
                rel="noreferrer"
                className="card-content-col card-link-val"
                title={lang === 'en' ? 'Open in Google Maps' : 'Google Haritalar\'da Aç'}
              >
                <span className="card-label">{t('address', lang)}</span>
                <span className="card-val">{CONFIG.address}</span>
              </a>
              <button
                type="button"
                className={`card-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyAddress}
                aria-label={t('copyAddress', lang)}
                title={t('copyAddress', lang)}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span className="copy-tooltip">{copied ? t('copied', lang) : t('copyAddress', lang)}</span>
              </button>
            </div>

            {/* c) Telefon (İki numara ayrı ayrı tıklanabilir) */}
            <div className="info-bs-card">
              <div className="card-ico-col">
                <Phone size={18} className="card-ico" />
              </div>
              <div className="card-content-col">
                <span className="card-label">{t('phone', lang)}</span>
                <div className="card-phones-row">
                  <a href={`tel:${CONFIG.phonePrimary.tel}`} className="card-tel-link">
                    {CONFIG.phonePrimary.display}
                  </a>
                  <span className="card-tel-sep">·</span>
                  <a href={`tel:${CONFIG.phoneSecondary.tel}`} className="card-tel-link">
                    {CONFIG.phoneSecondary.display}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 5. En Altta Küçük Satır: Blog Bağlantısı ("Ada Notları") */}
          <div className="info-bs-footer-row">
            <Link to="/blog" onClick={handleClose} className="info-bs-blog-link">
              <BookOpen size={14} />
              <span>{t('islandNotes', lang)} →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
