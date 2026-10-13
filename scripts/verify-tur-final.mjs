import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CHROME_PATH_ALT = 'C:\\Users\\gulay\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : CHROME_PATH_ALT

const SCREENSHOTS_DIR = path.resolve('screenshots')
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
}

const BASE_URL = 'http://localhost:5173'

async function runAudit() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const results = {
    mobile375x640: {},
    mobile360x700: {},
    mobile320x568: {},
    tablet768: {},
    desktop1024: {},
    desktop1280: {},
    desktop1366: {},
    desktop1440: {},
    desktop1920: {},
    screenshots: []
  }

  const page = await browser.newPage()

  // -------------------------------------------------------------------------
  // 1. MOBILE 375x640
  // -------------------------------------------------------------------------
  console.log('Testing 375x640...')
  await page.setViewport({ width: 375, height: 640, deviceScaleFactor: 2 })
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.mobile-app-header')

  // Measure first fold
  const m375FirstFold = await page.evaluate(() => {
    const header = document.querySelector('.mobile-app-header')?.getBoundingClientRect()
    const tabBar = document.querySelector('.mobile-tab-bar')?.getBoundingClientRect()
    const hero = document.querySelector('.menu-hero-video-section')?.getBoundingClientRect()
    const strip = document.querySelector('.feat-strip-section')?.getBoundingClientRect()
    const catBar = document.querySelector('.menu-bar-section')?.getBoundingClientRect()
    const firstProductImg = document.querySelector('.card-media')?.getBoundingClientRect()
    const titleSparkle = document.querySelector('.feat-strip-sparkle')?.getBoundingClientRect()
    const titleText = document.querySelector('.feat-strip-title-text')?.getBoundingClientRect()
    const firstStripCard = document.querySelector('.feat-strip-card')?.getBoundingClientRect()
    const firstStripPrice = document.querySelector('.feat-strip-card .feat-strip-price')?.getBoundingClientRect()

    const usableTop = header ? header.bottom : 56
    const usableBottom = tabBar ? tabBar.top : 584
    const firstImgVisiblePx = firstProductImg ? Math.max(0, Math.min(firstProductImg.bottom, usableBottom) - Math.max(firstProductImg.top, usableTop)) : 0

    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      header: header ? { height: header.height, bottom: header.bottom } : null,
      tabBar: tabBar ? { height: tabBar.height, top: tabBar.top } : null,
      hero: hero ? { height: hero.height, top: hero.top, bottom: hero.bottom } : null,
      strip: strip ? { height: strip.height, top: strip.top, bottom: strip.bottom } : null,
      firstStripPriceBottom: firstStripPrice ? firstStripPrice.bottom : null,
      catBar: catBar ? { height: catBar.height, top: catBar.top, bottom: catBar.bottom } : null,
      gapBetweenCardAndCatBar: (catBar && firstStripCard) ? (catBar.top - firstStripCard.bottom) : null,
      firstImgVisiblePx,
      sparkleAndTitleGap: (titleSparkle && titleText) ? (titleText.left - titleSparkle.right) : null
    }
  })
  results.mobile375x640.firstFold = m375FirstFold
  const file375Fold = path.join(SCREENSHOTS_DIR, '375x640-01-menu-first-fold.png')
  await page.screenshot({ path: file375Fold })
  results.screenshots.push('screenshots/375x640-01-menu-first-fold.png')

  // Hamburger Kapalı screenshot
  const file375HbgClosed = path.join(SCREENSHOTS_DIR, '375x640-02-hamburger-closed.png')
  await page.screenshot({ path: file375HbgClosed })
  results.screenshots.push('screenshots/375x640-02-hamburger-closed.png')

  // Open Hamburger Drawer
  await page.click('.mobile-app-hamburger-btn')
  await new Promise((r) => setTimeout(r, 350))
  await page.waitForSelector('.hbg-drawer-panel')

  const m375Drawer = await page.evaluate(() => {
    const panel = document.querySelector('.hbg-drawer-panel')?.getBoundingClientRect()
    const navItems = Array.from(document.querySelectorAll('.hbg-nav-item')).map((el) => {
      const r = el.getBoundingClientRect()
      return { text: el.innerText.trim().split('\n')[0], height: r.height }
    })
    const langPills = Array.from(document.querySelectorAll('.hbg-lang-pill')).map((el) => {
      const r = el.getBoundingClientRect()
      return { code: el.innerText.trim(), height: r.height, isSelected: el.classList.contains('selected') }
    })
    const closeBtn = document.querySelector('.hbg-drawer-close-btn')?.getBoundingClientRect()
    const searchBtn = document.querySelector('.btn-hbg-search')?.getBoundingClientRect()
    const routeBtn = document.querySelector('.btn-hbg-route')?.getBoundingClientRect()
    const contacts = Array.from(document.querySelectorAll('.hbg-contact-row')).map((el) => el.innerText.trim())
    const hours = document.querySelector('.hbg-drawer-footer')?.innerText.trim()

    return {
      panelWidth: panel ? panel.width : null,
      closeBtnSize: closeBtn ? { width: closeBtn.width, height: closeBtn.height } : null,
      navItems,
      langCount: langPills.length,
      searchBtnSize: searchBtn ? { width: searchBtn.width, height: searchBtn.height } : null,
      routeBtnSize: routeBtn ? { width: routeBtn.width, height: routeBtn.height } : null,
      contacts,
      hours,
      bodyOverflow: document.body.style.overflow
    }
  })
  results.mobile375x640.drawer = m375Drawer
  const file375HbgOpen = path.join(SCREENSHOTS_DIR, '375x640-03-hamburger-open.png')
  await page.screenshot({ path: file375HbgOpen })
  results.screenshots.push('screenshots/375x640-03-hamburger-open.png')

  // Close drawer
  await page.click('.hbg-drawer-close-btn')
  await new Promise((r) => setTimeout(r, 350))

  // Go to blog post page and measure ending
  await page.goto(`${BASE_URL}/buyukadada-ezber-bozan-bir-lezzet-tasfirinlovemacun`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await new Promise((r) => setTimeout(r, 400))

  const m375BlogPostEnd = await page.evaluate(() => {
    const heroMedia = document.querySelector('.post-hero-media')
    const heroImg = document.querySelector('.post-featured-img')
    const promoCard = document.querySelector('.post-actions-card')
    const instaLink = document.querySelector('.post-insta-link')
    const promoBtns = document.querySelector('.post-actions-btns')

    const heroImgStyle = heroImg ? window.getComputedStyle(heroImg) : null
    const promoCardStyle = promoCard ? window.getComputedStyle(promoCard) : null
    const promoCardRect = promoCard ? promoCard.getBoundingClientRect() : null
    const instaRect = instaLink ? instaLink.getBoundingClientRect() : null

    return {
      heroMarginBottom: heroMedia ? window.getComputedStyle(heroMedia).marginBottom : null,
      heroBorderRadius: heroImgStyle ? heroImgStyle.borderRadius : null,
      promoCard: {
        padding: promoCardStyle ? promoCardStyle.padding : null,
        borderRadius: promoCardStyle ? promoCardStyle.borderRadius : null,
        border: promoCardStyle ? promoCardStyle.border : null,
        background: promoCardStyle ? promoCardStyle.backgroundColor : null,
        width: promoCardRect ? promoCardRect.width : null
      },
      instaLinkText: instaLink ? instaLink.innerText.trim() : null,
      promoBtnsFlexDir: promoBtns ? window.getComputedStyle(promoBtns).flexDirection : null,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }
  })
  results.mobile375x640.blogPostEnd = m375BlogPostEnd
  const file375BlogEnd = path.join(SCREENSHOTS_DIR, '375x640-04-blog-post-end.png')
  await page.screenshot({ path: file375BlogEnd })
  results.screenshots.push('screenshots/375x640-04-blog-post-end.png')

  // -------------------------------------------------------------------------
  // 2. MOBILE 360x700
  // -------------------------------------------------------------------------
  console.log('Testing 360x700...')
  await page.setViewport({ width: 360, height: 700, deviceScaleFactor: 2 })
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.mobile-app-header')

  const m360FirstFold = await page.evaluate(() => {
    const header = document.querySelector('.mobile-app-header')?.getBoundingClientRect()
    const tabBar = document.querySelector('.mobile-tab-bar')?.getBoundingClientRect()
    const hero = document.querySelector('.menu-hero-video-section')?.getBoundingClientRect()
    const strip = document.querySelector('.feat-strip-section')?.getBoundingClientRect()
    const catBar = document.querySelector('.menu-bar-section')?.getBoundingClientRect()
    const firstProductImg = document.querySelector('.card-media')?.getBoundingClientRect()
    const firstStripCard = document.querySelector('.feat-strip-card')?.getBoundingClientRect()

    const usableTop = header ? header.bottom : 56
    const usableBottom = tabBar ? tabBar.top : 644
    const firstImgVisiblePx = firstProductImg ? Math.max(0, Math.min(firstProductImg.bottom, usableBottom) - Math.max(firstProductImg.top, usableTop)) : 0

    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      heroHeight: hero ? hero.height : null,
      stripHeight: strip ? strip.height : null,
      gapBetweenCardAndCatBar: (catBar && firstStripCard) ? (catBar.top - firstStripCard.bottom) : null,
      catBarTop: catBar ? catBar.top : null,
      firstImgVisiblePx
    }
  })
  results.mobile360x700.firstFold = m360FirstFold
  const file360Fold = path.join(SCREENSHOTS_DIR, '360x700-01-menu-first-fold.png')
  await page.screenshot({ path: file360Fold })
  results.screenshots.push('screenshots/360x700-01-menu-first-fold.png')

  // Open Hamburger
  await page.click('.mobile-app-hamburger-btn')
  await new Promise((r) => setTimeout(r, 350))
  const file360HbgOpen = path.join(SCREENSHOTS_DIR, '360x700-02-hamburger-open.png')
  await page.screenshot({ path: file360HbgOpen })
  results.screenshots.push('screenshots/360x700-02-hamburger-open.png')

  // Close and go to blog post end
  await page.click('.hbg-drawer-close-btn')
  await new Promise((r) => setTimeout(r, 350))
  await page.goto(`${BASE_URL}/buyukadada-ezber-bozan-bir-lezzet-tasfirinlovemacun`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await new Promise((r) => setTimeout(r, 400))
  const file360BlogEnd = path.join(SCREENSHOTS_DIR, '360x700-03-blog-post-end.png')
  await page.screenshot({ path: file360BlogEnd })
  results.screenshots.push('screenshots/360x700-03-blog-post-end.png')

  // -------------------------------------------------------------------------
  // 3. MOBILE 320x568
  // -------------------------------------------------------------------------
  console.log('Testing 320x568...')
  await page.setViewport({ width: 320, height: 568, deviceScaleFactor: 2 })
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.mobile-app-header')

  const m320FirstFold = await page.evaluate(() => {
    const titleEl = document.querySelector('.mobile-app-title')
    const brandEl = document.querySelector('.mobile-app-brand')
    const titleStyle = titleEl ? window.getComputedStyle(titleEl) : null
    const titleRect = titleEl ? titleEl.getBoundingClientRect() : null

    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      titleWidth: titleRect ? titleRect.width : null,
      textOverflow: titleStyle ? titleStyle.textOverflow : null,
      whiteSpace: titleStyle ? titleStyle.whiteSpace : null
    }
  })
  results.mobile320x568.firstFold = m320FirstFold
  const file320Fold = path.join(SCREENSHOTS_DIR, '320x568-01-menu-first-fold.png')
  await page.screenshot({ path: file320Fold })
  results.screenshots.push('screenshots/320x568-01-menu-first-fold.png')

  // Open Hamburger at 320px
  await page.click('.mobile-app-hamburger-btn')
  await new Promise((r) => setTimeout(r, 350))
  const file320HbgOpen = path.join(SCREENSHOTS_DIR, '320x568-02-hamburger-open.png')
  await page.screenshot({ path: file320HbgOpen })
  results.screenshots.push('screenshots/320x568-02-hamburger-open.png')

  await page.click('.hbg-drawer-close-btn')
  await new Promise((r) => setTimeout(r, 350))
  await page.goto(`${BASE_URL}/buyukadada-ezber-bozan-bir-lezzet-tasfirinlovemacun`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await new Promise((r) => setTimeout(r, 400))
  const file320BlogEnd = path.join(SCREENSHOTS_DIR, '320x568-03-blog-post-end.png')
  await page.screenshot({ path: file320BlogEnd })
  results.screenshots.push('screenshots/320x568-03-blog-post-end.png')

  // -------------------------------------------------------------------------
  // 4. TABLET 768px & 1024px
  // -------------------------------------------------------------------------
  for (const width of [768, 1024]) {
    console.log(`Testing ${width}px...`)
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1.5 })
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' })
    await page.waitForSelector('.top-bar')

    const tabHeader = await page.evaluate(() => {
      const topBar = document.querySelector('.top-bar')?.getBoundingClientRect()
      const tabletHbg = document.querySelector('.top-bar-tablet-hamburger')?.getBoundingClientRect()
      const desktopLinks = document.querySelector('.top-bar-links.desktop-only')
      const desktopActions = document.querySelector('.top-bar-actions.desktop-only')

      const linksDisplay = desktopLinks ? window.getComputedStyle(desktopLinks).display : 'none'
      const actionsDisplay = desktopActions ? window.getComputedStyle(desktopActions).display : 'none'
      const hbgDisplay = tabletHbg ? 'flex' : 'none'

      return {
        topBarHeight: topBar ? topBar.height : null,
        tabletHbgSize: tabletHbg ? { width: tabletHbg.width, height: tabletHbg.height } : null,
        linksDisplay,
        actionsDisplay,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      }
    })
    results[`tablet${width}`] = { header: tabHeader }
    const fileTabHeader = path.join(SCREENSHOTS_DIR, `${width}px-01-header-tablet.png`)
    await page.screenshot({ path: fileTabHeader })
    results.screenshots.push(`screenshots/${width}px-01-header-tablet.png`)

    // Open drawer on tablet
    await page.click('.top-bar-tablet-hamburger')
    await new Promise((r) => setTimeout(r, 350))
    const fileTabDrawer = path.join(SCREENSHOTS_DIR, `${width}px-02-hamburger-open.png`)
    await page.screenshot({ path: fileTabDrawer })
    results.screenshots.push(`screenshots/${width}px-02-hamburger-open.png`)

    // Close and view blog page
    await page.click('.hbg-drawer-close-btn')
    await new Promise((r) => setTimeout(r, 350))
    await page.goto(`${BASE_URL}/blog`, { waitUntil: 'networkidle0' })
    const fileTabBlog = path.join(SCREENSHOTS_DIR, `${width}px-03-blog-page.png`)
    await page.screenshot({ path: fileTabBlog })
    results.screenshots.push(`screenshots/${width}px-03-blog-page.png`)
  }

  // -------------------------------------------------------------------------
  // 5. DESKTOP 1280px, 1366px, 1440px, 1920px
  // -------------------------------------------------------------------------
  for (const width of [1280, 1366, 1440, 1920]) {
    console.log(`Testing ${width}px...`)
    await page.setViewport({ width, height: 800, deviceScaleFactor: 1.5 })
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' })
    await page.waitForSelector('.top-bar')

    const dMetrics = await page.evaluate(() => {
      const brand = document.querySelector('.top-bar-brand')?.getBoundingClientRect()
      const brandName = document.querySelector('.top-bar-brand .brand-name')
      const links = document.querySelector('.top-bar-links.desktop-only')?.getBoundingClientRect()
      const actions = document.querySelector('.top-bar-actions.desktop-only')?.getBoundingClientRect()
      const hours = document.querySelector('.top-bar-hours')
      const routeBtn = document.querySelector('.btn-top-route')
      const tabletHbg = document.querySelector('.top-bar-tablet-hamburger')

      const hoursDisplay = hours ? window.getComputedStyle(hours).display : 'none'
      const tabletHbgDisplay = tabletHbg ? window.getComputedStyle(tabletHbg).display : 'none'
      const brandWhiteSp = brandName ? window.getComputedStyle(brandName).whiteSpace : null
      const routeWhiteSp = routeBtn ? window.getComputedStyle(routeBtn).whiteSpace : null

      return {
        brand: brand ? { width: brand.width, height: brand.height } : null,
        links: links ? { width: links.width, height: links.height } : null,
        actions: actions ? { width: actions.width, height: actions.height } : null,
        hoursDisplay,
        tabletHbgDisplay,
        brandWhiteSp,
        routeWhiteSp,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      }
    })
    results[`desktop${width}`] = dMetrics

    const fileDHeader = path.join(SCREENSHOTS_DIR, `${width}px-01-header.png`)
    await page.screenshot({ path: fileDHeader })
    results.screenshots.push(`screenshots/${width}px-01-header.png`)

    if (width === 1280 || width === 1440) {
      await page.goto(`${BASE_URL}/blog`, { waitUntil: 'networkidle0' })
      const fileDBlog = path.join(SCREENSHOTS_DIR, `${width}px-02-blog-list.png`)
      await page.screenshot({ path: fileDBlog })
      results.screenshots.push(`screenshots/${width}px-02-blog-list.png`)

      await page.goto(`${BASE_URL}/buyukadada-ezber-bozan-bir-lezzet-tasfirinlovemacun`, { waitUntil: 'networkidle0' })
      const fileDBlogPost = path.join(SCREENSHOTS_DIR, `${width}px-03-blog-post.png`)
      await page.screenshot({ path: fileDBlogPost })
      results.screenshots.push(`screenshots/${width}px-03-blog-post.png`)
    }
  }

  await browser.close()

  fs.writeFileSync('scripts/audit-report-final.json', JSON.stringify(results, null, 2))
  console.log('Audit completed successfully. Report written to scripts/audit-report-final.json')
}

runAudit().catch((err) => {
  console.error('Audit failed:', err)
  process.exit(1)
})
