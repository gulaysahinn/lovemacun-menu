import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const artifactDir = 'C:/Users/gulay/.gemini/antigravity-ide/brain/9c4e802a-6572-41e5-8c68-9a228c962856'
const baseUrl = 'http://localhost:5173'
const CHROME_PATH = path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe')

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const results = {
    measurements: {},
    pwa: {},
    screens: []
  }

  try {
    const page = await browser.newPage()
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()))
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message))

    // -------------------------------------------------------------
    // TEST 1: Mobil 375x812 Görünümü ve Ölçümleri
    // -------------------------------------------------------------
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.goto(baseUrl + '/', { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1200))

    // Ölçümler: 375x812
    const mobileMetrics = await page.evaluate(() => {
      const header = document.querySelector('.mobile-app-header')
      const tabBar = document.querySelector('.mobile-tab-bar')
      const hero = document.querySelector('.menu-hero-video-section')
      const featStrip = document.querySelector('.feat-strip-section')
      const catBar = document.querySelector('.menu-bar-section')
      const tabItems = Array.from(document.querySelectorAll('.mobile-tab-item')).map((el) => {
        const r = el.getBoundingClientRect()
        return { width: Math.round(r.width), height: Math.round(r.height) }
      })

      const hr = header ? header.getBoundingClientRect() : null
      const tr = tabBar ? tabBar.getBoundingClientRect() : null
      const heror = hero ? hero.getBoundingClientRect() : null
      const featr = featStrip ? featStrip.getBoundingClientRect() : null
      const catr = catBar ? catBar.getBoundingClientRect() : null

      return {
        header: hr ? { width: Math.round(hr.width), height: Math.round(hr.height), top: Math.round(hr.top) } : null,
        tabBar: tr ? { width: Math.round(tr.width), height: Math.round(tr.height), bottom: Math.round(tr.bottom) } : null,
        tabItems,
        hero: heror ? { width: Math.round(heror.width), height: Math.round(heror.height), vhPct: Math.round((heror.height / 812) * 100) } : null,
        featStrip: featr ? { top: Math.round(featr.top), height: Math.round(featr.height), visibleInFold: featr.top < 812 } : null,
        catBar: catr ? { top: Math.round(catr.top), height: Math.round(catr.height), visibleInFold: catr.top < 812 } : null,
        desktopHeaderVisible: document.querySelector('.desktop-only') ? window.getComputedStyle(document.querySelector('.desktop-only')).display !== 'none' : false,
      }
    })

    results.measurements.mobile = mobileMetrics

    // Ekran Görüntüsü 1: Menü İlk Ekranı (375x812)
    const p1 = path.join(artifactDir, 'pwa-01-menu-first-screen-375.png')
    await page.screenshot({ path: p1 })
    results.screens.push({ id: 'pwa-01-menu-first-screen-375', path: p1 })

    // Ekran Görüntüsü 2: BottomSheet Açık
    // İlk menü kartına tıkla
    await page.waitForSelector('.menu-card')
    await page.click('.menu-card')
    await new Promise((r) => setTimeout(r, 600))
    const p2 = path.join(artifactDir, 'pwa-02-bottom-sheet-375.png')
    await page.screenshot({ path: p2 })
    results.screens.push({ id: 'pwa-02-bottom-sheet-375', path: p2 })

    // "Listeme Ekle" butonuna tıkla ve sheet'i kapat
    const addBtn = await page.$('.sheet-btn-add')
    if (addBtn) {
      await addBtn.click()
      await new Promise((r) => setTimeout(r, 300))
    }
    const closeSheetBtn = await page.$('.sheet-close')
    if (closeSheetBtn) {
      await closeSheetBtn.click()
    } else {
      await page.keyboard.press('Escape')
    }
    await new Promise((r) => setTimeout(r, 500))

    // Ekran Görüntüsü 3: Listem Paneli Açık
    // Tab bar'daki Listem butonuna tıkla
    await page.click('.tab-listem')
    await new Promise((r) => setTimeout(r, 600))
    const p3 = path.join(artifactDir, 'pwa-03-listem-drawer-375.png')
    await page.screenshot({ path: p3 })
    results.screens.push({ id: 'pwa-03-listem-drawer-375', path: p3 })

    // Listem drawer'ı kapat
    const closeListBtn = await page.$('.list-drawer-close')
    if (closeListBtn) {
      await closeListBtn.click()
    } else {
      await page.keyboard.press('Escape')
    }
    await new Promise((r) => setTimeout(r, 500))

    // Ekran Görüntüsü 4: Bilgi Ekranı Açık
    // Tab bar'daki Bilgi butonuna tıkla
    await page.click('.mobile-tab-item:last-child')
    await new Promise((r) => setTimeout(r, 600))
    const p4 = path.join(artifactDir, 'pwa-04-bilgi-drawer-375.png')
    await page.screenshot({ path: p4 })
    results.screens.push({ id: 'pwa-04-bilgi-drawer-375', path: p4 })

    // Bilgi drawer'ı kapat
    await page.keyboard.press('Escape')
    await new Promise((r) => setTimeout(r, 500))

    // Ekran Görüntüsü 5: Blog Listesi (/blog) (375x812)
    await page.goto(baseUrl + '/blog', { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 800))
    const p5 = path.join(artifactDir, 'pwa-05-blog-list-375.png')
    await page.screenshot({ path: p5 })
    results.screens.push({ id: 'pwa-05-blog-list-375', path: p5 })

    // Ekran Görüntüsü 6: Blog Yazı Detayı (375x812)
    await page.goto(baseUrl + '/buyukadada-ezber-bozan-bir-lezzet-tasfirinlovemacun', { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 800))
    const p6 = path.join(artifactDir, 'pwa-06-blog-post-375.png')
    await page.screenshot({ path: p6 })
    results.screens.push({ id: 'pwa-06-blog-post-375', path: p6 })

    // Blog meta ve JSON-LD kontrolü
    const blogMeta = await page.evaluate(() => {
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')
      const jsonLdEl = document.querySelector('script[id="page-json-ld"]') || document.querySelector('script[type="application/ld+json"]')
      const jsonLd = jsonLdEl ? jsonLdEl.textContent : ''
      return {
        title: document.title,
        canonical,
        jsonLdValid: !!jsonLd && jsonLd.includes('Article')
      }
    })
    results.blogMeta = blogMeta

    // -------------------------------------------------------------
    // TEST 2: Masaüstü 1280x800 Doğrulama (Masaüstü bozulmamalı)
    // -------------------------------------------------------------
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false })
    await page.goto(baseUrl + '/', { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1000))

    const desktopMetrics = await page.evaluate(() => {
      const topBarWrapper = document.querySelector('.desktop-header-wrapper')
      const topBar = document.querySelector('.top-bar')
      const mobileHeader = document.querySelector('.mobile-app-header')
      const mobileTabBar = document.querySelector('.mobile-tab-bar')
      const footer = document.querySelector('.site-footer')

      return {
        desktopHeaderVisible: topBarWrapper ? window.getComputedStyle(topBarWrapper).display !== 'none' : false,
        topBarVisible: topBar ? window.getComputedStyle(topBar).display !== 'none' : false,
        mobileHeaderHidden: mobileHeader ? window.getComputedStyle(mobileHeader).display === 'none' : true,
        mobileTabBarHidden: mobileTabBar ? window.getComputedStyle(mobileTabBar).display === 'none' : true,
        footerVisible: footer ? window.getComputedStyle(footer).display !== 'none' : false
      }
    })
    results.measurements.desktop = desktopMetrics

    const p7 = path.join(artifactDir, 'pwa-07-desktop-home-1280.png')
    await page.screenshot({ path: p7 })
    results.screens.push({ id: 'pwa-07-desktop-home-1280', path: p7 })

    // Masaüstü Blog Listesi
    await page.goto(baseUrl + '/blog', { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 800))
    const p8 = path.join(artifactDir, 'pwa-08-desktop-blog-1280.png')
    await page.screenshot({ path: p8 })
    results.screens.push({ id: 'pwa-08-desktop-blog-1280', path: p8 })

    // Masaüstü Blog Post
    await page.goto(baseUrl + '/buyukadada-ezber-bozan-bir-lezzet-tasfirinlovemacun', { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 800))
    const p9 = path.join(artifactDir, 'pwa-09-desktop-post-1280.png')
    await page.screenshot({ path: p9 })
    results.screens.push({ id: 'pwa-09-desktop-post-1280', path: p9 })

    // -------------------------------------------------------------
    // TEST 3: PWA Manifest & Service Worker Doğrulama
    // -------------------------------------------------------------
    try {
      const manifestRaw = fs.readFileSync('c:/reactprojes/lovemacun-menu/public/manifest.webmanifest', 'utf-8')
      const parsedManifest = JSON.parse(manifestRaw)
      results.pwa.manifestValid = true
      results.pwa.name = parsedManifest.name
      results.pwa.short_name = parsedManifest.short_name
      results.pwa.display = parsedManifest.display
      results.pwa.start_url = parsedManifest.start_url
      results.pwa.theme_color = parsedManifest.theme_color
      results.pwa.iconsCount = parsedManifest.icons.length
    } catch (err) {
      results.pwa.manifestValid = false
      results.pwa.error = err.message
    }

    // Service worker varlığı kontrolü
    const swExists = fs.existsSync('c:/reactprojes/lovemacun-menu/public/sw.js')
    results.pwa.swExists = swExists

    fs.writeFileSync('scripts/pwa-verification-report.json', JSON.stringify(results, null, 2))
  } finally {
    await browser.close()
  }

  console.log(JSON.stringify(results, null, 2))
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
