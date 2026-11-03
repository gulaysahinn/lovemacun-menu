import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { CONFIG } from '../config.js'
import { asset } from '../utils/asset.js'

export function MobileAppHeader({ onOpenHamburger, isHamburgerOpen }) {
  return (
    <header className="mobile-app-header mobile-only" aria-label="Taş Fırın Lovemacun Mobil Başlık">
      <div className="mobile-app-header-inner">
        {/* Sol: Logo + Marka Adı (320px'te taşmayı önlemek için ellipsis) */}
        <Link to="/" className="mobile-app-brand notranslate" translate="no">
          <img
            src={asset('/logo-badge.png')}
            alt="Taş Fırın Lovemacun"
            className="mobile-app-logo"
            width="34"
            height="34"
          />
          <span className="mobile-app-title">{CONFIG.name}</span>
        </Link>

        {/* Sağ: Hamburger Düğmesi */}
        <div className="mobile-app-actions">
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
