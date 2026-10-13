import React, { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { TopBar } from './components/Navigation.jsx'
import { MobileAppHeader } from './components/MobileAppHeader.jsx'
import { MobileTabBar } from './components/MobileTabBar.jsx'
import { InfoDrawer } from './components/InfoDrawer.jsx'
import { PwaInstallBanner } from './components/PwaInstallBanner.jsx'
import { Footer } from './components/Footer.jsx'
import { SearchModal } from './components/SearchModal.jsx'
import { BottomSheet } from './components/BottomSheet.jsx'
import { HamburgerDrawer } from './components/HamburgerDrawer.jsx'
import { MenuPage } from './pages/MenuPage.jsx'

// Route bazlı dinamik kod bölme (Code-splitting) - İlk yükleme JS boyutunu hafifletir
const StoryPage = lazy(() => import('./pages/StoryPage.jsx').then((m) => ({ default: m.StoryPage })))
const ContactPage = lazy(() => import('./pages/ContactPage.jsx').then((m) => ({ default: m.ContactPage })))
const BlogListPage = lazy(() => import('./pages/BlogListPage.jsx').then((m) => ({ default: m.BlogListPage })))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage.jsx').then((m) => ({ default: m.BlogPostPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx').then((m) => ({ default: m.NotFoundPage })))

function AppContent() {
  const [selected, setSelected] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false)
  const [hamburgerOpen, setHamburgerOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const progressBarRef = useRef(null)
  const location = useLocation()

  // Eski siparis listesi localStorage anahtarini bir kez temizle
  useEffect(() => {
    try {
      localStorage.removeItem('lovemacun-liste')
    } catch {}
  }, [])

  // Sayfa geçişlerinde menü kaydırma konumunu hatırlama & diğer sayfalarda en üste dönme
  useEffect(() => {
    const isMenu = location.pathname === '/'
    if (isMenu) {
      try {
        const savedScroll = sessionStorage.getItem('lovemacun_menu_scroll')
        if (savedScroll) {
          window.scrollTo({ top: Number(savedScroll), behavior: 'auto' })
        }
      } catch {}
    } else {
      window.scrollTo(0, 0)
    }

    return () => {
      if (isMenu) {
        try {
          sessionStorage.setItem('lovemacun_menu_scroll', String(window.scrollY))
        } catch {}
      }
    }
  }, [location.pathname])

  // ESC tuşuyla açık çekmeceleri kapatma
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelected(null)
        setSearchOpen(false)
        setInfoDrawerOpen(false)
        setHamburgerOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Masaüstünde yukarı çık butonu göster/gizle
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 450)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Okuma ilerleme çubuğu
  useEffect(() => {
    let ticking = false
    const updateProgress = () => {
      const el = progressBarRef.current
      if (!el) return
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollHeight > 0 ? Math.min(Math.max(window.scrollY / scrollHeight, 0), 1) : 0
      el.style.transform = `scaleX(${progress})`
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    updateProgress()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="app-shell-root">
      {/* Okuma İlerleme Çubuğu */}
      <div className="reading-progress-bar" ref={progressBarRef} aria-hidden="true" />

      {/* 1. MASAÜSTÜ HEADER (Mobilde CSS ile gizlenir) */}
      <div className="desktop-header-wrapper desktop-only">
        <TopBar
          onOpenSearch={() => setSearchOpen(true)}
          onOpenHamburger={() => setHamburgerOpen(true)}
          isHamburgerOpen={hamburgerOpen}
        />
      </div>

      {/* 2. MOBİL UYGULAMA ÇUBUĞU (56px sticky, masaüstünde gizlenir) */}
      <MobileAppHeader
        onOpenSearch={() => setSearchOpen(true)}
        onOpenHamburger={() => setHamburgerOpen(true)}
        isHamburgerOpen={hamburgerOpen}
      />

      {/* 3. SAYFA ROTALARI (Sayfa geçiş animasyonu ve iskelet yükleyici) */}
      <main className="app-main-content">
        <Suspense fallback={<div className="page-skeleton-loader" aria-label="Yükleniyor…" />}>
          <Routes>
            <Route
              path="/"
              element={
                <MenuPage
                  onSelectProduct={setSelected}
                  onOpenSearch={() => setSearchOpen(true)}
                />
              }
            />
            <Route path="/hikayemiz" element={<StoryPage />} />
            <Route path="/hakkimizda" element={<StoryPage />} />
            <Route path="/iletisim" element={<ContactPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/buyukadada-ezber-bozan-bir-lezzet-tasfirinlovemacun" element={<BlogPostPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* 4. FOOTER (Mobilde CSS ile gizlenir, masaüstünde görünür) */}
      <div className="desktop-footer-wrapper desktop-only">
        <Footer />
      </div>

      {/* 5. MOBİL 4 SEKMELİ TAB BAR (Masaüstünde ve Arama açıkken gizlenir) */}
      <MobileTabBar
        isSearchOpen={searchOpen}
        onOpenInfo={() => setInfoDrawerOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* 6. MODALLAR VE ÇEKMECELER */}
      <HamburgerDrawer
        isOpen={hamburgerOpen}
        onClose={() => setHamburgerOpen(false)}
        onOpenSearch={() => {
          setHamburgerOpen(false)
          setSearchOpen(true)
        }}
      />

      <InfoDrawer
        isOpen={infoDrawerOpen}
        onClose={() => setInfoDrawerOpen(false)}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={setSelected}
      />

      <BottomSheet
        item={selected}
        onClose={() => setSelected(null)}
      />

      {/* 7. PWA Kurulum İpucu / Bildirimi (15 saniye sonra) */}
      <PwaInstallBanner />

      {/* 8. Masaüstü Yukarı Çık Butonu (Mobilde CSS ile gizlenir) */}
      <button
        type="button"
        className={`scroll-to-top desktop-only ${showScrollTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Yukarı çık"
      >
        <ArrowUp size={20} />
      </button>
    </div>
  )
}

const getBasename = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/lovemacun-menu')) {
    return '/lovemacun-menu'
  }
  return ''
}

export default function App() {
  return (
    <BrowserRouter basename={getBasename()}>
      <AppContent />
    </BrowserRouter>
  )
}
