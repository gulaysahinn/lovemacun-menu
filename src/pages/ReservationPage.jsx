import { Link } from 'react-router-dom'
import {
  Calendar,
  Phone,
  Clock,
  MapPin,
  UtensilsCrossed,
} from 'lucide-react'
import { PageMeta } from '../components/PageMeta.jsx'
import { CONFIG } from '../config.js'
import { useLang, t } from '../utils/i18n.js'

export function ReservationPage() {
  const lang = useLang()

  return (
    <div className="reservation-page">
      <PageMeta
        title="Rezervasyon | Taş Fırın Lovemacun Büyükada"
        description="Büyükada Taş Fırın Lovemacun masa rezervasyonu. Rezervasyon ve bilgi için restoranımızı arayın."
        canonical="https://tasfirinlovemacun.com/rezervasyon"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Restaurant",
          "name": CONFIG.name,
          "telephone": CONFIG.phonePrimary.tel,
          "acceptsReservations": "True",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Nizam, Düz Sk. no: 1",
            "addressLocality": "Adalar",
            "addressRegion": "İstanbul",
            "postalCode": "34970",
            "addressCountry": "TR"
          },
          "url": "https://tasfirinlovemacun.com/rezervasyon"
        }}
      />

      <section className="reservation-section container">
        <div className="reservation-head text-center">
          <span className="reservation-kicker notranslate" translate="no">
            ✦ {lang === 'en' ? 'BÜYÜKADA · TABLE RESERVATION' : 'BÜYÜKADA · MASA REZERVASYONU'}
          </span>
          <h1 className="reservation-title notranslate" translate="no">
            {t('reservation', lang)}
          </h1>
          <p className="reservation-sub">
            {lang === 'en'
              ? 'Call us for a table. We recommend calling ahead for summer season and weekends.'
              : 'Masa için bizi arayın. Yaz sezonu ve hafta sonları önceden aramanızı öneririz.'}
          </p>
        </div>

        {/* Masaüstü 2 Kolon, Mobil Tek Kolon Grid */}
        <div className="reservation-grid">
          {/* 1. Kolon: Rezervasyon Çağrı Kartı */}
          <div className="reservation-main-card">
            <div className="res-card-badge">
              <Calendar size={18} className="res-badge-icon" />
              <span>{lang === 'en' ? 'Phone Reservation' : 'Telefonla Rezervasyon'}</span>
            </div>

            <h2 className="res-card-h2">
              {lang === 'en'
                ? 'Call Us for Table Booking'
                : 'Masanızı Ayırtmak İçin Bizi Arayın'}
            </h2>
            <p className="res-card-desc">
              {lang === 'en'
                ? 'For group bookings and special occasions, just call us in advance.'
                : 'Kalabalık gruplar ve özel günler için önceden aramanız yeterli.'}
            </p>

            {/* Arama Butonları (52px yükseklik, iki hat ayrı ayrı) */}
            <div className="res-phone-buttons">
              <a
                href={`tel:${CONFIG.phonePrimary.tel}`}
                className="btn btn-res-call primary notranslate"
                translate="no"
                aria-label={`Ara: ${CONFIG.phonePrimary.display}`}
              >
                <Phone size={18} />
                <div className="btn-call-text">
                  <span className="btn-call-label">{lang === 'en' ? 'Primary Line' : 'Ana Hat'}</span>
                  <strong className="btn-call-number">{CONFIG.phonePrimary.display}</strong>
                </div>
              </a>

              <a
                href={`tel:${CONFIG.phoneSecondary.tel}`}
                className="btn btn-res-call secondary notranslate"
                translate="no"
                aria-label={`Ara: ${CONFIG.phoneSecondary.display}`}
              >
                <Phone size={18} />
                <div className="btn-call-text">
                  <span className="btn-call-label">{lang === 'en' ? 'Secondary Line' : 'İkincil Hat'}</span>
                  <strong className="btn-call-number">{CONFIG.phoneSecondary.display}</strong>
                </div>
              </a>
            </div>
          </div>

          {/* 2. Kolon: Restoran Bilgi & Saat Kartı */}
          <div className="reservation-side-cards">
            {/* Çalışma Saatleri */}
            <div className="res-side-card">
              <div className="side-card-head">
                <Clock size={18} className="side-card-ico" />
                <h3 className="side-card-title">{t('hours', lang)}</h3>
              </div>
              <p className="side-card-val notranslate" translate="no">{t('hoursEveryday', lang)}</p>
            </div>

            {/* Adres ve Yol Tarifi */}
            <div className="res-side-card">
              <div className="side-card-head">
                <MapPin size={18} className="side-card-ico" />
                <h3 className="side-card-title">{t('address', lang)}</h3>
              </div>
              <p className="side-card-val notranslate" translate="no">{CONFIG.address}</p>
                <div className="side-card-actions">
                  <a
                    href={CONFIG.mapsDirectionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-side-route btn-side-route-orange notranslate"
                    translate="no"
                  >
                    <MapPin size={15} /> {t('directions', lang)}
                  </a>
                </div>
            </div>

            {/* Menüyü Gör CTA */}
            <div className="res-side-card card-menu-cta">
              <div className="side-card-head">
                <UtensilsCrossed size={18} className="side-card-ico" />
                <h3 className="side-card-title">{lang === 'en' ? 'Explore Our Menu' : 'Menümüzü İnceleyin'}</h3>
              </div>
              <p className="side-card-sub">
                {lang === 'en'
                  ? 'Discover crispy lahmacun, fresh pides, and hot kebabs from our stone oven.'
                  : 'Taş fırında pişen çıtır lahmacunlarımızı, nefis pidelerimizi ve köz kebaplarımızı keşfedin.'}
              </p>
              <Link to="/" className="btn btn-side-menu notranslate" translate="no">
                {t('menu', lang)} →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
