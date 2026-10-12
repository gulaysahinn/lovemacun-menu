import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { TopBar, MobileDock } from './components/Navigation.jsx'
import { Footer } from './components/Footer.jsx'
import { ScrollToTop } from './components/ScrollToTop.jsx'
import { SearchModal } from './components/SearchModal.jsx'
import { BottomSheet } from './components/BottomSheet.jsx'
import { MenuPage } from './pages/MenuPage.jsx'
import { StoryPage } from './pages/StoryPage.jsx'
import { ContactPage } from './pages/ContactPage.jsx'
import { useList, ListSheet } from './Extras.jsx'

export default function App() {
  const L = useList()
  const [selected, setSelected] = useState(null)
  const [listOpen, setListOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const progressBarRef = useRef(null)

  // ESC key closes any open modal
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelected(null)
        setSearchOpen(false)
        setListOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Show scroll-to-top button after 450px scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 450)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Reading Progress Bar listener
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
    <BrowserRouter>
      <ScrollToTop />

      {/* Reading Progress Bar */}
      <div className="reading-progress-bar" ref={progressBarRef} aria-hidden="true" />

      {/* Header Navigation */}
      <TopBar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenList={() => setListOpen(true)}
        favCount={L.count}
      />

      {/* Page Routing */}
      <Routes>
        <Route
          path="/"
          element={
            <MenuPage
              L={L}
              onSelectProduct={setSelected}
              onOpenSearch={() => setSearchOpen(true)}
            />
          }
        />
        <Route path="/hikayemiz" element={<StoryPage />} />
        <Route path="/iletisim" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Footer */}
      <Footer onOpenList={() => setListOpen(true)} />

      {/* Mobile Bottom Dock */}
      <MobileDock
        onOpenSearch={() => setSearchOpen(true)}
        onOpenList={() => setListOpen(true)}
        favCount={L.count}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={setSelected}
        L={L}
      />

      {/* Product Detail Modal */}
      <BottomSheet
        item={selected}
        onClose={() => setSelected(null)}
        L={L}
      />

      {/* List Modal */}
      {listOpen && (
        <ListSheet
          L={L}
          onClose={() => setListOpen(false)}
        />
      )}

      {/* Scroll to top button */}
      <button
        type="button"
        className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Yukarı çık"
      >
        <ArrowUp size={20} />
      </button>
    </BrowserRouter>
  )
}
