import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './polish.css'

// Google Translate & Browser Extension DOM Protection
// Prevents React from crashing when Google Translate injects <font> tags around text nodes
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (console && console.warn) {
        console.warn('Translate safe removeChild handled:', child)
      }
      return child
    }
    return originalRemoveChild.apply(this, arguments)
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console && console.warn) {
        console.warn('Translate safe insertBefore handled:', referenceNode)
      }
      return newNode
    }
    return originalInsertBefore.apply(this, arguments)
  }
}

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

