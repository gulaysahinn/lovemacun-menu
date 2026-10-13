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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const auditReport = {
    infoDrawer360x640: {},
    measurements: [],
    screenshots: []
  }

  const page = await browser.newPage()

  const languages = ['tr', 'en']
  const mobileViewports = [
    { name: '360x640', width: 360, height: 640 },
    { name: '375x640', width: 375, height: 640 },
    { name: '360x700', width: 360, height: 700 },
    { name: '320x568', width: 320, height: 568 }
  ]
  const desktopViewports = [
    { name: '1280x800', width: 1280, height: 800 },
    { name: '1440x900', width: 1440, height: 900 }
  ]

  for (const lang of languages) {
    console.log(`\n========================================\nAUDITING LANGUAGE: ${lang.toUpperCase()}\n========================================`)

    // 1. MOBILE AUDITS
    for (const vp of mobileViewports) {
      console.log(`\nTesting ${vp.name} (${lang})...`)
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 })

      // Set language via localStorage and cookie
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' })
      await page.evaluate((l) => {
        localStorage.setItem('lovemacun_lang', l)
        if (l === 'en') {
          document.cookie = 'googtrans=/tr/en; path=/;'
        } else {
          document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        }
      }, lang)
      await page.reload({ waitUntil: 'networkidle0' })
      await sleep(300)

      // A) HOME PAGE (InfoDrawer Closed)
      const homeShot = `screenshots/home-${vp.name}-${lang}-closed.png`
      await page.screenshot({ path: homeShot, fullPage: false })
      auditReport.screenshots.push(homeShot)

      // B) OPEN INFODRAWER
      // Click 4th tab in MobileTabBar (Bilgi / Info)
      const tabItems = await page.$$('.mobile-tab-item')
      if (tabItems && tabItems.length >= 4) {
        await tabItems[3].click()
        await sleep(350)
      } else {
        const infoBtn = await page.$('button[aria-label="Bilgi"]') || await page.$('button[aria-label="Info"]')
        if (infoBtn) {
          await infoBtn.click()
          await sleep(350)
        }
      }

      // Measure InfoDrawer via getBoundingClientRect()
      const infoMetrics = await page.evaluate(() => {
        const sheet = document.querySelector('.info-bs-sheet')
        if (!sheet) return null

        const sheetRect = sheet.getBoundingClientRect()
        const head = document.querySelector('.info-bs-head')?.getBoundingClientRect()
        const status = document.querySelector('.info-bs-status-block')?.getBoundingClientRect()
        const tiles = Array.from(document.querySelectorAll('.info-bs-tile')).map(el => {
          const r = el.getBoundingClientRect()
          const style = window.getComputedStyle(el)
          return {
            title: el.querySelector('.tile-title')?.innerText?.trim(),
            height: r.height,
            width: r.width,
            bg: style.backgroundColor,
            color: style.color,
            isPrimary: el.classList.contains('tile-primary-res')
          }
        })
        const phoneBtns = Array.from(document.querySelectorAll('.info-bs-phone-btn')).map(el => {
          const r = el.getBoundingClientRect()
          return { text: el.innerText.trim(), height: r.height, width: r.width }
        })
        const addrRow = document.querySelector('.info-bs-address-row')?.getBoundingClientRect()
        const footerRow = document.querySelector('.info-bs-footer-row')?.getBoundingClientRect()

        const lastElement = document.querySelector('.info-bs-footer-row') || document.querySelector('.info-bs-address-row')
        const lastElRect = lastElement ? lastElement.getBoundingClientRect() : null
        const cushionAboveBottom = lastElRect ? (sheetRect.bottom - lastElRect.bottom) : null

        const bodyHasHScroll = document.documentElement.scrollWidth > window.innerWidth

        return {
          sheetRect: { top: sheetRect.top, bottom: sheetRect.bottom, height: sheetRect.height },
          headHeight: head?.height,
          tiles,
          phoneBtns,
          addrHeight: addrRow?.height,
          cushionAboveBottom,
          bodyHasHScroll
        }
      })

      if (vp.name === '360x640' && lang === 'tr') {
        auditReport.infoDrawer360x640 = infoMetrics
      }

      const infoShot = `screenshots/infodrawer-${vp.name}-${lang}-open.png`
      await page.screenshot({ path: infoShot, fullPage: false })
      auditReport.screenshots.push(infoShot)

      // Close InfoDrawer
      const closeInfoBtn = await page.$('.info-bs-close-btn')
      if (closeInfoBtn) {
        await closeInfoBtn.click()
        await sleep(300)
      }

      // C) OPEN HAMBURGER DRAWER
      const hbgBtn = await page.$('.mobile-app-hamburger-btn') || await page.$('button[aria-label="Menüyü aç"]')
      if (hbgBtn) {
        await hbgBtn.click()
        await sleep(350)
      }

      // Measure Hamburger Drawer (Lang collapsed)
      const hbgMetricsCollapsed = await page.evaluate(() => {
        const panel = document.querySelector('.hbg-drawer-panel')
        if (!panel) return null
        const panelRect = panel.getBoundingClientRect()
        const stickyBar = document.querySelector('.hbg-drawer-sticky-bar')
        const stickyRect = stickyBar ? stickyBar.getBoundingClientRect() : null
        const stickyButtons = Array.from(document.querySelectorAll('.hbg-drawer-sticky-bar .btn')).map(b => {
          const r = b.getBoundingClientRect()
          return { text: b.innerText.trim(), height: r.height }
        })
        const subItems = Array.from(document.querySelectorAll('.hbg-nav-sub')).map(el => {
          return { text: el.innerText.trim(), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }
        })
        const hasActiveBadge = Boolean(document.querySelector('.hbg-nav-active-pill'))

        return {
          panelWidth: panelRect.width,
          stickyBarHeight: stickyRect?.height,
          stickyButtons,
          subItems,
          hasActiveBadge
        }
      })

      const hbgCollapsedShot = `screenshots/hamburger-${vp.name}-${lang}-collapsed.png`
      await page.screenshot({ path: hbgCollapsedShot, fullPage: false })
      auditReport.screenshots.push(hbgCollapsedShot)

      // Click language toggle row to expand languages
      const langTrigger = await page.$('.hbg-lang-row-btn')
      if (langTrigger) {
        await langTrigger.click()
        await sleep(200)
      }

      const hbgLangOpenShot = `screenshots/hamburger-${vp.name}-${lang}-lang-open.png`
      await page.screenshot({ path: hbgLangOpenShot, fullPage: false })
      auditReport.screenshots.push(hbgLangOpenShot)

      // Close Hamburger Drawer
      const closeHbgBtn = await page.$('.hbg-drawer-close-btn')
      if (closeHbgBtn) {
        await closeHbgBtn.click()
        await sleep(300)
      }

      // D) RESERVATION PAGE (/rezervasyon)
      await page.goto(`${BASE_URL}/rezervasyon`, { waitUntil: 'networkidle0' })
      await sleep(300)

      const resMetrics = await page.evaluate(() => {
        const callBtns = Array.from(document.querySelectorAll('.btn-res-call')).map(b => {
          const r = b.getBoundingClientRect()
          return { text: b.innerText.trim().replace(/\n/g, ' '), height: r.height, width: r.width }
        })
        const hasHScroll = document.documentElement.scrollWidth > window.innerWidth
        const title = document.querySelector('.reservation-title')?.innerText?.trim()
        const desc = document.querySelector('.res-card-desc')?.innerText?.trim()
        const notice = document.querySelector('.res-info-notice')?.innerText?.trim()

        return {
          callBtns,
          hasHScroll,
          title,
          desc,
          notice
        }
      })

      const resShot = `screenshots/reservation-${vp.name}-${lang}.png`
      await page.screenshot({ path: resShot, fullPage: false })
      auditReport.screenshots.push(resShot)

      auditReport.measurements.push({
        viewport: vp.name,
        lang,
        infoMetrics,
        hbgMetricsCollapsed,
        resMetrics
      })
    }

    // 2. DESKTOP AUDITS
    for (const dvp of desktopViewports) {
      console.log(`\nTesting desktop ${dvp.name} (${lang})...`)
      await page.setViewport({ width: dvp.width, height: dvp.height, deviceScaleFactor: 1 })

      // Desktop Home & Header
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' })
      await page.evaluate((l) => {
        localStorage.setItem('lovemacun_lang', l)
        if (l === 'en') {
          document.cookie = 'googtrans=/tr/en; path=/;'
        } else {
          document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        }
      }, lang)
      await page.reload({ waitUntil: 'networkidle0' })
      await sleep(300)

      const deskHomeShot = `screenshots/desktop-home-${dvp.name}-${lang}.png`
      await page.screenshot({ path: deskHomeShot, fullPage: false })
      auditReport.screenshots.push(deskHomeShot)

      // Desktop Reservation Page
      await page.goto(`${BASE_URL}/rezervasyon`, { waitUntil: 'networkidle0' })
      await sleep(300)

      const deskResMetrics = await page.evaluate(() => {
        const hasHScroll = document.documentElement.scrollWidth > window.innerWidth
        const grid = document.querySelector('.reservation-grid')?.getBoundingClientRect()
        const mainCard = document.querySelector('.reservation-main-card')?.getBoundingClientRect()
        const sideCards = document.querySelector('.reservation-side-cards')?.getBoundingClientRect()
        const callBtns = Array.from(document.querySelectorAll('.btn-res-call')).map(b => {
          const r = b.getBoundingClientRect()
          return { height: r.height, width: r.width }
        })
        return {
          hasHScroll,
          gridWidth: grid?.width,
          mainCardWidth: mainCard?.width,
          sideCardsWidth: sideCards?.width,
          callBtns
        }
      })

      const deskResShot = `screenshots/desktop-reservation-${dvp.name}-${lang}.png`
      await page.screenshot({ path: deskResShot, fullPage: false })
      auditReport.screenshots.push(deskResShot)

      auditReport.measurements.push({
        viewport: dvp.name,
        lang,
        desktopMetrics: deskResMetrics
      })
    }
  }

  await browser.close()

  console.log('\n========================================')
  console.log('AUDIT COMPLETE! Summary:')
  console.log('InfoDrawer 360x640 Metrics:', JSON.stringify(auditReport.infoDrawer360x640, null, 2))
  console.log('Total Screenshots Saved:', auditReport.screenshots.length)
  console.log('========================================')

  fs.writeFileSync('scripts/audit-results.json', JSON.stringify(auditReport, null, 2))
}

run().catch(err => {
  console.error('Audit failed:', err)
  process.exit(1)
})
