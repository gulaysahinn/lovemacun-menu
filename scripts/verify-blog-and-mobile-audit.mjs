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
const POST_SLUG = 'buyukadada-ezber-bozan-bir-lezzet-tasfirinlovemacun'

async function runAudit() {
  console.log('=== STARTING COMPLETE BLOG & MOBILE AUDIT ===')

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const auditReport = {
    wordCountCheck: {},
    homeMobileChecks: {},
    blogPostChecks: {},
    blogListChecks: {},
    screenshotsCaptured: []
  }

  const page = await browser.newPage()

  // ---------------------------------------------------------------------------
  // 1. KELİME SAYISI KONTROLÜ (290 kelime)
  // ---------------------------------------------------------------------------
  console.log('\n--- 1. Blog Metni Kelime Sayısı Kontrolü ---')
  const blogModule = await import('../src/data/blog.js')
  const originalPost = blogModule.BLOG_POSTS[0]
  const fullText = originalPost.paragraphs.join(' ')
  const calculatedWords = fullText.trim().split(/\s+/).length

  console.log(`Kelime sayısı: ${calculatedWords} (Hedef / Önceki: 290, Birebir Eşit: ${calculatedWords === 290})`)
  auditReport.wordCountCheck = {
    target: 290,
    actual: calculatedWords,
    match: calculatedWords === 290,
    paragraphCount: originalPost.paragraphs.length
  }

  // ---------------------------------------------------------------------------
  // 2. ANA SAYFA MOBİL KONTROLLERİ (375x640 ve 360x700)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Ana Sayfa Mobil Kontrolleri (Öne Çıkanlar & Kategori Çubuğu) ---')
  const mobileViewports = [
    { width: 375, height: 640, name: '375x640' },
    { width: 360, height: 700, name: '360x700' }
  ]

  for (const vp of mobileViewports) {
    await page.setViewport({ width: vp.width, height: vp.height })
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
    await new Promise(r => setTimeout(r, 600))

    const metrics = await page.evaluate(() => {
      const card = document.querySelector('.feat-strip-card')
      const img = document.querySelector('.feat-strip-img-wrap')
      const info = document.querySelector('.feat-strip-info')
      const name = document.querySelector('.feat-strip-name')
      const price = document.querySelector('.feat-strip-price')
      const catBar = document.querySelector('.cat-strip') || document.querySelector('.category-nav') || document.querySelector('.cat-bar')
      const firstProductImg = document.querySelector('.menu-card-img-wrap') || document.querySelector('.menu-item-img') || document.querySelector('.product-card img')

      const cardRect = card ? card.getBoundingClientRect() : null
      const imgRect = img ? img.getBoundingClientRect() : null
      const infoRect = info ? info.getBoundingClientRect() : null
      const nameRect = name ? name.getBoundingClientRect() : null
      const priceRect = price ? price.getBoundingClientRect() : null
      const catBarRect = catBar ? catBar.getBoundingClientRect() : null
      const firstProductImgRect = firstProductImg ? firstProductImg.getBoundingClientRect() : null

      const nameStyles = name ? window.getComputedStyle(name) : null
      const infoStyles = info ? window.getComputedStyle(info) : null

      // Boşluk ölçümleri
      const gapImgToName = (nameRect && imgRect) ? Math.round(nameRect.top - imgRect.bottom) : null
      const gapPriceToCat = (catBarRect && priceRect) ? Math.round(catBarRect.top - priceRect.bottom) : null

      const scrollWidth = document.documentElement.scrollWidth
      const clientWidth = document.documentElement.clientWidth

      return {
        cardRect,
        imgRect,
        infoRect,
        nameRect,
        priceRect,
        catBarRect,
        firstProductImgRect,
        gapImgToName,
        gapPriceToCat,
        nameLineHeight: nameStyles ? nameStyles.lineHeight : null,
        infoPaddingTop: infoStyles ? infoStyles.paddingTop : null,
        hasHorizontalOverflow: scrollWidth > clientWidth,
        scrollWidth,
        clientWidth
      }
    })

    console.log(`[${vp.name}] Home Mobile:`)
    console.log(`  - Gap Img to Name: ${metrics.gapImgToName}px (Kural: 8px)`)
    console.log(`  - Name Line Height: ${metrics.nameLineHeight} (Kural: 1.25)`)
    console.log(`  - Gap Price to Cat Bar: ${metrics.gapPriceToCat}px (Kural: >= 8px)`)
    console.log(`  - Horizontal Overflow: ${metrics.hasHorizontalOverflow} (scroll: ${metrics.scrollWidth}, client: ${metrics.clientWidth})`)

    const shotPath = `screenshots/${vp.name}-home-verified.png`
    await page.screenshot({ path: shotPath })
    auditReport.screenshotsCaptured.push(shotPath)
    auditReport.homeMobileChecks[vp.name] = metrics
  }

  // ---------------------------------------------------------------------------
  // 3. BLOG LİSTESİ VE BLOG YAZISI: 5 VIEWPORT (375x640, 360x700, 768px, 1280px, 1440px)
  // ---------------------------------------------------------------------------
  const testViewports = [
    { width: 375, height: 640, name: '375x640', type: 'mobile' },
    { width: 360, height: 700, name: '360x700', type: 'mobile' },
    { width: 768, height: 1024, name: '768px', type: 'tablet' },
    { width: 1280, height: 800, name: '1280px', type: 'desktop' },
    { width: 1440, height: 900, name: '1440px', type: 'desktop' }
  ]

  for (const vp of testViewports) {
    console.log(`\n======================================================`)
    console.log(`TEST VIEWPORT: ${vp.name} (${vp.width}x${vp.height}) [${vp.type}]`)
    console.log(`======================================================`)
    await page.setViewport({ width: vp.width, height: vp.height })

    // A) BLOG LİSTESİ SAYFASI (/blog)
    await page.goto(`${BASE_URL}/blog`, { waitUntil: 'networkidle0' })
    await new Promise(r => setTimeout(r, 600))

    const listMetrics = await page.evaluate(() => {
      const header = document.querySelector('.blog-header')
      const card = document.querySelector('.blog-card-featured')
      const badge = document.querySelector('.blog-card-badge-feat')
      const readTime = document.querySelector('.blog-meta-time')
      const instaBanner = document.querySelector('.blog-insta-banner')
      const menuCta = document.querySelector('.btn-blog-menu-cta')

      const headerRect = header ? header.getBoundingClientRect() : null
      const cardRect = card ? card.getBoundingClientRect() : null
      const badgeText = badge ? badge.innerText : null
      const readTimeText = readTime ? readTime.innerText : null
      const instaRect = instaBanner ? instaBanner.getBoundingClientRect() : null
      const ctaRect = menuCta ? menuCta.getBoundingClientRect() : null

      const scrollWidth = document.documentElement.scrollWidth
      const clientWidth = document.documentElement.clientWidth

      return {
        headerRect: headerRect ? { width: headerRect.width, height: headerRect.height } : null,
        cardRect: cardRect ? { width: cardRect.width, height: cardRect.height } : null,
        badgeText,
        readTimeText,
        instaRect: instaRect ? { width: instaRect.width, height: instaRect.height } : null,
        ctaRect: ctaRect ? { width: ctaRect.width, height: ctaRect.height } : null,
        hasHorizontalOverflow: scrollWidth > clientWidth,
        scrollWidth,
        clientWidth
      }
    })

    const listShot = `screenshots/${vp.name}-blog-list.png`
    await page.screenshot({ path: listShot })
    auditReport.screenshotsCaptured.push(listShot)
    auditReport.blogListChecks[vp.name] = listMetrics
    console.log(`  [Blog List]`)
    console.log(`    - Featured Badge: "${listMetrics.badgeText}"`)
    console.log(`    - Read Time: "${listMetrics.readTimeText}"`)
    console.log(`    - Horizontal Overflow: ${listMetrics.hasHorizontalOverflow} (${listMetrics.scrollWidth} vs ${listMetrics.clientWidth})`)

    // B) BLOG YAZI SAYFASI (/${POST_SLUG})
    await page.goto(`${BASE_URL}/${POST_SLUG}`, { waitUntil: 'networkidle0' })
    await new Promise(r => setTimeout(r, 800))

    // 1. Üst Ekran Görüntüsü (Hero & Lead)
    await page.evaluate(() => window.scrollTo(0, 0))
    await new Promise(r => setTimeout(r, 300))
    const topShot = `screenshots/${vp.name}-blog-post-top.png`
    await page.screenshot({ path: topShot })
    auditReport.screenshotsCaptured.push(topShot)

    // 2. Orta Ekran Görüntüsü (Özellik kartları & Menüden öne çıkanlar)
    await page.evaluate(() => {
      const el = document.querySelector('.post-feature-grid') || document.querySelector('.post-menu-strip-wrap')
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
    })
    await new Promise(r => setTimeout(r, 400))
    const midShot = `screenshots/${vp.name}-blog-post-mid.png`
    await page.screenshot({ path: midShot })
    auditReport.screenshotsCaptured.push(midShot)

    // 3. Alt Ekran Görüntüsü (Konum kartı, Kapanış & Instagram bandı)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await new Promise(r => setTimeout(r, 400))
    const bottomShot = `screenshots/${vp.name}-blog-post-bottom.png`
    await page.screenshot({ path: bottomShot })
    auditReport.screenshotsCaptured.push(bottomShot)

    // Detaylı BoundingClientRect Ölçümleri
    const postMetrics = await page.evaluate(() => {
      window.scrollTo(0, 0)
      const hero = document.querySelector('.post-hero-hero')
      const progressBar = document.querySelector('.post-sticky-progress-wrap')
      const lead = document.querySelector('.post-lead-p')
      const quote = document.querySelector('.post-pull-quote')
      const featureGrid = document.querySelector('.post-feature-grid')
      const featureCards = Array.from(document.querySelectorAll('.post-feature-card'))
      const menuStrip = document.querySelector('.post-menu-strip-wrap')
      const menuCards = Array.from(document.querySelectorAll('.post-menu-card'))
      const tipBox = document.querySelector('.post-tip-box')
      const locCard = document.querySelector('.post-location-card')
      const actionsCard = document.querySelector('.post-actions-card')
      const instaStrip = document.querySelector('.post-insta-strip')
      const shareBtn = document.querySelector('.btn-post-share')
      const categoryChip = document.querySelector('.post-hero-category')
      const badges = Array.from(document.querySelectorAll('.post-section-badge'))

      const heroRect = hero ? hero.getBoundingClientRect() : null
      const progressRect = progressBar ? progressBar.getBoundingClientRect() : null
      const leadStyles = lead ? window.getComputedStyle(lead) : null
      const quoteStyles = quote ? window.getComputedStyle(quote) : null
      const pStyles = document.querySelector('.post-p') ? window.getComputedStyle(document.querySelector('.post-p')) : null

      const heroWidth = heroRect ? Math.round(heroRect.width) : 0
      const heroHeight = heroRect ? Math.round(heroRect.height) : 0
      const gridRect = featureGrid ? featureGrid.getBoundingClientRect() : null
      const menuRect = menuStrip ? menuStrip.getBoundingClientRect() : null

      const scrollWidth = document.documentElement.scrollWidth
      const clientWidth = document.documentElement.clientWidth

      // Container hizalama kontrolü:
      const heroLeft = heroRect ? Math.round(heroRect.left) : null
      const heroRight = heroRect ? Math.round(heroRect.right) : null
      const gridLeft = gridRect ? Math.round(gridRect.left) : null
      const gridRight = gridRect ? Math.round(gridRect.right) : null

      // Kolon sayısı kontrolü:
      let columns = 1
      if (featureCards.length >= 2) {
        const top0 = Math.round(featureCards[0].getBoundingClientRect().top)
        const top1 = Math.round(featureCards[1].getBoundingClientRect().top)
        if (Math.abs(top0 - top1) < 5) {
          columns = 3
        }
      }

      return {
        hero: { width: heroWidth, height: heroHeight, left: heroLeft, right: heroRight },
        progress: progressRect ? { top: Math.round(progressRect.top), height: Math.round(progressRect.height) } : null,
        lead: {
          fontSize: leadStyles ? leadStyles.fontSize : null,
          lineHeight: leadStyles ? leadStyles.lineHeight : null
        },
        quote: {
          fontSize: quoteStyles ? quoteStyles.fontSize : null,
          fontFamily: quoteStyles ? quoteStyles.fontFamily : null,
          fontStyle: quoteStyles ? quoteStyles.fontStyle : null
        },
        bodyP: {
          fontSize: pStyles ? pStyles.fontSize : null,
          lineHeight: pStyles ? pStyles.lineHeight : null
        },
        featureCardsCount: featureCards.length,
        gridColumns: columns,
        menuCardsCount: menuCards.length,
        hasTipBox: !!tipBox,
        hasLocationCard: !!locCard,
        hasActionsCard: !!actionsCard,
        hasInstaStrip: !!instaStrip,
        hasShareButton: !!shareBtn,
        categoryChipText: categoryChip ? categoryChip.innerText : null,
        badgeSizes: badges.map(b => {
          const r = b.getBoundingClientRect()
          return `${Math.round(r.width)}x${Math.round(r.height)}px`
        }),
        containerAlignment: {
          heroLeft,
          gridLeft,
          heroRight,
          gridRight,
          aligned: heroLeft !== null && gridLeft !== null && Math.abs(heroLeft - gridLeft) <= 1
        },
        hasHorizontalOverflow: scrollWidth > clientWidth,
        scrollWidth,
        clientWidth
      }
    })

    console.log(`  [Blog Post]`)
    console.log(`    - Hero Rect: ${postMetrics.hero.width}x${postMetrics.hero.height}px (left: ${postMetrics.hero.left}, right: ${postMetrics.hero.right})`)
    console.log(`    - Sticky Progress: top=${postMetrics.progress?.top}px, height=${postMetrics.progress?.height}px`)
    console.log(`    - Lead Font: ${postMetrics.lead.fontSize}, Line Height: ${postMetrics.lead.lineHeight}`)
    console.log(`    - Quote Font: ${postMetrics.quote.fontSize}, Style: ${postMetrics.quote.fontStyle}`)
    console.log(`    - Body Font: ${postMetrics.bodyP.fontSize}, Line Height: ${postMetrics.bodyP.lineHeight}`)
    console.log(`    - Feature Grid Columns: ${postMetrics.gridColumns} (${postMetrics.featureCardsCount} kart)`)
    console.log(`    - Featured Menu Strip: ${postMetrics.menuCardsCount} kart`)
    console.log(`    - Section Badges: ${postMetrics.badgeSizes.join(', ')}`)
    console.log(`    - Tip Box: ${postMetrics.hasTipBox}, Location Card: ${postMetrics.hasLocationCard}, Insta Strip: ${postMetrics.hasInstaStrip}`)
    console.log(`    - Container Aligned (Hero == Grid): ${postMetrics.containerAlignment.aligned}`)
    console.log(`    - Horizontal Overflow: ${postMetrics.hasHorizontalOverflow} (${postMetrics.scrollWidth} vs ${postMetrics.clientWidth})`)

    auditReport.blogPostChecks[vp.name] = postMetrics
  }

  await browser.close()

  const reportPath = 'scripts/blog-and-mobile-audit-report.json'
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2))
  console.log(`\n✓ Audit finished successfully! Saved to ${reportPath}`)
  console.log(`✓ Total screenshots: ${auditReport.screenshotsCaptured.length}`)
}

runAudit().catch(err => {
  console.error('Audit failed:', err)
  process.exit(1)
})
