// GitHub Pages (/lovemacun-menu/) veya root domain (/) altında çalışan evrensel asset URL çözümleyici
export function asset(path) {
  if (!path) return ''
  if (typeof path !== 'string') return path
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path
  }

  // GitHub Pages alt dizini tespiti
  const isGhPages =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('github.io') ||
     window.location.pathname.startsWith('/lovemacun-menu'))

  // Baştaki ./ veya . temizle
  let normalized = path.replace(/^\.\//, '')
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`
  }

  // Çift ön eklemeyi engelle
  if (normalized.startsWith('/lovemacun-menu/')) {
    return normalized
  }

  return isGhPages ? `/lovemacun-menu${normalized}` : normalized
}

export default asset

