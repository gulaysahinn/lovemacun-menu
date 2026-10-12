import { Link } from 'react-router-dom'
import { MapPin, Clock, Phone, ExternalLink } from 'lucide-react'
import { PageMeta } from '../components/PageMeta.jsx'
import { CONFIG } from '../config.js'

export function ContactPage() {
  return (
    <div className="contact-page">
      <PageMeta
        title="İletişim & Konum | Taş Fırın Lovemacun"
        description="Büyükada Taş Fırın Lovemacun iletişim bilgileri, telefon numaraları, çalışma saatleri ve harita yol tarifi."
        canonical="https://tasfirinlovemacun.com/iletisim"
      />

      <section className="contact-header-section">
        <div className="container">
          <span className="kicker">BİZİ BULUN · BÜYÜKADA</span>
          <h1 className="contact-h1">İletişim & Konum</h1>
          <p className="contact-sub">
            Büyükada Nizam Mahallesi'nde taş fırınımız ve sıcacık soframızla sizleri bekliyoruz.
          </p>
        </div>
      </section>

      <section className="visit container">
        <div className="visit-grid">
          {/* Harita Alanı */}
          <div className="map-wrapper">
            <div className="map-container">
              <iframe
                className="map"
                title="Taş Fırın Lovemacun Konum Haritası"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={CONFIG.mapsEmbedUrl}
              />
              {/* Mobil Haritayı Aç Butonu */}
              <div className="map-mobile-overlay mobile-only">
                <a
                  className="btn btn-map-open"
                  href={CONFIG.mapsDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin size={16} /> Google Haritalar'da Aç <ExternalLink size={14} />
                </a>
              </div>
            </div>
            {/* Masaüstü Harita Altı Yol Tarifi Butonu */}
            <div className="map-bottom-action desktop-only">
              <a
                className="btn btn-map-desktop"
                href={CONFIG.mapsDirectionsUrl}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={15} /> Google Haritalar'da Aç ve Yol Tarifi Al <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* İletişim Detay Kartı */}
          <div className="vinfo" style={{ transitionDelay: '120ms' }}>
            <div className="vcard">
              <span className="vcard-label">
                <MapPin size={16} className="vcard-ico" /> Adres
              </span>
              <p>{CONFIG.address}</p>
            </div>

            <div className="vcard">
              <span className="vcard-label">
                <Clock size={16} className="vcard-ico" /> Çalışma Saatleri
              </span>
              <p>{CONFIG.hoursDetail}</p>
            </div>

            <div className="vcard">
              <span className="vcard-label">
                <Phone size={16} className="vcard-ico" /> Telefon Numaraları
              </span>
              <p>
                <a href={'tel:' + CONFIG.phonePrimary.tel} className="contact-tel-link">
                  {CONFIG.phonePrimary.display}
                </a>
                <span className="vcard-sub-phone" style={{ color: '#ad9b8b', fontSize: '0.9em', marginLeft: '6px' }}>
                  / <a href={'tel:' + CONFIG.phoneSecondary.tel} className="contact-tel-link">
                    {CONFIG.phoneSecondary.display}
                  </a>
                </span>
              </p>
            </div>

            <div className="vbtns">
              <a className="btn btn-visit-primary" href={CONFIG.mapsDirectionsUrl} target="_blank" rel="noreferrer">
                Yol Tarifi Al
              </a>
              <a className="btn btn-visit-outline" href={'tel:' + CONFIG.phonePrimary.tel}>
                Ara ({CONFIG.phonePrimary.display})
              </a>
              <a className="btn btn-visit-outline" href={CONFIG.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="contact-bottom-cta">
          <Link to="/" className="btn btn-contact-menu">
            Menüyü İnceleyin
          </Link>
        </div>
      </section>
    </div>
  )
}
