import { useState, useEffect } from 'react'
import { getInitialLang } from '../components/LanguageSwitcher.jsx'

export const DICTIONARY = {
  tr: {
    menu: 'Menü',
    story: 'Hikayemiz',
    blog: 'Blog',
    contact: 'İletişim',
    reservation: 'Rezervasyon',
    search: 'Ara',
    directions: 'Yol Tarifi',
    hoursEveryday: 'Her gün 08:30–23:00',
    callNow: 'Ara',
    callUs: 'Bizi Arayın',
    openNowUntil: 'Şu an açık · 23:00\'e kadar',
    closedNowOpens: 'Şu an kapalı · 08:30\'da açılır',
    copied: 'Kopyalandı!',
    copyAddress: 'Adresi Kopyala',
    address: 'Adres',
    phone: 'Telefon',
    hours: 'Çalışma Saatleri',
    islandNotes: 'Ada Notları',
    featuredTitle: 'Öne Çıkanlar',
    featuredKicker: '✦ MUTLAKA DENEYİN',
  },
  en: {
    menu: 'Menu',
    story: 'Our Story',
    blog: 'Blog',
    contact: 'Contact',
    reservation: 'Reservation',
    search: 'Search',
    directions: 'Directions',
    hoursEveryday: 'Every day 08:30–23:00',
    callNow: 'Call',
    callUs: 'Call Us',
    openNowUntil: 'Open now · until 23:00',
    closedNowOpens: 'Closed now · opens at 08:30',
    copied: 'Copied!',
    copyAddress: 'Copy Address',
    address: 'Address',
    phone: 'Phone',
    hours: 'Opening Hours',
    islandNotes: 'Island Notes',
    featuredTitle: 'Featured Items',
    featuredKicker: '✦ MUST TRY',
  },
}

export function useLang() {
  const [lang, setLang] = useState(() => (getInitialLang() === 'en' ? 'en' : 'tr'))

  useEffect(() => {
    const checkLang = () => {
      const current = getInitialLang() === 'en' ? 'en' : 'tr'
      setLang(current)
    }
    window.addEventListener('storage', checkLang)
    return () => window.removeEventListener('storage', checkLang)
  }, [])

  return lang
}

export function t(key, lang = null) {
  const activeLang = lang || (getInitialLang() === 'en' ? 'en' : 'tr')
  const dict = DICTIONARY[activeLang] || DICTIONARY.tr
  return dict[key] || DICTIONARY.tr[key] || key
}
