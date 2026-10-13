import { Link } from 'react-router-dom'
import { Search, Menu } from 'lucide-react'
import { CONFIG } from '../config.js'

export function MobileAppHeader({ onOpenSearch, onOpenHamburger, isHamburgerOpen }) {
  return (
    <header className="mobile-app-header mobile-only" aria-label="Taş Fırın Lovemacun Mobil Başlık">
      <div className="mobile-app-header-inner">
        {/* Sol: Logo + Marka Adı (320px'te taşmayı önlemek için ellipsis) */}
        <Link to="/" className="mobile-app-brand notranslate" translate="no">
          <img
            src="/logo-badge.png"
            alt="Taş Fırın Lovemacun"
            className="mobile-app-logo"
            width="34"
            height="34"
          />
          <span className="mobile-app-title">{CONFIG.name}</span>
        </Link>

        {/* Sağ: Arama ve Hamburger Düğmesi (Dil çekmeceye taşındı) */}
        <div className="mobile-app-actions">
          <button
            type="button"
            className="mobile-app-icon-btn mobile-app-search-btn"
            onClick={onOpenSearch}
            aria-label="Menüde Ara"
          >
            <Search size={19} />
          </button>
          <button
            type="button"
            className="mobile-app-icon-btn mobile-app-hamburger-btn"
            onClick={onOpenHamburger}
            aria-label="Menüyü aç"
            aria-expanded={Boolean(isHamburgerOpen)}
          >
            <Menu size={21} />
          </button>
        </div>
      </div>
    </header>
  )
}
