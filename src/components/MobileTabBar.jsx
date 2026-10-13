import { useLocation, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Search, MapPin, Info } from 'lucide-react'

export function MobileTabBar({ isSearchOpen = false, onOpenInfo, onOpenSearch }) {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

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
    <nav className="mobile-tab-bar mobile-only" role="navigation" aria-label="Mobil Alt Sekmeler">
      <div className="mobile-tab-bar-inner">
        {/* 1. Menü */}
        <button
          type="button"
          className={`mobile-tab-item ${isMenu ? 'active' : ''}`}
          onClick={handleMenuClick}
          aria-label="Menü"
        >
          <div className="tab-icon-wrap">
            <UtensilsCrossed size={20} />
          </div>
          <span className="tab-label">Menü</span>
        </button>

        {/* 2. Ara (Tam ekran arama panelini açar) */}
        <button
          type="button"
          className="mobile-tab-item tab-search-item"
          onClick={onOpenSearch}
          aria-label="Menüde Ara"
        >
          <div className="tab-icon-wrap">
            <Search size={20} />
          </div>
          <span className="tab-label">Ara</span>
        </button>

        {/* 3. Konum */}
        <button
          type="button"
          className={`mobile-tab-item ${isContact ? 'active' : ''}`}
          onClick={handleLocationClick}
          aria-label="Konum ve Yol Tarifi"
        >
          <div className="tab-icon-wrap">
            <MapPin size={20} />
          </div>
          <span className="tab-label">Konum</span>
        </button>

        {/* 4. Bilgi */}
        <button
          type="button"
          className="mobile-tab-item"
          onClick={onOpenInfo}
          aria-label="Restoran Bilgileri ve Bağlantılar"
        >
          <div className="tab-icon-wrap">
            <Info size={20} />
          </div>
          <span className="tab-label">Bilgi</span>
        </button>
      </div>
    </nav>
  )
}
