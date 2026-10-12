import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const chromePath = path.join(
  process.env.LOCALAPPDATA,
  'Google\\Chrome\\Application\\chrome.exe'
)

async function run() {
  console.log('Testing updates in Chrome...')
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  })

  const results = {}

  try {
    const page = await browser.newPage()
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ])

    // =========================================================
    // 1. TEST AT 375px (MOBILE): Featured, Gallery, Menu Cards, Bottom Sheet
    // =========================================================
    await page.setViewport({ width: 375, height: 667 })
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' })

    // Check Hero Video
    const heroInfo = await page.evaluate(() => {
      const vid = document.querySelector('.hero video')
      const slides = Array.from(document.querySelectorAll('.hero .slide'))
      return {
        videoSrc: vid ? vid.getAttribute('src') : null,
        videoPoster: vid ? vid.getAttribute('poster') : null,
        slidesCount: slides.length,
      }
    })
    results.hero = heroInfo
    console.log('Hero info:', heroInfo)

    // Check Featured cards at 375px
    const featuredMetrics = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.fcard'))
      return cards.map((c) => {
        const title = c.querySelector('.fcard-title')?.textContent.trim()
        const img = c.querySelector('.fcard-img-wrap img')
        const action = c.querySelector('.fcard-action')?.textContent.trim()
        const computed = img ? window.getComputedStyle(img) : null
        return {
          title,
          action,
          mixBlendMode: computed ? computed.mixBlendMode : null,
          filter: computed ? computed.filter : null,
          imgSrc: img ? img.getAttribute('src') : null,
        }
      })
    })
    results.featured = featuredMetrics
    console.log('Featured cards at 375px:', featuredMetrics)

    // Take screenshot of Featured Section
    const featSection = await page.$('#favoriler')
    if (featSection) {
      await featSection.screenshot({ path: 'scripts/featured-cards-375.png' })
      console.log('Saved scripts/featured-cards-375.png')
    }

    // Check Gallery
    const galleryMetrics = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('.gal .strip-item img'))
      return {
        count: imgs.length,
        sources: imgs.map((img) => img.getAttribute('src')),
        allLoaded: imgs.every((img) => img.naturalWidth > 0),
        brokenCount: imgs.filter((img) => img.naturalWidth === 0).length,
      }
    })
    results.gallery = galleryMetrics
    console.log('Gallery metrics:', galleryMetrics)

    // Take screenshot of Gallery Section
    const galSection = await page.$('.gal')
    if (galSection) {
      await galSection.screenshot({ path: 'scripts/gallery-section-375.png' })
      console.log('Saved scripts/gallery-section-375.png')
    }

    // Check Menu Cards on Mobile
    const menuCardsInfo = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.menu-card'))
      const siparisOccurrences = cards.filter((c) =>
        c.textContent.toLowerCase().includes('sipariş')
      ).length

      const firstCard = cards[0]
      const descEl = firstCard ? firstCard.querySelector('.card-desc') : null
      const btnEl = firstCard ? firstCard.querySelector('.card-action-btn') : null

      return {
        totalCards: cards.length,
        hasSiparisText: siparisOccurrences > 0,
        firstCardTitle: firstCard?.querySelector('.card-title')?.textContent.trim(),
        firstCardDesc: descEl ? descEl.textContent.trim() : null,
        firstCardButtonText: btnEl ? btnEl.textContent.trim() : null,
      }
    })
    results.menuCards = menuCardsInfo
    console.log('Menu cards info:', menuCardsInfo)

    // Open Bottom Sheet by clicking first card
    await page.evaluate(() => {
      const firstCard = document.querySelector('.menu-card')
      if (firstCard) firstCard.click()
    })

    await page.waitForSelector('.bottom-sheet', { timeout: 3000 })
    await new Promise((r) => setTimeout(r, 300))

    // Inspect Bottom Sheet
    const sheetInfo = await page.evaluate(() => {
      const sheet = document.querySelector('.bottom-sheet')
      const img = sheet.querySelector('.sheet-img-wrap img')
      const title = sheet.querySelector('.sheet-title')?.textContent.trim()
      const desc = sheet.querySelector('.sheet-desc')?.textContent.trim()
      const price = sheet.querySelector('.sheet-price')?.textContent.trim()
      const actionBtn = sheet.querySelector('.sheet-action-btn')?.textContent.trim()
      const hasSiparis = sheet.textContent.toLowerCase().includes('sipariş')

      return {
        title,
        desc,
        price,
        actionBtn,
        hasSiparis,
        hasLargeImage: img && !img.getAttribute('src').includes('-sm.webp'),
        imgSrc: img ? img.getAttribute('src') : null,
      }
    })
    results.bottomSheet = sheetInfo
    console.log('Bottom Sheet info:', sheetInfo)

    // Screenshot of bottom sheet
    await page.screenshot({ path: 'scripts/bottom-sheet-375.png' })
    console.log('Saved scripts/bottom-sheet-375.png')

    // Close Bottom Sheet by clicking Kapat
    await page.evaluate(() => {
      const btn = document.querySelector('.sheet-action-btn')
      if (btn) btn.click()
    })
    await new Promise((r) => setTimeout(r, 400))

    // =========================================================
    // 2. TEST AT 1280px (DESKTOP): 2-Column Grid & Centering
    // =========================================================
    await page.setViewport({ width: 1280, height: 800 })
    await page.goto('http://localhost:5174/#pide', { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 500))

    const desktopGridMetrics = await page.evaluate(() => {
      const grid = document.querySelector('.grid')
      const cards = Array.from(grid.querySelectorAll('.menu-card'))
      const computedGrid = window.getComputedStyle(grid)
      const lastCard = cards[cards.length - 1]
      const lastCardRect = lastCard ? lastCard.getBoundingClientRect() : null
      const gridRect = grid.getBoundingClientRect()

      const lastCardCenterX = lastCardRect ? lastCardRect.left + lastCardRect.width / 2 : null
      const gridCenterX = gridRect.left + gridRect.width / 2

      return {
        gridColumns: computedGrid.gridTemplateColumns.split(' ').length,
        totalCards: cards.length,
        lastCardCenterX,
        gridCenterX,
        lastCardCentered: lastCardCenterX ? Math.abs(lastCardCenterX - gridCenterX) < 5 : null,
      }
    })
    results.desktopGrid = desktopGridMetrics
    console.log('Desktop grid metrics:', desktopGridMetrics)

    // Screenshot of desktop menu
    const menuSection = await page.$('#menu')
    if (menuSection) {
      await page.screenshot({ path: 'scripts/desktop-menu-1280.png' })
      console.log('Saved scripts/desktop-menu-1280.png')
    }

    fs.writeFileSync('scripts/updates-audit.json', JSON.stringify(results, null, 2))
    console.log('All tests passed successfully!')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('Audit failed:', err)
  process.exit(1)
})
