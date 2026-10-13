import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe')
const BASE_URL = 'http://localhost:5173'

async function run() {
  console.log('--- Starting Final Verification ---')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const results = {}

  // -------------------------------------------------------------
  // TEST 1: ANA SAYFA MASAÜSTÜ İLK EKRAN (1280x800)
  // -------------------------------------------------------------
  console.log('Testing Home 1280x800 fold...')
  const page1280 = await browser.newPage()
  await page1280.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
  await page1280.goto(BASE_URL, { waitUntil: 'networkidle0' })
  await page1280.waitForSelector('.feat-strip-section')
  await page1280.waitForSelector('.grid .menu-card')

  const home1280Metrics = await page1280.evaluate(() => {
    const hero = document.querySelector('.menu-hero-video-section')?.getBoundingClientRect()
    const featStrip = document.querySelector('.feat-strip-section')?.getBoundingClientRect()
    const featScroll = document.querySelector('.feat-strip-scroll')?.getBoundingClientRect()
    const featCards = Array.from(document.querySelectorAll('.feat-strip-card')).map(c => c.getBoundingClientRect())
    const bar = document.querySelector('.menu-bar-section')?.getBoundingClientRect()
    const menuGrid = document.querySelector('.grid')?.getBoundingClientRect()
    const firstCard = document.querySelector('.grid .menu-card')?.getBoundingClientRect()
    const firstCardImg = document.querySelector('.grid .menu-card .card-media')?.getBoundingClientRect()
    const firstCardTitle = document.querySelector('.grid .menu-card .card-title')?.getBoundingClientRect()

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      hero: { top: hero.top, bottom: hero.bottom, height: hero.height },
      featStrip: { top: featStrip.top, bottom: featStrip.bottom, height: featStrip.height, left: featStrip.left },
      featCardsCount: featCards.length,
      featCardHeight: featCards[0]?.height,
      featCardWidth: featCards[0]?.width,
      categoryBar: {
        top: bar.top,
        bottom: bar.bottom,
        height: bar.height,
        left: bar.left,
        isVisibleInFirstFold: bar.bottom <= 800
      },
      menuGrid: { left: menuGrid.left, top: menuGrid.top },
      firstCard: {
        top: firstCard.top,
        bottom: firstCard.bottom,
        cardImgTop: firstCardImg.top,
        cardImgBottom: firstCardImg.bottom,
        cardTitleTop: firstCardTitle.top,
        isCardImgVisibleInFold: firstCardImg.top < 800,
        visibleImgPixels: Math.max(0, 800 - firstCardImg.top)
      },
      alignments: {
        featScrollLeft: Math.round(featScroll.left),
        firstFeatCardLeft: Math.round(featCards[0]?.left),
        gridLeft: Math.round(menuGrid.left),
        diff: Math.abs(Math.round(featScroll.left) - Math.round(menuGrid.left))
      }
    }
  })
  results.home1280 = home1280Metrics
  await page1280.screenshot({ path: 'scripts/final-home-1280x800.png' })
  await page1280.close()

  // -------------------------------------------------------------
  // TEST 2: MOBİL ANA SAYFA (375x812)
  // -------------------------------------------------------------
  console.log('Testing Home 375px mobile...')
  const page375 = await browser.newPage()
  await page375.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page375.goto(BASE_URL, { waitUntil: 'networkidle0' })
  await page375.waitForSelector('.feat-strip-scroll')

  const home375Metrics = await page375.evaluate(() => {
    const featScroll = document.querySelector('.feat-strip-scroll')
    const langBtn = document.querySelector('.top-bar-mobile-controls .lang-trigger-btn')?.getBoundingClientRect()
    return {
      featScrollOverflowX: window.getComputedStyle(featScroll).overflowX,
      langBtnTouch: {
        width: Math.round(langBtn?.width || 0),
        height: Math.round(langBtn?.height || 0),
        meets44px: (langBtn?.width >= 44 && langBtn?.height >= 44)
      }
    }
  })
  results.home375 = home375Metrics
  await page375.screenshot({ path: 'scripts/final-home-375-fold1.png' })
  await page375.close()

  // -------------------------------------------------------------
  // TEST 3: İLETİŞİM SAYFASI HARİTA & ÇİZGİ ARTIĞI (1280px & 375px)
  // -------------------------------------------------------------
  console.log('Testing Contact map...')
  const pageContact1280 = await browser.newPage()
  await pageContact1280.setViewport({ width: 1280, height: 900 })
  await pageContact1280.goto(`${BASE_URL}/iletisim`, { waitUntil: 'networkidle0' })
  await pageContact1280.waitForSelector('.contact-page .map-container')

  const contact1280Metrics = await pageContact1280.evaluate(() => {
    const mapContainer = document.querySelector('.contact-page .map-container')?.getBoundingClientRect()
    const iframe = document.querySelector('.contact-page .map-container iframe')
    const iframeStyle = window.getComputedStyle(iframe)
    const sub = document.querySelector('.contact-page .contact-sub')?.getBoundingClientRect()
    const btn = document.querySelector('.btn-map-fullwidth')?.getBoundingClientRect()

    return {
      gap: mapContainer.top - sub.bottom,
      mapWidth: mapContainer.width,
      mapHeight: mapContainer.height,
      btnWidth: btn.width,
      iframeTop: iframeStyle.top,
      iframeHeight: iframeStyle.height
    }
  })
  results.contact1280 = contact1280Metrics
  await pageContact1280.screenshot({ path: 'scripts/final-contact-1280.png' })
  await pageContact1280.close()

  const pageContact375 = await browser.newPage()
  await pageContact375.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true })
  await pageContact375.goto(`${BASE_URL}/iletisim`, { waitUntil: 'networkidle0' })
  await pageContact375.waitForSelector('.contact-page .map-container')
  const contact375Metrics = await pageContact375.evaluate(() => {
    const mapContainer = document.querySelector('.contact-page .map-container')?.getBoundingClientRect()
    const sub = document.querySelector('.contact-page .contact-sub')?.getBoundingClientRect()
    const btn = document.querySelector('.btn-map-fullwidth')?.getBoundingClientRect()
    const iframe = document.querySelector('.contact-page .map-container iframe')
    const iframeStyle = window.getComputedStyle(iframe)
    return {
      gap: mapContainer.top - sub.bottom,
      mapWidth: mapContainer.width,
      btnWidth: btn.width,
      iframeTop: iframeStyle.top
    }
  })
  results.contact375 = contact375Metrics
  await pageContact375.screenshot({ path: 'scripts/final-contact-375.png' })
  await pageContact375.close()

  // -------------------------------------------------------------
  // TEST 4: HİKAYEMİZ İÇERİK METİNLERİ
  // -------------------------------------------------------------
  console.log('Testing Story texts...')
  const pageStory1280 = await browser.newPage()
  await pageStory1280.setViewport({ width: 1280, height: 900 })
  await pageStory1280.goto(`${BASE_URL}/hikayemiz`, { waitUntil: 'networkidle0' })
  await pageStory1280.waitForSelector('.story-page')

  const storyTexts = await pageStory1280.evaluate(() => {
    const bodyText = document.querySelector('.story-page').innerText
    const forbidden = [
      'yapay hiçbir şey giremez',
      'hijyenik koşullarda',
      'en taze ve en kaliteli olanlarından',
      'odun ateşi',
      'odun ateşinde',
      'elektrikli fırınların kolaylığına',
      'aile işletmesi',
      'Taşfırınlovemacun Ailesi'
    ]
    const foundForbidden = forbidden.filter(w => bodyText.toLowerCase().includes(w.toLowerCase()))
    return {
      foundForbidden,
      stats: Array.from(document.querySelectorAll('.about-stat-card b')).map(b => b.innerText)
    }
  })
  results.story = storyTexts
  await pageStory1280.screenshot({ path: 'scripts/final-story-1280.png' })
  await pageStory1280.close()

  // -------------------------------------------------------------
  // TEST 5: DİL SEÇİCİ & ARAPÇA (AR) / FARSÇA (FA) RTL TESTİ
  // -------------------------------------------------------------
  console.log('Testing Language switcher & RTL (AR/FA)...')
  const pageLang = await browser.newPage()
  await pageLang.setViewport({ width: 1280, height: 800 })
  await pageLang.goto(BASE_URL, { waitUntil: 'networkidle0' })

  // Check notranslate attributes
  const notranslateCheck = await pageLang.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('.card-title')).map(el => ({
      text: el.innerText.split('(')[0].trim(),
      hasNotranslate: el.classList.contains('notranslate') || el.getAttribute('translate') === 'no'
    }))
    const prices = Array.from(document.querySelectorAll('.card-price-amount')).map(el => ({
      text: el.innerText,
      hasNotranslate: el.classList.contains('notranslate') || el.getAttribute('translate') === 'no'
    }))
    return {
      titlesCount: titles.length,
      allTitlesProtected: titles.every(t => t.hasNotranslate),
      pricesCount: prices.length,
      allPricesProtected: prices.every(p => p.hasNotranslate)
    }
  })
  results.notranslate = notranslateCheck

  // Now test Arabic
  console.log('Testing Arabic (AR)...')
  await pageLang.evaluate(() => {
    document.cookie = 'googtrans=/tr/ar; path=/;'
    localStorage.setItem('lovemacun_lang', 'ar')
  })
  await pageLang.goto(BASE_URL, { waitUntil: 'networkidle0' })
  // Wait a little for translate if available
  await new Promise(r => setTimeout(r, 1500))
  const arMetrics = await pageLang.evaluate(() => {
    const htmlDir = document.documentElement.dir
    const bodyDir = document.body.dir
    const htmlDirection = window.getComputedStyle(document.documentElement).direction
    return { htmlDir, bodyDir, htmlDirection }
  })
  results.arabic = arMetrics
  await pageLang.screenshot({ path: 'scripts/final-lang-ar.png' })

  // Now test Persian (FA)
  console.log('Testing Persian (FA)...')
  await pageLang.evaluate(() => {
    document.cookie = 'googtrans=/tr/fa; path=/;'
    localStorage.setItem('lovemacun_lang', 'fa')
  })
  await pageLang.goto(BASE_URL, { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1500))
  const faMetrics = await pageLang.evaluate(() => {
    const htmlDir = document.documentElement.dir
    const bodyDir = document.body.dir
    const htmlDirection = window.getComputedStyle(document.documentElement).direction
    return { htmlDir, bodyDir, htmlDirection }
  })
  results.persian = faMetrics
  await pageLang.screenshot({ path: 'scripts/final-lang-fa.png' })

  // Reset cookie
  await pageLang.evaluate(() => {
    document.cookie = 'googtrans=/tr/tr; path=/;'
    localStorage.setItem('lovemacun_lang', 'tr')
  })
  await pageLang.close()

  // -------------------------------------------------------------
  // TEST 6: 404 SAYFASI
  // -------------------------------------------------------------
  console.log('Testing 404 page...')
  const page404 = await browser.newPage()
  await page404.setViewport({ width: 1280, height: 800 })
  await page404.goto(`${BASE_URL}/olmayan-sayfa-404-test`, { waitUntil: 'networkidle0' })
  await page404.waitForSelector('.notfound-card')
  const notFoundMetrics = await page404.evaluate(() => {
    const title = document.querySelector('.notfound-title')?.innerText
    const btn = document.querySelector('.btn-notfound-home')?.innerText
    return { title, btn }
  })
  results.notFound = notFoundMetrics
  await page404.screenshot({ path: 'scripts/final-404.png' })
  await page404.close()

  await browser.close()

  fs.writeFileSync('scripts/final-verification-report.json', JSON.stringify(results, null, 2))
  console.log('✓ All tests finished successfully. Results saved in scripts/final-verification-report.json')
}

run().catch(err => {
  console.error('Test error:', err)
  process.exit(1)
})
