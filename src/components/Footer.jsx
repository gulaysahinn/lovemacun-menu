import { Link } from 'react-router-dom'
import { CONFIG } from '../config.js'
import { LanguageSwitcher } from './LanguageSwitcher.jsx'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-glow-line" aria-hidden="true" />
      <div className="container footer-inner">
        {/* 1. Marka */}
        <div className="footer-col footer-brand">
          <img src="/logo-badge.png" alt="Taş Fırın Lovemacun" className="footer-logo" width="72" height="72" />
          <h2 className="footer-title notranslate" translate="no">{CONFIG.name}</h2>
          <p className="footer-slogan">Aşkla yoğrulan hamur, eşsiz lezzet.</p>
        </div>

        {/* 2. Keşfet */}
        <div className="footer-col footer-nav">
          <h4 className="footer-heading">Keşfet</h4>
          <div className="footer-links-list">
            <Link to="/">Menü</Link>
            <Link to="/hikayemiz">Hikayemiz</Link>
            <Link to="/iletisim">İletişim & Konum</Link>
            <Link to="/blog">Blog</Link>
            <div style={{ marginTop: '12px' }}>
              <LanguageSwitcher align="left" dropUp={true} />
            </div>
          </div>
        </div>

        {/* 3. İletişim */}
        <div className="footer-col footer-contact">
          <h4 className="footer-heading">İletişim</h4>
          <p className="footer-phone notranslate" translate="no">
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
          © {new Date().getFullYear()} <span className="notranslate" translate="no">{CONFIG.name}</span> · Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  )
}
