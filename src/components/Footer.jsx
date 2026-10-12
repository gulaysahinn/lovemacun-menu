import { Link } from 'react-router-dom'
import { CONFIG } from '../config.js'

export function Footer({ onOpenList }) {
  return (
    <footer className="site-footer">
      <div className="footer-glow-line" aria-hidden="true" />
      <div className="container footer-inner">
        {/* 1. Marka */}
        <div className="footer-col footer-brand">
          <img src="/logo-badge.png" alt="Taş Fırın Lovemacun" className="footer-logo" width="72" height="72" />
          <h2 className="footer-title">{CONFIG.name}</h2>
          <p className="footer-slogan">Aşkla yoğrulan hamur, eşsiz lezzet.</p>
        </div>

        {/* 2. Keşfet */}
        <div className="footer-col footer-nav">
          <h4 className="footer-heading">Keşfet</h4>
          <div className="footer-links-list">
            <Link to="/">Menü</Link>
            <Link to="/hikayemiz">Hikayemiz</Link>
            <Link to="/iletisim">İletişim & Konum</Link>
            {onOpenList && (
              <button type="button" className="footer-link-btn" onClick={onOpenList}>
                Listem
              </button>
            )}
          </div>
        </div>

        {/* 3. İletişim */}
        <div className="footer-col footer-contact">
          <h4 className="footer-heading">İletişim</h4>
          <p className="footer-phone">
            <a href={'tel:' + CONFIG.phonePrimary.tel}>{CONFIG.phonePrimary.display}</a>
            <span className="footer-phone-sub" style={{ color: '#ad9b8b', marginLeft: '6px' }}>
              / <a href={'tel:' + CONFIG.phoneSecondary.tel}>{CONFIG.phoneSecondary.display}</a>
            </span>
          </p>
          <p className="footer-address">{CONFIG.address}</p>
          <p className="footer-hours">Her gün {CONFIG.hours}</p>
          <div className="footer-action-btns">
            <a
              className="btn btn-footer-route"
              href={CONFIG.mapsDirectionsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Yol Tarifi
            </a>
            <a className="btn btn-footer-insta" href={CONFIG.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p className="footer-copyright">
          © {new Date().getFullYear()} {CONFIG.name} · Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  )
}
