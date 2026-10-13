import { useState, useEffect } from 'react'
import { PlusSquare, Share, X, Download } from 'lucide-react'
import { asset } from '../utils/asset.js'

const DISMISS_KEY = 'lovemacun_pwa_dismissed'

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    // Check if dismissed before
    try {
      if (localStorage.getItem(DISMISS_KEY)) return
    } catch {}

    // Check if already in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) return

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(ua)
    setIsIos(isIosDevice)

    // Android / Desktop beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // En az 15 saniye sonra göster (QR müşterisinin menüyü rahat incelemesi için)
    const timer = setTimeout(() => {
      // Only show if mobile width
      if (window.innerWidth <= 768) {
        setShowBanner(true)
      }
    }, 15000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setShowBanner(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    }
  }

  if (!showBanner) return null

  return (
    <aside className="pwa-install-banner" aria-label="Uygulamayı Ana Ekrana Ekle">
      <div className="pwa-banner-card">
        <button
          type="button"
          className="pwa-close-btn"
          onClick={handleDismiss}
          aria-label="Kapat"
        >
          <X size={16} />
        </button>

        <div className="pwa-banner-left">
          <img
            src={asset('/icons/icon-192x192.png')}
            alt="Taş Fırın Lovemacun Logosu"
            className="pwa-banner-logo"
            width="42"
            height="42"
          />
          <div className="pwa-banner-text">
            <strong>Taş Fırın Lovemacun</strong>
            {isIos ? (
              <span>
                Safari’de <Share size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Paylaş → <strong>Ana Ekrana Ekle</strong>
              </span>
            ) : (
              <span>Hızlı menü erişimi için ana ekranınıza ekleyin</span>
            )}
          </div>
        </div>

        {!isIos && deferredPrompt && (
          <button
            type="button"
            className="btn-pwa-install"
            onClick={handleInstallClick}
          >
            <Download size={14} /> Ekle
          </button>
        )}
      </div>
    </aside>
  )
}
