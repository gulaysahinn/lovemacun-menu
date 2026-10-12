import { useEffect, useRef, useState } from 'react'

export function HeroVideo({
  baseName = 'lahmacun',
  poster = `/video/${baseName}-poster.webp`,
  alt = 'Taş Fırın Lovemacun',
  className = '',
}) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  )

  useEffect(() => {
    // 1. Check data-saver and reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const saveData =
      typeof navigator !== 'undefined' &&
      (navigator.connection?.saveData === true)

    if (prefersReducedMotion || saveData) {
      // Do not load video at all, stay on poster
      return
    }

    // 2. Track mobile viewport for source selection
    const mql = window.matchMedia('(max-width: 768px)')
    const handleMql = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', handleMql)

    // 3. Defer video loading so menu and crucial visuals render first
    let timerId = null
    const deferLoad = () => {
      timerId = setTimeout(() => {
        setShouldLoadVideo(true)
      }, 150)
    }

    if (document.readyState === 'complete') {
      deferLoad()
    } else {
      window.addEventListener('load', deferLoad, { once: true })
    }

    return () => {
      mql.removeEventListener('change', handleMql)
      if (timerId) clearTimeout(timerId)
    }
  }, [])

  // 4. Pause when out of view or tab is hidden
  useEffect(() => {
    if (!shouldLoadVideo) return

    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    let isIntersecting = true

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting
          if (entry.isIntersecting) {
            if (!document.hidden) {
              video.play().catch(() => {})
            }
          } else {
            video.pause()
          }
        })
      },
      { threshold: 0.15 }
    )

    observer.observe(container)

    const handleVisibility = () => {
      if (document.hidden) {
        video.pause()
      } else if (isIntersecting) {
        video.play().catch(() => {})
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [shouldLoadVideo])

  const suffix = isMobile ? '540p' : '720p'
  const webmSrc = `/video/${baseName}-${suffix}.webm`
  const mp4Src = `/video/${baseName}-${suffix}.mp4`

  return (
    <div ref={containerRef} className={`hero-video-container ${className}`}>
      {/* Poster image: always visible initially, smooth transition once video plays */}
      <img
        src={poster}
        alt={alt}
        className={`hero-video-poster ${videoReady ? 'fade-out' : ''}`}
        fetchPriority="high"
        loading="eager"
      />

      {shouldLoadVideo && (
        <video
          ref={videoRef}
          key={`${baseName}-${suffix}`}
          className={`hero-video-element ${videoReady ? 'video-active' : ''}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          onPlaying={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
        >
          <source src={webmSrc} type="video/webm" />
          <source src={mp4Src} type="video/mp4" />
        </video>
      )}
    </div>
  )
}
