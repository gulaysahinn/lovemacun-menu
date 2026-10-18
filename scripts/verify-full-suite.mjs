import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CHROME_PATH_ALT = 'C:\\Users\\gulay\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : CHROME_PATH_ALT

const SCREENSHOTS_DIR = path.resolve('screenshots')
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
}

const BASE_URL = 'http://localhost:5173'

const VIEWPORTS = [
  { name: '1280x800', width: 1280, height: 800, isMobile: false },
  { name: '1440x900', width: 1440, height: 900, isMobile: false },
  { name: '1920x1080', width: 1920, height: 1080, isMobile: false },
  { name: '375x640', width: 375, height: 640, isMobile: true },
  { name: '360x700', width: 360, height: 700, isMobile: true }
]

async function run() {
  console.log('🚀 Starting Verification Suite for User Request 5...')
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const results = {
    heroPixelTests: {},
    horizontalOverflow: {},
    headerOverlapChecks: {},
    screenshots: []
  }

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Testing Viewport: ${vp.name} ---`)
      const page = await browser.newPage()
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile })

      // 1. HOME PAGE (Hero, Öne Çıkanlar, Kategori Çubuğu)
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' })
      await new Promise((r) => setTimeout(r, 600))

      const homeScreenshotPath = path.join(SCREENSHOTS_DIR, `verify-${vp.name}-home.png`)
      await page.screenshot({ path: homeScreenshotPath })
      results.screenshots.push(homeScreenshotPath)

      // Horizontal overflow check
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth
        }
      })
      results.horizontalOverflow[vp.name] = overflow

      // Pixel check on hero at x=8 and x=width-8 at y=120
      const heroBBox = await page.evaluate(() => {
        const hero = document.querySelector('.menu-hero-video-section')
        if (!hero) return null
        const r = hero.getBoundingClientRect()
        return { x: r.x, y: r.y, width: r.width, height: r.height }
      })

      if (heroBBox) {
        // sample pixels from homeScreenshotPath using sharp
        const image = sharp(homeScreenshotPath)
        const metadata = await image.metadata()
        const yCoord = Math.min(Math.floor(heroBBox.y + heroBBox.height / 2), metadata.height - 10)
        
        // Left pixel at x=8
        const leftPixelRaw = await sharp(homeScreenshotPath)
          .extract({ left: 8, top: yCoord, width: 1, height: 1 })
          .raw()
          .toBuffer()

        // Right pixel at x=width-8
        const rightPixelRaw = await sharp(homeScreenshotPath)
          .extract({ left: vp.width - 8, top: yCoord, width: 1, height: 1 })
          .raw()
          .toBuffer()

        const leftRGB = { r: leftPixelRaw[0], g: leftPixelRaw[1], b: leftPixelRaw[2] }
        const rightRGB = { r: rightPixelRaw[0], g: rightPixelRaw[1], b: rightPixelRaw[2] }

        // Is it the background color #0a0605? (r ~ 10, g ~ 6, b ~ 5)
        const isLeftBlank = (leftRGB.r <= 12 && leftRGB.g <= 8 && leftRGB.b <= 8)
        const isRightBlank = (rightRGB.r <= 12 && rightRGB.g <= 8 && rightRGB.b <= 8)

        results.heroPixelTests[vp.name] = {
          heroWidth: heroBBox.width,
          yCoord,
          leftPixel: leftRGB,
          rightPixel: rightRGB,
          leftPass: !isLeftBlank,
          rightPass: !isRightBlank
        }
        console.log(`Hero width: ${heroBBox.width}px (Viewport: ${vp.width}px)`)
        console.log(`Left pixel (x=8, y=${yCoord}): rgb(${leftRGB.r}, ${leftRGB.g}, ${leftRGB.b}) -> ${!isLeftBlank ? 'PASSED (Hero Content)' : 'BLANK'}`)
        console.log(`Right pixel (x=${vp.width-8}, y=${yCoord}): rgb(${rightRGB.r}, ${rightRGB.g}, ${rightRGB.b}) -> ${!isRightBlank ? 'PASSED (Hero Content)' : 'BLANK'}`)
      }

      // 2. REZERVASYON SAYFASI
      await page.goto(`${BASE_URL}/rezervasyon`, { waitUntil: 'networkidle0' })
      await new Promise((r) => setTimeout(r, 400))
      const resScreenshotPath = path.join(SCREENSHOTS_DIR, `verify-${vp.name}-rezervasyon.png`)
      await page.screenshot({ path: resScreenshotPath })
      results.screenshots.push(resScreenshotPath)

      const resOverlap = await page.evaluate(() => {
        const header = document.querySelector('header, .app-header, .mobile-app-header')
        const kicker = document.querySelector('.reservation-kicker')
        const h1 = document.querySelector('.reservation-title')
        const headerBottom = header ? header.getBoundingClientRect().bottom : 0
        const kickerTop = kicker ? kicker.getBoundingClientRect().top : (h1 ? h1.getBoundingClientRect().top : 0)
        return {
          headerBottom,
          kickerTop,
          clearance: kickerTop - headerBottom,
          isCovered: kickerTop < headerBottom
        }
      })
      results.headerOverlapChecks[`${vp.name}-rezervasyon`] = resOverlap

      // 3. BLOG SAYFASI
      await page.goto(`${BASE_URL}/blog`, { waitUntil: 'networkidle0' })
      await new Promise((r) => setTimeout(r, 400))
      const blogScreenshotPath = path.join(SCREENSHOTS_DIR, `verify-${vp.name}-blog.png`)
      await page.screenshot({ path: blogScreenshotPath })
      results.screenshots.push(blogScreenshotPath)

      const blogOverlap = await page.evaluate(() => {
        const header = document.querySelector('header, .app-header, .mobile-app-header')
        const title = document.querySelector('.blog-title, h1')
        const headerBottom = header ? header.getBoundingClientRect().bottom : 0
        const titleTop = title ? title.getBoundingClientRect().top : 0
        return {
          headerBottom,
          titleTop,
          clearance: titleTop - headerBottom,
          isCovered: titleTop < headerBottom
        }
      })
      results.headerOverlapChecks[`${vp.name}-blog`] = blogOverlap

      // 4. İLETİŞİM SAYFASI
      await page.goto(`${BASE_URL}/iletisim`, { waitUntil: 'networkidle0' })
      await new Promise((r) => setTimeout(r, 400))
      const contactScreenshotPath = path.join(SCREENSHOTS_DIR, `verify-${vp.name}-iletisim.png`)
      await page.screenshot({ path: contactScreenshotPath })
      results.screenshots.push(contactScreenshotPath)

      const contactOverlap = await page.evaluate(() => {
        const header = document.querySelector('header, .app-header, .mobile-app-header')
        const title = document.querySelector('.contact-title, h1')
        const headerBottom = header ? header.getBoundingClientRect().bottom : 0
        const titleTop = title ? title.getBoundingClientRect().top : 0
        return {
          headerBottom,
          titleTop,
          clearance: titleTop - headerBottom,
          isCovered: titleTop < headerBottom
        }
      })
      results.headerOverlapChecks[`${vp.name}-iletisim`] = contactOverlap

      // 5. HİKAYEMİZ SAYFASI
      await page.goto(`${BASE_URL}/hikayemiz`, { waitUntil: 'networkidle0' })
      await new Promise((r) => setTimeout(r, 400))
      const storyScreenshotPath = path.join(SCREENSHOTS_DIR, `verify-${vp.name}-hikayemiz.png`)
      await page.screenshot({ path: storyScreenshotPath })
      results.screenshots.push(storyScreenshotPath)

      const storyOverlap = await page.evaluate(() => {
        const header = document.querySelector('header, .app-header, .mobile-app-header')
        const kicker = document.querySelector('.story-hero-kicker')
        const h1 = document.querySelector('.story-hero-h1')
        const headerBottom = header ? header.getBoundingClientRect().bottom : 0
        const topEl = kicker ? kicker.getBoundingClientRect().top : (h1 ? h1.getBoundingClientRect().top : 0)
        return {
          headerBottom,
          topEl,
          clearance: topEl - headerBottom,
          isCovered: topEl < headerBottom
        }
      })
      results.headerOverlapChecks[`${vp.name}-hikayemiz`] = storyOverlap

      await page.close()
    }

    console.log('\n=== FINAL VERIFICATION RESULTS SUMMARY ===')
    console.log(JSON.stringify(results, null, 2))

  } catch (err) {
    console.error('Error during audit:', err)
  } finally {
    await browser.close()
  }
}

run()
