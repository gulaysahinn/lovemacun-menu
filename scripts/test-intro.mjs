import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const chromePath = path.join(
  process.env.LOCALAPPDATA,
  'Google\\Chrome\\Application\\chrome.exe'
)

async function run() {
  console.log('Launching Chrome from:', chromePath)
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  })

  const results = {}

  try {
    const page = await browser.newPage()

    // -------------------------------------------------------------
    // TEST 1: 1280px Desktop
    // -------------------------------------------------------------
    await page.setViewport({ width: 1280, height: 800 })
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ])
    await page.goto('http://localhost:5174/#pide', { waitUntil: 'networkidle0' })
    await page.evaluate(() => sessionStorage.clear())

    // Click 'Makarnalar' tab
    await page.evaluate(() => {
      const tab =
        document.getElementById('tab-makarna') ||
        Array.from(document.querySelectorAll('.tab-btn')).find((t) =>
          t.textContent.includes('Makarna')
        )
      if (tab) tab.click()
    })

    // Wait for intro overlay to appear
    await page.waitForSelector('.intro-overlay', { timeout: 5000 })
    await new Promise((r) => setTimeout(r, 500)) // let skip button fade in and layout settle

    // Measure at 1280px
    const desktopMetrics = await page.evaluate(() => {
      const heading = document.getElementById('intro-title-heading')
      const centerBox = document.getElementById('intro-center-box')
      const img = document.querySelector('.intro-kenburns-img')
      const subtitle = document.querySelector('.intro-count-subtitle')
      const skipPrompt = document.querySelector('.intro-skip-prompt')

      const headingRect = heading.getBoundingClientRect()
      const centerBoxRect = centerBox.getBoundingClientRect()
      const skipRect = skipPrompt ? skipPrompt.getBoundingClientRect() : null
      const imgComputed = img ? window.getComputedStyle(img) : null

      const vpW = window.innerWidth
      const vpH = window.innerHeight

      const headingCenterX = headingRect.left + headingRect.width / 2
      const headingCenterY = headingRect.top + headingRect.height / 2
      const boxCenterX = centerBoxRect.left + centerBoxRect.width / 2
      const boxCenterY = centerBoxRect.top + centerBoxRect.height / 2

      return {
        viewport: { width: vpW, height: vpH },
        heading: {
          text: heading.textContent.trim(),
          rect: {
            left: headingRect.left,
            top: headingRect.top,
            width: headingRect.width,
            height: headingRect.height,
          },
          centerX: headingCenterX,
          centerY: headingCenterY,
          dx: Math.abs(headingCenterX - vpW / 2),
          dy: Math.abs(headingCenterY - vpH / 2),
        },
        centerBox: {
          centerX: boxCenterX,
          centerY: boxCenterY,
          dx: Math.abs(boxCenterX - vpW / 2),
          dy: Math.abs(boxCenterY - vpH / 2),
        },
        subtitle: subtitle ? subtitle.textContent.trim() : null,
        skipPrompt: skipRect
          ? {
              text: skipPrompt.textContent.trim(),
              height: skipRect.height,
              color: window.getComputedStyle(skipPrompt).color,
            }
          : null,
        image: img
          ? {
              src: img.getAttribute('src'),
              filter: imgComputed.filter,
            }
          : null,
      }
    })

    results.desktop = desktopMetrics
    await page.screenshot({ path: 'scripts/desktop-intro-1280.png' })
    console.log('Desktop 1280px metrics:', JSON.stringify(desktopMetrics, null, 2))

    // Wait for intro to finish or reload
    await new Promise((r) => setTimeout(r, 1200))

    // -------------------------------------------------------------
    // TEST 2: 375px Mobile with 4x CPU Throttling
    // -------------------------------------------------------------
    await page.setViewport({ width: 375, height: 667 })
    await page.goto('http://localhost:5174/#pide', { waitUntil: 'networkidle0' })
    await page.evaluate(() => sessionStorage.clear())

    // Enable 4x CPU Throttling via Chrome DevTools Protocol
    const client = await page.target().createCDPSession()
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    console.log('CPU 4x Throttling enabled!')

    // Setup FPS and frame delta measurement inside page
    await page.evaluate(() => {
      window.__frameTimes = []
      let lastTime = performance.now()
      function recordFrame(now) {
        window.__frameTimes.push(now - lastTime)
        lastTime = now
        window.__rafId = requestAnimationFrame(recordFrame)
      }
      window.__rafId = requestAnimationFrame(recordFrame)
    })

    // Click 'Makarnalar' tab
    await page.evaluate(() => {
      const tab =
        document.getElementById('tab-makarna') ||
        Array.from(document.querySelectorAll('.tab-btn')).find((t) =>
          t.textContent.includes('Makarna')
        )
      if (tab) tab.click()
    })

    await page.waitForSelector('.intro-overlay', { timeout: 5000 })
    await new Promise((r) => setTimeout(r, 500)) // settle inside 4x CPU and let skip prompt fade in

    // Measure at 375px
    const mobileMetrics = await page.evaluate(() => {
      const heading = document.getElementById('intro-title-heading')
      const centerBox = document.getElementById('intro-center-box')
      const img = document.querySelector('.intro-kenburns-img')
      const subtitle = document.querySelector('.intro-count-subtitle')
      const skipPrompt = document.querySelector('.intro-skip-prompt')

      const headingRect = heading.getBoundingClientRect()
      const centerBoxRect = centerBox.getBoundingClientRect()
      const skipRect = skipPrompt ? skipPrompt.getBoundingClientRect() : null
      const imgComputed = img ? window.getComputedStyle(img) : null

      const vpW = window.innerWidth
      const vpH = window.innerHeight

      const headingCenterX = headingRect.left + headingRect.width / 2
      const headingCenterY = headingRect.top + headingRect.height / 2
      const boxCenterX = centerBoxRect.left + centerBoxRect.width / 2
      const boxCenterY = centerBoxRect.top + centerBoxRect.height / 2

      return {
        viewport: { width: vpW, height: vpH },
        heading: {
          text: heading.textContent.trim(),
          rect: {
            left: headingRect.left,
            top: headingRect.top,
            width: headingRect.width,
            height: headingRect.height,
          },
          centerX: headingCenterX,
          centerY: headingCenterY,
          dx: Math.abs(headingCenterX - vpW / 2),
          dy: Math.abs(headingCenterY - vpH / 2),
        },
        centerBox: {
          centerX: boxCenterX,
          centerY: boxCenterY,
          dx: Math.abs(boxCenterX - vpW / 2),
          dy: Math.abs(boxCenterY - vpH / 2),
        },
        subtitle: subtitle ? subtitle.textContent.trim() : null,
        skipPrompt: skipRect
          ? {
              text: skipPrompt.textContent.trim(),
              height: skipRect.height,
              color: window.getComputedStyle(skipPrompt).color,
            }
          : null,
        image: img
          ? {
              src: img.getAttribute('src'),
              filter: imgComputed.filter,
            }
          : null,
      }
    })

    await page.screenshot({ path: 'scripts/mobile-intro-375.png' })
    results.mobile = mobileMetrics
    console.log('Mobile 375px metrics:', JSON.stringify(mobileMetrics, null, 2))

    // Wait until 400ms passes to test skip prompt visibility
    await new Promise((r) => setTimeout(r, 450))
    const skipVisible = await page.evaluate(() => {
      const footer = document.querySelector('.intro-footer-prompt')
      const prompt = document.querySelector('.intro-skip-prompt')
      return {
        opacity: footer ? window.getComputedStyle(footer).opacity : null,
        height: prompt ? prompt.getBoundingClientRect().height : null,
      }
    })
    results.skipPromptAt400ms = skipVisible
    console.log('Skip prompt at 400ms+:', skipVisible)

    // Wait for intro completion under 4x CPU throttle
    await new Promise((r) => setTimeout(r, 800))

    // Collect frame time statistics
    const frameStats = await page.evaluate(() => {
      cancelAnimationFrame(window.__rafId)
      const times = window.__frameTimes.slice(2) // drop initial warmup
      if (!times.length) return null
      const avgDelta = times.reduce((a, b) => a + b, 0) / times.length
      const maxDelta = Math.max(...times)
      const droppedFrames = times.filter((d) => d > 33.3).length // frames taking > 30fps
      const avgFps = 1000 / avgDelta
      return {
        sampleCount: times.length,
        avgDeltaMs: Math.round(avgDelta * 10) / 10,
        maxDeltaMs: Math.round(maxDelta * 10) / 10,
        avgFps: Math.round(avgFps),
        droppedFramesCount: droppedFrames,
      }
    })

    results.performance4x = frameStats
    console.log('Performance under 4x CPU throttle:', frameStats)

    fs.writeFileSync('scripts/audit-results.json', JSON.stringify(results, null, 2))
    console.log('Audit completed successfully!')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('Audit failed:', err)
  process.exit(1)
})
