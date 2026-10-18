import { useState, useEffect } from 'react'
import { CONFIG } from './config.js'

export { CONFIG }

export const INFO = {
  name: CONFIG.name,
  address: CONFIG.address,
  phone: CONFIG.phonePrimary.raw,
  phoneTel: CONFIG.phonePrimary.tel,
  phoneText: CONFIG.phonePrimary.display,
  phoneSecondaryTel: CONFIG.phoneSecondary.tel,
  phoneSecondaryText: CONFIG.phoneSecondary.display,
  hours: CONFIG.hours,
  instagram: CONFIG.instagram,
  mapsDirectionsUrl: CONFIG.mapsDirectionsUrl,
  mapsEmbedUrl: CONFIG.mapsEmbedUrl,
}

// Sadece iştah açıcı gerçek yemek fotoğrafları (insan veya yazılı afiş yok)
export const GALLERY = [
  '/img/lahmacun/lovemacunn-restaurant-kebapli-lahmacun-400x400.webp',
  '/img/pide/lovemacunn-restaurant-kiymali-kasarli-400x400.webp',
  '/img/et/lovemacunn-restaurant-iskender-400x400.webp',
  '/img/tatlilar/lovemacunn-restaurant-kunefe-400x400.webp',
  '/img/baliklar/lovemacunn-restaurant-levrek-400x400.webp',
  '/img/pizza/lovemacunn-restaurant-karisik-pizza-400x400.webp',
  '/img/et/lovemacunn-restaurant-adana-kebap-400x400.webp',
  '/img/pide/lovemacunn-restaurant-kusbasi-kasar-400x400.webp',
  '/img/tatlilar/lovemacunn-restaurant-baklava-400x400.webp',
  '/img/baliklar/lovemacunn-restaurant-kalamar-400x400.webp',
  '/img/makarnalar/lovemacunn-restaurant-fettucine-400x400.webp',
]

export const HERO = [
  '/img/lahmacun-hero.webp',
  '/img/pide/lovemacunn-restaurant-kiymali-kasarli-400x400.webp',
  '/img/et/lovemacunn-restaurant-iskender-400x400.webp',
]

const MENU_CACHE_KEY = 'lovemacun_menu_cache_v2'

export function transformMenuData(data) {
  if (!data || !data.items || !data.categories) {
    return {
      cats: [],
      featured: [],
      tags: { sef: [], aci: [], vejetaryen: [], vegan: [], glutensiz: [] },
      items: [],
      version: null,
    }
  }
  const visibleItems = (data.items || []).filter((it) => !it.hidden)

  const cats = (data.categories || []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    emoji: cat.emoji,
    items: visibleItems.filter((it) => it.category === cat.id),
  }))

  const featured = visibleItems
    .filter((it) => it.featuredOrder && it.featuredOrder > 0)
    .sort((a, b) => a.featuredOrder - b.featuredOrder)
    .map((it) => it.name)

  const tags = {
    sef: visibleItems.filter((it) => it.tags && it.tags.includes('sef')).map((it) => it.name),
    aci: visibleItems.filter((it) => it.tags && it.tags.includes('aci')).map((it) => it.name),
    vejetaryen: visibleItems.filter((it) => it.tags && it.tags.includes('vejetaryen')).map((it) => it.name),
    vegan: visibleItems.filter((it) => it.tags && it.tags.includes('vegan')).map((it) => it.name),
    glutensiz: visibleItems.filter((it) => it.tags && it.tags.includes('glutensiz')).map((it) => it.name),
  }

  return { cats, featured, tags, items: visibleItems, version: data.version }
}

function getInitialStore() {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(MENU_CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        return transformMenuData(parsed)
      }
    } catch {}
  }
  return {
    cats: [],
    featured: [],
    tags: { sef: [], aci: [], vejetaryen: [], vegan: [], glutensiz: [] },
    items: [],
    version: null,
  }
}

let currentStore = getInitialStore()
const listeners = new Set()

export const CATS = [...currentStore.cats]
export const FEATURED = [...currentStore.featured]
export const TAGS = { ...currentStore.tags }

function syncExports(transformed) {
  currentStore = transformed
  CATS.length = 0
  CATS.push(...transformed.cats)

  FEATURED.length = 0
  FEATURED.push(...transformed.featured)

  TAGS.sef = transformed.tags.sef
  TAGS.aci = transformed.tags.aci
  TAGS.vejetaryen = transformed.tags.vejetaryen
  TAGS.vegan = transformed.tags.vegan
  TAGS.glutensiz = transformed.tags.glutensiz

  listeners.forEach((fn) => {
    try {
      fn(transformed)
    } catch {}
  })
}

export function subscribeMenu(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

let inFlightFetch = null
let _isOfflineStale = false

export function isOfflineStale() {
  return _isOfflineStale
}

export async function loadMenuFromNetwork() {
  if (inFlightFetch) return inFlightFetch

  const fetchPromise = (async () => {
    try {
      const res = await fetch('/data/menu.json', {
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      })

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`)
      }

      const rawJson = await res.json()
      const transformed = transformMenuData(rawJson)

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            MENU_CACHE_KEY,
            JSON.stringify({ raw: rawJson, savedAt: Date.now() })
          )
        } catch {}
      }

      _isOfflineStale = false
      syncExports(transformed)
      return transformed
    } catch (err) {
      console.warn('Network fetch for /data/menu.json failed, falling back to cache:', err)
      // Çevrimdışı / LocalStorage yedeği
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(MENU_CACHE_KEY)
          if (cached) {
            const parsed = JSON.parse(cached)
            const rawData = parsed.raw || parsed
            const savedAt = parsed.savedAt || 0
            const ONE_DAY_MS = 24 * 60 * 60 * 1000

            if (savedAt > 0 && Date.now() - savedAt > ONE_DAY_MS) {
              _isOfflineStale = true
            }

            const fallback = transformMenuData(rawData)
            syncExports(fallback)
            return fallback
          }
        } catch {}
      }
      throw err
    } finally {
      inFlightFetch = null
    }
  })()

  inFlightFetch = fetchPromise
  return fetchPromise
}

// Automatically trigger initial fetch on client side
if (typeof window !== 'undefined') {
  loadMenuFromNetwork().catch(() => {})
}

export function useMenuData() {
  const [data, setData] = useState(() => currentStore)
  const [loading, setLoading] = useState(() => currentStore.items.length === 0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeMenu((newData) => {
      setData(newData)
      setLoading(false)
    })

    if (currentStore.items.length === 0) {
      setLoading(true)
    }

    loadMenuFromNetwork()
      .then((newData) => {
        setData(newData)
        setLoading(false)
      })
      .catch((err) => {
        if (currentStore.items.length === 0) {
          setError(err)
        }
        setLoading(false)
      })

    return unsubscribe
  }, [])

  return {
    cats: data.cats,
    featured: data.featured,
    tags: data.tags,
    items: data.items,
    version: data.version,
    loading,
    error,
    offlineStale: _isOfflineStale,
    reloadMenu: loadMenuFromNetwork,
  }
}
