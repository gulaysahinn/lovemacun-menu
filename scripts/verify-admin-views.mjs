import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const CHROME_PATH = path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe')
const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH

async function run() {
  console.log('--- CAPTURING ADMIN PANEL SCREENSHOTS (DESKTOP & MOBILE) ---\n')

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  page.on('dialog', async dialog => {
    console.log('Dialog dismissed:', dialog.message())
    await dialog.accept()
  })

  // 1. Giriş Yap (Admin)
  console.log('1. Logging in as admin...')
  await page.setViewport({ width: 1280, height: 800 })
  await page.goto('http://localhost:5175/yonetim/login.php', { waitUntil: 'networkidle0' })
  await page.type('#username', 'admin')
  await page.type('#password', 'TestYonetici2026!')
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ])
  console.log('✓ Giriş başarılı! Mevcut sayfa:', page.url())

  // 2. Tanı Sayfası (tani.php) - 1280px Masaüstü
  console.log('2. Navigating to tani.php (1280x800)...')
  await page.goto('http://localhost:5175/yonetim/tani.php', { waitUntil: 'networkidle0' })
  const taniChecks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.check-card')).map(el => {
      const title = el.querySelector('.check-title')?.innerText || ''
      const badge = el.querySelector('.status-badge')?.innerText || ''
      const val = el.querySelector('.check-val')?.innerText || ''
      return { title, badge, val }
    })
  })
  console.log('Tanı Kontrolleri Sayısı:', taniChecks.length)
  console.log(JSON.stringify(taniChecks, null, 2))
  await page.screenshot({ path: 'scripts/tani-page-1280.png', fullPage: true })
  console.log('✓ Screenshot saved: scripts/tani-page-1280.png')

  // 3. Mobil Emülasyon (375x640) - index.php (Menü Yönetimi)
  console.log('3. Setting mobile viewport (375x640) for index.php...')
  await page.setViewport({ width: 375, height: 640, isMobile: true, hasTouch: true })
  await page.goto('http://localhost:5175/yonetim/index.php', { waitUntil: 'networkidle0' })

  // Bir fiyatta değişiklik yaparak alttaki yapışık kaydetme çubuğunu aktifleştir
  await page.evaluate(() => {
    const input = document.querySelector('.m-card .price-box input')
    if (input) {
      input.value = Number(input.value) + 10
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
  await new Promise(r => setTimeout(r, 600))

  const mobileMetrics = await page.evaluate(() => {
    const body = document.body
    const hasHorizontalScroll = body.scrollWidth > window.innerWidth
    const saveBar = document.getElementById('saveBar')
    const mCards = document.querySelectorAll('.m-card').length
    const tableDisplay = window.getComputedStyle(document.querySelector('.table-card')).display
    return {
      windowWidth: window.innerWidth,
      scrollWidth: body.scrollWidth,
      hasHorizontalScroll,
      mCardsCount: mCards,
      tableDisplay,
      saveBarVisible: saveBar ? saveBar.classList.contains('visible') : false
    }
  })
  console.log('Mobile Panel Metrics:', JSON.stringify(mobileMetrics, null, 2))
  await page.screenshot({ path: 'scripts/panel-mobile-375x640.png' })
  console.log('✓ Screenshot saved: scripts/panel-mobile-375x640.png')

  // 4. Mobil Emülasyon (375x640) - kullanicilar.php
  console.log('4. Navigating to kullanicilar.php (375x640)...')
  await page.goto('http://localhost:5175/yonetim/kullanicilar.php', { waitUntil: 'networkidle0' })
  const userMetrics = await page.evaluate(() => {
    return {
      windowWidth: window.innerWidth,
      scrollWidth: document.body.scrollWidth,
      hasHorizontalScroll: document.body.scrollWidth > window.innerWidth
    }
  })
  console.log('Mobile Users Metrics:', JSON.stringify(userMetrics, null, 2))
  await page.screenshot({ path: 'scripts/kullanicilar-mobile-375x640.png' })
  console.log('✓ Screenshot saved: scripts/kullanicilar-mobile-375x640.png')

  // 5. Mobil Emülasyon (375x640) - yedekler.php
  console.log('5. Navigating to yedekler.php (375x640)...')
  await page.goto('http://localhost:5175/yonetim/yedekler.php', { waitUntil: 'networkidle0' })
  const yedekMetrics = await page.evaluate(() => {
    return {
      windowWidth: window.innerWidth,
      scrollWidth: document.body.scrollWidth,
      hasHorizontalScroll: document.body.scrollWidth > window.innerWidth
    }
  })
  console.log('Mobile Backups Metrics:', JSON.stringify(yedekMetrics, null, 2))
  await page.screenshot({ path: 'scripts/yedekler-mobile-375x640.png' })
  console.log('✓ Screenshot saved: scripts/yedekler-mobile-375x640.png')

  await browser.close()
  console.log('\n--- ALL ADMIN SCREENSHOTS CAPTURED SUCCESSFULLY ---\n')
}

run().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
