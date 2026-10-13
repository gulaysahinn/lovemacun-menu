import { useLocation, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Search, MapPin, Info } from 'lucide-react'
import { useLang, t } from '../utils/i18n.js'

export function MobileTabBar({ isSearchOpen = false, onOpenInfo, onOpenSearch }) {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const lang = useLang()

  const isMenu = pathname === '/'
  const isContact = pathname === '/iletisim'

  const handleMenuClick = () => {
    if (isMenu) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleLocationClick = () => {
    navigate('/iletisim')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Arama açıkken alt tab bar gizlenir
  if (isSearchOpen) return null

  return (
    <nav className="mobile-tab-bar mobile-only notranslate" role="navigation" aria-label="Mobil Alt Sekmeler" translate="no">
      <div className="mobile-tab-bar-inner">
        {/* 1. Menü */}
        <button
          type="button"
          className={`mobile-tab-item ${isMenu ? 'active' : ''}`}
          onClick={handleMenuClick}
          aria-label={lang === 'en' ? 'Menu' : 'Menü'}
        >
          <div className="tab-icon-wrap">
            <UtensilsCrossed size={20} />
          </div>
          <span className="tab-label">{lang === 'en' ? 'Menu' : 'Menü'}</span>
        </button>

        {/* 2. Ara */}
        <button
          type="button"
          className="mobile-tab-item tab-search-item"
          onClick={onOpenSearch}
          aria-label={t('search', lang)}
        >
          <div className="tab-icon-wrap">
            <Search size={20} />
          </div>
          <span className="tab-label">{t('search', lang)}</span>
        </button>

        {/* 3. Konum */}
        <button
          type="button"
          className={`mobile-tab-item ${isContact ? 'active' : ''}`}
          onClick={handleLocationClick}
          aria-label={lang === 'en' ? 'Location' : 'Konum'}
        >
          <div className="tab-icon-wrap">
            <MapPin size={20} />
          </div>
          <span className="tab-label">{lang === 'en' ? 'Location' : 'Konum'}</span>
        </button>

        {/* 4. Bilgi */}
        <button
          type="button"
          className="mobile-tab-item"
          onClick={onOpenInfo}
          aria-label={lang === 'en' ? 'Info' : 'Bilgi'}
        >
          <div className="tab-icon-wrap">
            <Info size={20} />
          </div>
          <span className="tab-label">{lang === 'en' ? 'Info' : 'Bilgi'}</span>
        </button>
      </div>
    </nav>
  )
}
