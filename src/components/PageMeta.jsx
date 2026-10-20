import { useEffect } from 'react'

export function PageMeta({ title, description, canonical, jsonLd, noindex }) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    try {
      if (title) {
        document.title = title
      }
      if (description) {
        let metaDesc = document.querySelector('meta[name="description"]')
        if (!metaDesc) {
          metaDesc = document.createElement('meta')
          metaDesc.name = 'description'
          document.head.appendChild(metaDesc)
        }
        metaDesc.content = description

        let ogDesc = document.querySelector('meta[property="og:description"]')
        if (ogDesc) ogDesc.content = description
      }
      if (canonical) {
        let linkCanonical = document.querySelector('link[rel="canonical"]')
        if (!linkCanonical) {
          linkCanonical = document.createElement('link')
          linkCanonical.rel = 'canonical'
          document.head.appendChild(linkCanonical)
        }
        linkCanonical.href = canonical

        let ogUrl = document.querySelector('meta[property="og:url"]')
        if (ogUrl) ogUrl.content = canonical
      }

      let metaRobots = document.querySelector('meta[name="robots"]')
      if (noindex) {
        if (!metaRobots) {
          metaRobots = document.createElement('meta')
          metaRobots.name = 'robots'
          document.head.appendChild(metaRobots)
        }
        metaRobots.content = 'noindex, nofollow'
      } else if (metaRobots && metaRobots.content.includes('noindex')) {
        metaRobots.remove()
      }

      // Dynamic JSON-LD update if provided
      let scriptTag = document.getElementById('page-json-ld')
      if (jsonLd) {
        if (!scriptTag) {
          scriptTag = document.createElement('script')
          scriptTag.id = 'page-json-ld'
          scriptTag.type = 'application/ld+json'
          document.head.appendChild(scriptTag)
        }
        scriptTag.text = JSON.stringify(jsonLd)
      }
    } catch (e) {
      console.warn('PageMeta update ignored:', e)
    }

    return () => {}
  }, [title, description, canonical, jsonLd])

  return null
}
