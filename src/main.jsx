import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './polish.css'

createRoot(document.getElementById('root')).render(<App />)

// Service Worker Registration for PWA & Offline Support
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Silently check for updates
        reg.onupdatefound = () => {
          const installingWorker = reg.installing
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available, reload quietly when idle
                console.log('Yeni Taş Fırın Lovemacun menü sürümü hazır.')
              }
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err)
      })
  })
}

