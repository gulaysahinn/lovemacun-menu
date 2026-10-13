import { Link } from 'react-router-dom'
import { UtensilsCrossed, ArrowLeft } from 'lucide-react'
import { PageMeta } from '../components/PageMeta.jsx'

export function NotFoundPage() {
  return (
    <div className="notfound-page container">
      <PageMeta
        title="404 - Sayfa Bulunamadı | Taş Fırın Lovemacun"
        description="Aradığınız lezzet veya sayfa bulunamadı. Taş Fırın Lovemacun Büyükada menüsüne geri dönebilirsiniz."
        canonical="https://tasfirinlovemacun.com/404"
      />
      <div className="notfound-card">
        <div className="notfound-icon-wrap" aria-hidden="true">
          <span className="notfound-emoji">🍕</span>
        </div>
        <span className="notfound-kicker">HATA 404</span>
        <h1 className="notfound-title">Aradığınız Lezzet Bulunamadı</h1>
        <p className="notfound-desc">
          Ulaşmaya çalıştığınız sayfa taşınmış, silinmiş veya adresi yanlış girilmiş olabilir. 
          Geleneksel taş fırın lezzetlerimizi incelemek için menümüze göz atabilirsiniz.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="btn btn-notfound-home">
            <UtensilsCrossed size={18} />
            Menüye Dön
          </Link>
          <Link to="/iletisim" className="btn ghost">
            İletişim & Konum
          </Link>
        </div>
      </div>
    </div>
  )
}
