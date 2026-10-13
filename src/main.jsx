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

// Service Worker Registration for PWA & Offline Support (Production Only)
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Dev ortamında bayat JS/CSS önbelleğini ve çakışmaları önlemek için SW kaydını kaldır
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister()
      }
    })
    if (window.caches) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key))
      })
    }
  } else if (window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => {
          console.warn('Service worker registration failed:', err)
        })
    })
  }
}

