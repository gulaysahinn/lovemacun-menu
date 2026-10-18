import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe')
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH
console.log('Using browser executable:', executablePath)

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({
    width: 375,
    height: 640,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  })

  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1 Edg/120.0.0.0')

  console.log('Navigating to http://localhost:5173 ...')
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 2000))

  const videoAttributes = await page.evaluate(() => {
    const video = document.querySelector('.hero-video-element')
    const kicker = document.querySelector('.menu-hero-kicker') || document.querySelector('.hero-kicker') || document.querySelector('h1')
    if (!video) return { found: false }

    const style = window.getComputedStyle(video)
    return {
      found: true,
      hasControls: video.hasAttribute('controls'),
      disablePictureInPicture: video.disablePictureInPicture,
      disableRemotePlayback: video.disableRemotePlayback,
      controlsList: video.getAttribute('controlsList'),
      pointerEvents: style.pointerEvents,
      kickerText: kicker ? kicker.innerText : 'not found'
    }
  })

  console.log('Video attributes:', JSON.stringify(videoAttributes, null, 2))

  const screenshotPath = 'scripts/hero-mobile-375x640.png'
  await page.screenshot({ path: screenshotPath })
  console.log('Screenshot saved to:', screenshotPath)

  await browser.close()
}

run().catch(err => {
  console.error('Test error:', err)
  process.exit(1)
})
