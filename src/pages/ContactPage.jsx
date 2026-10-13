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
            </div>
            {/* Haritanın tam genişliğinde tek sıra Yol Tarifi butonu */}
            <div className="map-bottom-action">
              <a
                className="btn btn-map-fullwidth"
                href={CONFIG.mapsDirectionsUrl}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={16} /> Google Haritalar'da Aç ve Yol Tarifi Al <ExternalLink size={14} />
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
              <p className="notranslate" translate="no">
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
              <a className="btn btn-visit-primary" href={'tel:' + CONFIG.phonePrimary.tel}>
                <Phone size={16} /> Hemen Ara ({CONFIG.phonePrimary.display})
              </a>
              <a className="btn btn-visit-outline" href={CONFIG.instagram} target="_blank" rel="noreferrer">
                Instagram'da Takip Et
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
