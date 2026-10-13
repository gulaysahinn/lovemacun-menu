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

const toRect = (el) => {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return {
    top: r.top,
    left: r.left,
    right: r.right,
    bottom: r.bottom,
    width: r.width,
    height: r.height
  }
}

async function runAudit() {
  console.log('🚀 Doğrulama başlatılıyor: Chrome çalıştırılıyor...')
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  // =========================================================================
  // 1. VIEWPORT: 375x640
  // =========================================================================
  console.log('\n--- 1. Mobil 375x640 İncelemesi ---')
  await page.setViewport({ width: 375, height: 640, deviceScaleFactor: 2 })
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 600))

  // 1.1 LocalStorage Kontrolü
  const listKeyVal = await page.evaluate(() => localStorage.getItem('lovemacun-liste'))
  console.log(`✓ localStorage lovemacun-liste temizlendi: ${listKeyVal === null}`)

  // 1.2 Mobil Tab Bar (4 Sekme)
  const tabInfo = await page.evaluate(() => {
    const bar = document.querySelector('.mobile-tab-bar')
    const items = Array.from(document.querySelectorAll('.mobile-tab-item'))
    const barRect = bar ? {
      top: bar.getBoundingClientRect().top,
      height: bar.getBoundingClientRect().height,
      width: bar.getBoundingClientRect().width
    } : null
    const itemData = items.map((el) => {
      const r = el.getBoundingClientRect()
      const label = el.querySelector('.tab-label')?.textContent?.trim()
      return {
        label,
        width: r.width,
        height: r.height,
        top: r.top,
        left: r.left
      }
    })
    return {
      barExists: !!bar,
      tabCount: items.length,
      barRect,
      tabs: itemData
    }
  })

  console.log(`✓ Tab Bar Sekme Sayısı: ${tabInfo.tabCount} (Beklenen: 4)`)
  tabInfo.tabs.forEach((t) => {
    console.log(`   - Sekme [${t.label}]: Genişlik: ${t.width.toFixed(1)}px, Yükseklik: ${t.height.toFixed(1)}px (>=44px: ${t.height >= 44})`)
  })

  // 1.3 Öne Çıkanlar Şeridi Ölçümü (375x640)
  const featStripMobile = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.feat-strip-card'))
    const priceElements = Array.from(document.querySelectorAll('.feat-strip-price'))
    const firstCard = cards[0]
    if (!firstCard) return null

    const cardRect = firstCard.getBoundingClientRect()
    const imgWrap = firstCard.querySelector('.feat-strip-img-wrap')
    const imgWrapRect = imgWrap ? imgWrap.getBoundingClientRect() : null
    const nameEl = firstCard.querySelector('.feat-strip-name')
    const nameRect = nameEl ? nameEl.getBoundingClientRect() : null
    const nameStyle = nameEl ? window.getComputedStyle(nameEl) : null

    return {
      cardCount: cards.length,
      priceCount: priceElements.length,
      cardRect: { width: cardRect.width, height: cardRect.height },
      imgWrapRect: imgWrapRect ? { width: imgWrapRect.width, height: imgWrapRect.height, ratio: imgWrapRect.width / imgWrapRect.height } : null,
      nameRect: nameRect ? { width: nameRect.width, height: nameRect.height } : null,
      nameStyle: nameStyle ? {
        fontSize: nameStyle.fontSize,
        lineHeight: nameStyle.lineHeight,
        webkitLineClamp: nameStyle.webkitLineClamp
      } : null
    }
  })

  console.log('✓ Öne Çıkanlar Şeridi (375x640):')
  console.log(`   - Fiyat etiketi sayısı: ${featStripMobile?.priceCount} (Beklenen: 0)`)
  console.log(`   - Görsel en-boy oranı: ${featStripMobile?.imgWrapRect?.ratio.toFixed(2)} (16:10 = 1.60)`)
  console.log(`   - Görsel boyutları: ${featStripMobile?.imgWrapRect?.width.toFixed(1)}x${featStripMobile?.imgWrapRect?.height.toFixed(1)}px`)
  console.log(`   - Ürün adı fontu: ${featStripMobile?.nameStyle?.fontSize}, satır yüksekliği: ${featStripMobile?.nameStyle?.lineHeight}, line-clamp: ${featStripMobile?.nameStyle?.webkitLineClamp}`)

  // Öne Çıkanlar Ekran Görüntüsü (375x640)
  const featScreenshotPath = path.join(SCREENSHOTS_DIR, '375x640-featured-strip.png')
  await page.screenshot({ path: featScreenshotPath })
  console.log(`   📸 Ekran görüntüsü kaydedildi: ${featScreenshotPath}`)

  // 1.4 Arama Paneli Açılması (375x640)
  console.log('\n--- Arama Paneli Testi (375x640) ---')
  await page.click('.tab-search-item')
  await new Promise((r) => setTimeout(r, 400))

  const searchOpenMeasurements = await page.evaluate(() => {
    const portalRoot = document.querySelector('.search-portal-root')
    const header = document.querySelector('.search-portal-header')
    const input = document.querySelector('.search-portal-input')
    const cancelBtn = document.querySelector('.btn-search-cancel')
    const chips = Array.from(document.querySelectorAll('.search-chip-btn'))
    const tabBar = document.querySelector('.mobile-tab-bar')

    const getR = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right }
    }

    const chipData = chips.map((c) => {
      const r = c.getBoundingClientRect()
      return { text: c.textContent.trim(), width: r.width, height: r.height }
    })

    return {
      portalRootParent: portalRoot ? portalRoot.parentElement.tagName : null,
      portalZIndex: portalRoot ? window.getComputedStyle(portalRoot).zIndex : null,
      tabBarVisible: tabBar ? window.getComputedStyle(tabBar).display !== 'none' : false,
      rootRect: getR(portalRoot),
      headerRect: getR(header),
      inputRect: getR(input),
      cancelRect: getR(cancelBtn),
      chips: chipData
    }
  })

  console.log(`✓ Portal Root Ebeveyni: ${searchOpenMeasurements.portalRootParent} (Beklenen: BODY)`)
  console.log(`✓ Portal z-index: ${searchOpenMeasurements.portalZIndex} (Beklenen: 100000)`)
  console.log(`✓ Tab Bar Açıkken Görünür mü: ${searchOpenMeasurements.tabBarVisible} (Beklenen: false)`)
  console.log(`✓ Arama Kutusu getBoundingClientRect: top=${searchOpenMeasurements.inputRect?.top.toFixed(1)}px, height=${searchOpenMeasurements.inputRect?.height.toFixed(1)}px, width=${searchOpenMeasurements.inputRect?.width.toFixed(1)}px`)
  console.log(`✓ Vazgeç Butonu getBoundingClientRect: width=${searchOpenMeasurements.cancelRect?.width.toFixed(1)}px, height=${searchOpenMeasurements.cancelRect?.height.toFixed(1)}px (>=44px: ${searchOpenMeasurements.cancelRect?.height >= 44})`)
  console.log(`✓ Popüler Çip Sayısı: ${searchOpenMeasurements.chips.length}`)
  searchOpenMeasurements.chips.forEach((c) => {
    console.log(`   - Çip [${c.text}]: Genişlik: ${c.width.toFixed(1)}px, Yükseklik: ${c.height.toFixed(1)}px (>=44px: ${c.height >= 44})`)
  })

  // Arama Açık Ekran Görüntüsü (375x640)
  const searchOpenScreenshotPath = path.join(SCREENSHOTS_DIR, '375x640-search-open.png')
  await page.screenshot({ path: searchOpenScreenshotPath })
  console.log(`   📸 Ekran görüntüsü kaydedildi: ${searchOpenScreenshotPath}`)

  // 1.5 Türkçe ve Aksan Duyarsız Arama Testi ("kasarli" -> "Kaşarlı Pide")
  console.log('\n--- Türkçe Normalizasyon Testi ("kasarli") ---')
  await page.type('.search-portal-input', 'kasarli')
  await new Promise((r) => setTimeout(r, 400))

  const searchResultsData = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.search-result-row'))
    return rows.map((r) => {
      const rect = r.getBoundingClientRect()
      const thumb = r.querySelector('.search-result-thumb-img')
      const thumbRect = thumb ? thumb.getBoundingClientRect() : null
      const name = r.querySelector('.search-result-name')?.textContent?.trim()
      const cat = r.querySelector('.search-result-cat')?.textContent?.trim()
      const price = r.querySelector('.search-result-price')?.textContent?.trim()
      return {
        name,
        cat,
        price,
        rowRect: { width: rect.width, height: rect.height, top: rect.top },
        thumbRect: thumbRect ? { width: thumbRect.width, height: thumbRect.height } : null
      }
    })
  })

  console.log(`✓ Bulunan sonuç sayısı: ${searchResultsData.length}`)
  searchResultsData.forEach((r) => {
    console.log(`   - [${r.name}] (${r.cat}, ${r.price}) -> Satır yüksekliği: ${r.rowRect.height.toFixed(1)}px, Görsel: ${r.thumbRect?.width.toFixed(1)}x${r.thumbRect?.height.toFixed(1)}px`)
  })

  const searchResultsScreenshotPath = path.join(SCREENSHOTS_DIR, '375x640-search-results.png')
  await page.screenshot({ path: searchResultsScreenshotPath })
  console.log(`   📸 Ekran görüntüsü kaydedildi: ${searchResultsScreenshotPath}`)

  // 1.6 Sonuca Dokunup Ürün Detay Paneli (Bottom Sheet) Açma Testi
  console.log('\n--- Sonuca Dokunma & Ürün Detayı (Bottom Sheet) Testi ---')
  await page.click('.search-result-row')
  await new Promise((r) => setTimeout(r, 400))

  const sheetData = await page.evaluate(() => {
    const sheet = document.querySelector('.bottom-sheet')
    const title = sheet?.querySelector('.sheet-title')?.textContent?.trim()
    const price = sheet?.querySelector('.sheet-price')?.textContent?.trim()
    const addToListBtn = sheet?.querySelector('.btn-add-sheet')
    const closeBtn = sheet?.querySelector('.sheet-close-btn')
    const tags = Array.from(sheet?.querySelectorAll('.tag-badge-pill') || []).map((t) => t.textContent.trim())
    const rect = sheet ? sheet.getBoundingClientRect() : null

    return {
      sheetExists: !!sheet,
      title,
      price,
      tags,
      hasAddToListBtn: !!addToListBtn,
      closeBtnExists: !!closeBtn,
      sheetRect: rect ? { width: rect.width, height: rect.height, top: rect.top } : null
    }
  })

  console.log(`✓ Ürün Bottom Sheet açıldı: ${sheetData.sheetExists}`)
  console.log(`✓ Ürün Adı: "${sheetData.title}"`)
  console.log(`✓ Ürün Fiyatı: "${sheetData.price}"`)
  console.log(`✓ Rozetler: [${sheetData.tags.join(', ')}]`)
  console.log(`✓ Listeme Ekle butonu var mı: ${sheetData.hasAddToListBtn} (Beklenen: false)`)
  console.log(`✓ Kapat butonu var mı: ${sheetData.closeBtnExists} (Beklenen: true)`)

  const bottomSheetScreenshotPath = path.join(SCREENSHOTS_DIR, '375x640-bottom-sheet.png')
  await page.screenshot({ path: bottomSheetScreenshotPath })
  console.log(`   📸 Ekran görüntüsü kaydedildi: ${bottomSheetScreenshotPath}`)

  // Bottom Sheet Kapat
  await page.click('.sheet-close-btn')
  await new Promise((r) => setTimeout(r, 400))

  // =========================================================================
  // 2. VIEWPORT: 360x700
  // =========================================================================
  console.log('\n--- 2. Mobil 360x700 İncelemesi ---')
  await page.setViewport({ width: 360, height: 700, deviceScaleFactor: 2 })
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 500))

  // Arama sekmesine tıkla
  await page.click('.tab-search-item')
  await new Promise((r) => setTimeout(r, 400))

  const search360OpenMeasurements = await page.evaluate(() => {
    const input = document.querySelector('.search-portal-input')
    const r = input?.getBoundingClientRect()
    return { top: r?.top, height: r?.height, width: r?.width }
  })
  console.log(`✓ 360x700 Arama Kutusu: top=${search360OpenMeasurements.top.toFixed(1)}px, height=${search360OpenMeasurements.height.toFixed(1)}px, width=${search360OpenMeasurements.width.toFixed(1)}px`)

  const search360ScreenshotPath = path.join(SCREENSHOTS_DIR, '360x700-search-open.png')
  await page.screenshot({ path: search360ScreenshotPath })
  console.log(`   📸 Ekran görüntüsü kaydedildi: ${search360ScreenshotPath}`)

  // Popüler çiplerden "İskender"e tıkla
  console.log('✓ Popüler çip tıklama: "İskender"')
  await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('.search-chip-btn'))
    const iskenderChip = chips.find((c) => c.textContent.includes('İskender'))
    if (iskenderChip) {
      iskenderChip.click()
    }
  })
  await new Promise((r) => setTimeout(r, 400))

  const iskenderResults = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.search-result-row'))
    return rows.map((r) => r.querySelector('.search-result-name')?.textContent?.trim())
  })
  console.log(`✓ "İskender" sonuçları: [${iskenderResults.join(', ')}]`)

  const search360ResultsScreenshotPath = path.join(SCREENSHOTS_DIR, '360x700-search-results.png')
  await page.screenshot({ path: search360ResultsScreenshotPath })
  console.log(`   📸 Ekran görüntüsü kaydedildi: ${search360ResultsScreenshotPath}`)

  // Vazgeç butonuna tıkla
  await page.click('.btn-search-cancel')
  await new Promise((r) => setTimeout(r, 300))

  // =========================================================================
  // 3. VIEWPORT: 1280x800 (Desktop)
  // =========================================================================
  console.log('\n--- 3. Masaüstü 1280x800 İncelemesi ---')
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 500))

  const featStripDesktop = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.feat-strip-card'))
    const priceElements = Array.from(document.querySelectorAll('.feat-strip-price'))
    const firstCard = cards[0]
    if (!firstCard) return null

    const cardRect = firstCard.getBoundingClientRect()
    const imgWrap = firstCard.querySelector('.feat-strip-img-wrap')
    const imgWrapRect = imgWrap ? imgWrap.getBoundingClientRect() : null
    const nameEl = firstCard.querySelector('.feat-strip-name')
    const nameRect = nameEl ? nameEl.getBoundingClientRect() : null
    const nameStyle = nameEl ? window.getComputedStyle(nameEl) : null

    return {
      cardCount: cards.length,
      priceCount: priceElements.length,
      cardRect: { width: cardRect.width, height: cardRect.height },
      imgWrapRect: imgWrapRect ? { width: imgWrapRect.width, height: imgWrapRect.height, ratio: imgWrapRect.width / imgWrapRect.height } : null,
      nameRect: nameRect ? { width: nameRect.width, height: nameRect.height } : null,
      nameStyle: nameStyle ? {
        fontSize: nameStyle.fontSize,
        lineHeight: nameStyle.lineHeight,
        webkitLineClamp: nameStyle.webkitLineClamp
      } : null
    }
  })

  console.log('✓ Masaüstü Öne Çıkanlar:')
  console.log(`   - Fiyat etiketi sayısı: ${featStripDesktop?.priceCount} (Beklenen: 0)`)
  console.log(`   - Görsel en-boy oranı: ${featStripDesktop?.imgWrapRect?.ratio.toFixed(2)} (16:10 = 1.60)`)
  console.log(`   - Kart boyutları: ${featStripDesktop?.cardRect?.width.toFixed(1)}x${featStripDesktop?.cardRect?.height.toFixed(1)}px`)
  console.log(`   - Ürün adı fontu: ${featStripDesktop?.nameStyle?.fontSize}, satır: ${featStripDesktop?.nameStyle?.lineHeight}`)

  const desktopFeatScreenshotPath = path.join(SCREENSHOTS_DIR, '1280x800-featured-strip.png')
  await page.screenshot({ path: desktopFeatScreenshotPath })
  console.log(`   📸 Ekran görüntüsü kaydedildi: ${desktopFeatScreenshotPath}`)

  await browser.close()
  console.log('\n✅ Tüm denetimler başarıyla tamamlandı!')
}

runAudit().catch((err) => {
  console.error('Hata:', err)
  process.exit(1)
})
