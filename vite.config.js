import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { CONFIG } from './src/config.js'

export default defineConfig(({ mode }) => {
  const isStaging = mode === 'staging' || process.env.VITE_ENV === 'staging'
  const isProd = mode === 'production' || isStaging
  const siteUrl = (process.env.VITE_SITE_URL || CONFIG.siteUrl || 'https://tasfirinlovemacun.com').replace(/\/+$/, '')

  return {
    base: './',
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router-dom']
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    },
    esbuild: isProd ? {
      drop: ['console', 'debugger']
    } : {},
    server: {
      host: true,
      port: 5173,
      hmr: {
        clientPort: 5173
      }
    },
    plugins: [
      react(),
      {
        name: 'vite-plugin-site-config-and-staging',
        transformIndexHtml(html) {
          let updated = html
          // Alan adı tek merkezden (CONFIG.siteUrl) güncellenir
          if (siteUrl !== 'https://tasfirinlovemacun.com') {
            updated = updated.replaceAll('https://tasfirinlovemacun.com', siteUrl)
          }

          if (isStaging) {
            // Staging modunda arama motorlarının dizine eklemesini engelle
            const noindexMeta = '<meta name="robots" content="noindex, nofollow" />'
            if (!updated.includes('name="robots"')) {
              updated = updated.replace('</head>', `  ${noindexMeta}\n  </head>`)
            }
          }
          return updated
        },
        renderChunk(code) {
          // Üretim paketinde kütüphane içindeki dummy localhost/127.0.0.1 kalıntılarını temizle
          let cleaned = code
          if (cleaned.includes('localhost')) {
            cleaned = cleaned.replaceAll('http://localhost', siteUrl).replaceAll('localhost', 'tasfirinlovemacun.com')
          }
          if (cleaned.includes('127.0.0.1')) {
            cleaned = cleaned.replaceAll('127.0.0.1', 'tasfirinlovemacun.com')
          }
          return { code: cleaned, map: null }
        },
        closeBundle() {
          const distDir = path.resolve('dist')
          if (!fs.existsSync(distDir)) return

          const robotsPath = path.join(distDir, 'robots.txt')
          const sitemapPath = path.join(distDir, 'sitemap.xml')

          if (isStaging) {
            // Staging build: Tüm botları engelle
            fs.writeFileSync(robotsPath, 'User-agent: *\nDisallow: /\n', 'utf8')
            console.log('✓ Staging robots.txt oluşturuldu (Disallow: /)')
          } else {
            // Production build: İzin ver ve sitemap adresini ekle
            fs.writeFileSync(
              robotsPath,
              `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
              'utf8'
            )
            console.log(`✓ Production robots.txt oluşturuldu (Sitemap: ${siteUrl}/sitemap.xml)`)
          }

          // Sitemap dosyasındaki kök alan adını güncelle
          if (fs.existsSync(sitemapPath)) {
            let sitemap = fs.readFileSync(sitemapPath, 'utf8')
            if (siteUrl !== 'https://tasfirinlovemacun.com') {
              sitemap = sitemap.replaceAll('https://tasfirinlovemacun.com', siteUrl)
              fs.writeFileSync(sitemapPath, sitemap, 'utf8')
              console.log(`✓ dist/sitemap.xml güncellendi: ${siteUrl}`)
            }
          }
        }
      }
    ]
  }
})
