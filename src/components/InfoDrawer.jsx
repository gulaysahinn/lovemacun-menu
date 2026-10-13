import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Sparkles,
  BookOpen,
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  UtensilsCrossed
} from 'lucide-react'
import { CONFIG } from '../config.js'

function InstagramIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export function InfoDrawer({ isOpen, onClose }) {
  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="info-drawer-root" role="dialog" aria-modal="true" aria-label="Restoran Bilgileri ve Bağlantılar">
          {/* Backdrop */}
          <motion.div
            className="info-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="info-drawer-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {/* Tutamaç */}
            <div className="sheet-drag-handle-wrap" onClick={onClose}>
              <div className="sheet-drag-handle" />
            </div>

            {/* Başlık */}
            <div className="info-drawer-header">
              <div className="info-drawer-brand">
                <img
                  src="/logo-badge.png"
                  alt="Taş Fırın Lovemacun"
                  className="info-drawer-logo"
                  width="44"
                  height="44"
                />
                <div>
                  <h2 className="info-drawer-title notranslate" translate="no">{CONFIG.name}</h2>
                  <span className="info-drawer-tagline">Büyükada · Taş Fırın Ustalığı</span>
                </div>
              </div>
              <button
                type="button"
                className="info-drawer-close-btn"
                onClick={onClose}
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Bilgi ve Bağlantı Öğeleri */}
            <div className="info-drawer-content">
              {/* Çalışma Saatleri & Konum Özeti */}
              <div className="info-quick-cards">
                <div className="info-quick-item">
                  <Clock size={16} className="info-item-ico" />
                  <div>
                    <strong>Çalışma Saatleri</strong>
                    <span>Her gün {CONFIG.hours}</span>
                  </div>
                </div>
                <div className="info-quick-item">
                  <MapPin size={16} className="info-item-ico" />
                  <div>
                    <strong>Adres</strong>
                    <span>{CONFIG.address}</span>
                  </div>
                </div>
              </div>

              {/* Hızlı Sayfa Bağlantıları */}
              <div className="info-links-group">
                <span className="info-group-title">KEŞFEDİN</span>

                <Link
                  to="/hikayemiz"
                  className="info-nav-link"
                  onClick={onClose}
                >
                  <div className="info-link-left">
                    <span className="info-link-icon-box">
                      <Sparkles size={17} />
                    </span>
                    <div>
                      <strong>Hikayemiz & Taş Fırın Aşkı</strong>
                      <small>Nesiller boyu aktarılan tarifler</small>
                    </div>
                  </div>
                  <ChevronRight size={17} className="info-chevron" />
                </Link>

                <Link
                  to="/blog"
                  className="info-nav-link"
                  onClick={onClose}
                >
                  <div className="info-link-left">
                    <span className="info-link-icon-box">
                      <BookOpen size={17} />
                    </span>
                    <div>
                      <strong>Blog & Ada Notları</strong>
                      <small>Ada lezzetleri & hikayeler</small>
                    </div>
                  </div>
                  <ChevronRight size={17} className="info-chevron" />
                </Link>

                <Link
                  to="/iletisim"
                  className="info-nav-link"
                  onClick={onClose}
                >
                  <div className="info-link-left">
                    <span className="info-link-icon-box">
                      <MapPin size={17} />
                    </span>
                    <div>
                      <strong>Konum & Yol Tarifi</strong>
                      <small>Google Harita ve iletişim</small>
                    </div>
                  </div>
                  <ChevronRight size={17} className="info-chevron" />
                </Link>
              </div>

              {/* İletişim & Sosyal Medya Butonları */}
              <div className="info-action-buttons">
                <a
                  href={`tel:${CONFIG.phonePrimary.tel}`}
                  className="btn btn-info-call notranslate"
                  translate="no"
                >
                  <Phone size={16} /> Hemen Ara ({CONFIG.phonePrimary.display})
                </a>
                <a
                  href={CONFIG.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-info-insta"
                >
                  <InstagramIcon size={16} /> Instagram’da Takip Et
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
