import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, X } from 'lucide-react'

export const LANGUAGES = [
  { code: 'tr', name: 'Türkçe', short: 'TR', flag: '/flags/tr.png' },
  { code: 'en', name: 'English', short: 'EN', flag: '/flags/gb.png' },
  { code: 'ar', name: 'Arabic', short: 'AR', flag: '/flags/sa.png' },
  { code: 'ru', name: 'Russian', short: 'RU', flag: '/flags/ru.png' },
  { code: 'de', name: 'German', short: 'DE', flag: '/flags/de.png' },
  { code: 'fr', name: 'French', short: 'FR', flag: '/flags/fr.png' },
  { code: 'fa', name: 'Persian', short: 'FA', flag: '/flags/ir.png' },
  { code: 'es', name: 'Spanish', short: 'ES', flag: '/flags/es.png' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', short: 'ZH', flag: '/flags/cn.png' },
  { code: 'nl', name: 'Dutch', short: 'NL', flag: '/flags/nl.png' },
]

export function getInitialLang() {
  if (typeof window === 'undefined') return 'tr'
  try {
    const saved = localStorage.getItem('lovemacun_lang')
    if (saved) return saved

    const cookieMatch = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/)
    if (cookieMatch && cookieMatch[1]) {
      return cookieMatch[1]
    }
  } catch {}
  return 'tr'
}

export function loadGoogleTranslateScript() {
  if (typeof window === 'undefined') return
  if (document.getElementById('google-translate-script')) return
  const s = document.createElement('script')
  s.id = 'google-translate-script'
  s.type = 'text/javascript'
  s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  s.async = true
  document.body.appendChild(s)
}

export function applyLanguage(langCode) {
  try {
    localStorage.setItem('lovemacun_lang', langCode)

    const hostname = window.location.hostname
    if (langCode === 'tr') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`
      document.cookie = 'googtrans=/tr/tr; path=/;'
      document.cookie = `googtrans=/tr/tr; path=/; domain=${hostname};`
    } else {
      document.cookie = `googtrans=/tr/${langCode}; path=/;`
      document.cookie = `googtrans=/tr/${langCode}; path=/; domain=${hostname};`
    }
  } catch (e) {
    console.warn('Language cookie could not be set', e)
  }

  const combo = document.querySelector('.goog-te-combo')
  if (combo) {
    combo.value = langCode
    combo.dispatchEvent(new Event('change'))
  } else {
    window.location.reload()
  }
}

export function LanguageSwitcher({ align = 'right', dropUp = false, compact = false }) {
  const [currentLang, setCurrentLang] = useState(getInitialLang)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const activeLang = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0]

  useEffect(() => {
    if (currentLang !== 'tr') {
      loadGoogleTranslateScript()
    }
  }, [currentLang])

  // Lock body scroll on mobile sheet open
  useEffect(() => {
    if (compact && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [compact, isOpen])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen && !compact) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    } else if (isOpen && compact) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, compact])

  const setLanguage = (langCode) => {
    if (langCode === currentLang) {
      setIsOpen(false)
      return
    }
    setCurrentLang(langCode)
    setIsOpen(false)
    applyLanguage(langCode)
  }

  return (
    <div
      ref={dropdownRef}
      className={`lang-switcher notranslate ${isOpen ? 'open' : ''} ${dropUp ? 'drop-up' : ''} ${compact ? 'is-compact' : ''}`}
      translate="no"
    >
      {/* Trigger Button (Mobilde 44x44 kompakt bayrak + küçük ok; masaüstünde geniş hap) */}
      <button
        type="button"
        className={`lang-trigger-btn ${compact ? 'lang-trigger-compact' : ''}`}
        onMouseEnter={loadGoogleTranslateScript}
        onTouchStart={loadGoogleTranslateScript}
        onClick={() => {
          loadGoogleTranslateScript()
          setIsOpen((prev) => !prev)
        }}
        aria-haspopup={compact ? 'dialog' : 'listbox'}
        aria-expanded={isOpen}
        aria-label={`Dil seçimi: Şu anki dil ${activeLang.name}`}
      >
        <img
          src={activeLang.flag}
          alt={activeLang.short}
          className="lang-flag-icon"
          width="20"
          height="14"
        />
        {!compact && <span className="lang-code-text">{activeLang.short}</span>}
        <ChevronDown
          size={compact ? 12 : 14}
          className={`lang-chevron ${isOpen ? 'rotated' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Masaüstü Dropdown Menüsü */}
      {isOpen && !compact && (
        <div
          className={`lang-dropdown-menu ${align === 'left' ? 'align-left' : 'align-right'}`}
          role="listbox"
        >
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLang
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`lang-option-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setLanguage(lang.code)}
              >
                <img
                  src={lang.flag}
                  alt=""
                  className="lang-option-flag"
                  width="22"
                  height="15"
                  loading="lazy"
                />
                <span className="lang-option-name">{lang.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Mobilde Alttan Açılan Dil Listesi (Bottom Sheet) */}
      {isOpen && compact && typeof document !== 'undefined' && createPortal(
        <div className="lang-sheet-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="lang-sheet-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Dil Seçimi"
          >
            <div className="lang-sheet-handle" />
            <div className="lang-sheet-header">
              <h3 className="lang-sheet-title">Dil Seçin / Select Language</h3>
              <button
                type="button"
                className="lang-sheet-close"
                onClick={() => setIsOpen(false)}
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>
            <div className="lang-sheet-list">
              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLang
                return (
                  <button
                    key={lang.code}
                    type="button"
                    className={`lang-sheet-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setLanguage(lang.code)}
                  >
                    <img
                      src={lang.flag}
                      alt=""
                      className="lang-sheet-flag"
                      width="24"
                      height="16"
                      loading="lazy"
                    />
                    <span className="lang-sheet-name">{lang.name}</span>
                    <span className="lang-sheet-short">({lang.short})</span>
                    {isSelected && <span className="lang-sheet-check">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
