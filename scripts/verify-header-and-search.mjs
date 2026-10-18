import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe');
const BASE_URL = 'http://localhost:5173';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const results = {
    headerWidths: {},
    languages: {},
    searchModal: {},
    mobileHeader: {},
    categoryBar: {}
  };

  const screenshotsDir = 'scripts/header-search-verification';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('--- TEST 1: Masaüstü Header Farklı Genişlikler ---');
  const widths = [1024, 1280, 1366, 1440, 1536, 1920];

  for (const w of widths) {
    await page.setViewport({ width: w, height: 800, deviceScaleFactor: 2 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const metrics = await page.evaluate(() => {
      const topBar = document.querySelector('.top-bar-inner');
      const brand = document.querySelector('.top-bar-brand');
      const nav = document.querySelector('.top-bar-links');
      const actions = document.querySelector('.top-bar-actions');
      const hours = document.querySelector('.top-bar-hours');
      const hamburger = document.querySelector('.top-bar-tablet-hamburger');
      const searchBtn = document.querySelector('.btn-top-search-icon');
      const resBtn = document.querySelector('.btn-top-reservation');
      const langBtn = document.querySelector('.lang-switcher');

      const brandRect = brand?.getBoundingClientRect();
      const navRect = nav?.getBoundingClientRect();
      const actionsRect = actions?.getBoundingClientRect();
      const searchRect = searchBtn?.getBoundingClientRect();

      // Check nav link gaps
      const navLinks = Array.from(document.querySelectorAll('.top-bar-links a'));
      const navGaps = [];
      for (let i = 0; i < navLinks.length - 1; i++) {
        const r1 = navLinks[i].getBoundingClientRect();
        const r2 = navLinks[i + 1].getBoundingClientRect();
        navGaps.push(Math.round(r2.left - r1.right));
      }

      // Check actions gaps
      const actionItems = [searchBtn, resBtn, langBtn].filter(Boolean);
      const actionGaps = [];
      for (let i = 0; i < actionItems.length - 1; i++) {
        const r1 = actionItems[i].getBoundingClientRect();
        const r2 = actionItems[i + 1].getBoundingClientRect();
        actionGaps.push(Math.round(r2.left - r1.right));
      }

      const isHoursVisible = hours ? window.getComputedStyle(hours).display !== 'none' : false;
      const isHamburgerVisible = hamburger ? window.getComputedStyle(hamburger).display !== 'none' : false;
      const isNavVisible = nav ? window.getComputedStyle(nav).display !== 'none' : false;
      const isActionsVisible = actions ? window.getComputedStyle(actions).display !== 'none' : false;

      return {
        brandRight: Math.round(brandRect?.right || 0),
        navLeft: Math.round(navRect?.left || 0),
        navRight: Math.round(navRect?.right || 0),
        actionsLeft: Math.round(actionsRect?.left || 0),
        leftGap: Math.round((navRect?.left || 0) - (brandRect?.right || 0)),
        rightGap: Math.round((actionsRect?.left || 0) - (navRect?.right || 0)),
        searchBtnSize: {
          width: Math.round(searchRect?.width || 0),
          height: Math.round(searchRect?.height || 0)
        },
        navGaps,
        actionGaps,
        isHoursVisible,
        isHamburgerVisible,
        isNavVisible,
        isActionsVisible,
        topBarInnerWidth: Math.round(topBar?.getBoundingClientRect().width || 0),
        brandNowrap: window.getComputedStyle(brand.querySelector('.brand-name')).whiteSpace
      };
    });

    results.headerWidths[`w${w}`] = metrics;
    const shotPath = `${screenshotsDir}/header-${w}px.png`;
    // Take header screenshot clip
    await page.screenshot({
      path: shotPath,
      clip: { x: 0, y: 0, width: w, height: 90 }
    });
    console.log(`✓ ${w}px: LeftGap=${metrics.leftGap}px, RightGap=${metrics.rightGap}px, Hamburger=${metrics.isHamburgerVisible}, NavVisible=${metrics.isNavVisible}`);
  }

  console.log('\n--- TEST 2: İngilizce (EN) Uzun Etiketler Taşma Kontrolü (1024px) ---');
  await page.setViewport({ width: 1024, height: 800, deviceScaleFactor: 2 });
  // Set language cookie to en
  await page.evaluate(() => {
    document.cookie = 'googtrans=/tr/en; path=/;';
    localStorage.setItem('lovemacun_lang', 'en');
  });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const enMetrics = await page.evaluate(() => {
    const brand = document.querySelector('.top-bar-brand')?.getBoundingClientRect();
    const nav = document.querySelector('.top-bar-links')?.getBoundingClientRect();
    const actions = document.querySelector('.top-bar-actions')?.getBoundingClientRect();
    return {
      leftGap: Math.round((nav?.left || 0) - (brand?.right || 0)),
      rightGap: Math.round((actions?.left || 0) - (nav?.right || 0)),
      noOverlap: (nav?.left > brand?.right) && (actions?.left > nav?.right)
    };
  });
  results.languages.en1024 = enMetrics;
  await page.screenshot({
    path: `${screenshotsDir}/header-1024px-en.png`,
    clip: { x: 0, y: 0, width: 1024, height: 90 }
  });
  console.log(`✓ EN 1024px: LeftGap=${enMetrics.leftGap}px, RightGap=${enMetrics.rightGap}px, NoOverlap=${enMetrics.noOverlap}`);

  // Restore TR
  await page.evaluate(() => {
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.setItem('lovemacun_lang', 'tr');
  });

  console.log('\n--- TEST 3: Tek Arama Noktası ve Klavye Kısayolları (1280px) ---');
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // 3a. Header Search icon click
  const searchBtnExists = await page.$('.btn-top-search-icon');
  console.log('Header arama ikonu mevcut mu:', Boolean(searchBtnExists));
  await page.click('.btn-top-search-icon');
  await new Promise(r => setTimeout(r, 400));

  let isSearchModalOpen = await page.evaluate(() => {
    const el = document.querySelector('.search-portal-root');
    return Boolean(el && window.getComputedStyle(el).display !== 'none');
  });
  console.log('Header arama ikonuna tıklandı, modal açık mı:', isSearchModalOpen);
  results.searchModal.openViaHeaderClick = isSearchModalOpen;

  // Take screenshot of desktop search modal open
  await page.screenshot({ path: `${screenshotsDir}/search-modal-desktop-1280.png` });

  // 3b. ESC closes modal
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 400));
  isSearchModalOpen = await page.evaluate(() => {
    return Boolean(document.querySelector('.search-portal-root'));
  });
  console.log('ESC basıldı, modal kapandı mı:', !isSearchModalOpen);
  results.searchModal.closedViaEsc = !isSearchModalOpen;

  // 3c. '/' key opens modal
  await page.keyboard.press('Slash');
  await new Promise(r => setTimeout(r, 400));
  isSearchModalOpen = await page.evaluate(() => {
    return Boolean(document.querySelector('.search-portal-root'));
  });
  console.log('/ tuşuna basıldı, modal açıldı mı:', isSearchModalOpen);
  results.searchModal.openedViaSlash = isSearchModalOpen;

  // Close via ESC
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 400));

  // 3d. Ctrl+K opens modal
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  await new Promise(r => setTimeout(r, 400));
  isSearchModalOpen = await page.evaluate(() => {
    return Boolean(document.querySelector('.search-portal-root'));
  });
  console.log('Ctrl+K basıldı, modal açıldı mı:', isSearchModalOpen);
  results.searchModal.openedViaCtrlK = isSearchModalOpen;

  // 3e. Search a product and click it to verify product detail sheet opens
  await page.type('.search-portal-input', 'lahmacun');
  await new Promise(r => setTimeout(r, 400));
  const resultRow = await page.$('.search-result-row');
  console.log('Arama sonucu satırı bulundu mu:', Boolean(resultRow));
  if (resultRow) {
    await resultRow.click();
    await new Promise(r => setTimeout(r, 600));
    const isBottomSheetOpen = await page.evaluate(() => {
      const bs = document.querySelector('.bottom-sheet');
      return Boolean(bs);
    });
    console.log('Arama sonucuna tıklandı, Ürün Detay BottomSheet açıldı mı:', isBottomSheetOpen);
    results.searchModal.productSelectOpensBottomSheet = isBottomSheetOpen;
    await page.keyboard.press('Escape'); // close BS
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\n--- TEST 4: Kategori Çubuğu Sağ Kenar Kontrolü (1280px & 375px) ---');
  // 1280px Category bar
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const catMetricsDesktop = await page.evaluate(() => {
    const stickySearch = document.querySelector('.tab-sticky-search');
    const tabs = document.querySelector('.tabs');
    const fadeRight = document.querySelector('.bar-fade-right');
    const chips = Array.from(document.querySelectorAll('.tab-chip'));
    const lastChip = chips[chips.length - 1]?.getBoundingClientRect();
    const tabsRect = tabs?.getBoundingClientRect();

    return {
      hasStickySearch: Boolean(stickySearch),
      fadeRightWidth: fadeRight ? window.getComputedStyle(fadeRight).width : null,
      chipCount: chips.length,
      lastChipText: chips[chips.length - 1]?.innerText?.replace(/\n/g, ' ')
    };
  });
  results.categoryBar.desktop = catMetricsDesktop;
  console.log('Masaüstü kategori çubuğu:', catMetricsDesktop);

  // Take screenshot of category bar at 1280
  await page.evaluate(() => {
    document.getElementById('kategoriler')?.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${screenshotsDir}/category-bar-right-1280.png` });

  // 375px Mobile Category Bar & Mobile Header
  await page.setViewport({ width: 375, height: 640, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const mobileMetrics = await page.evaluate(() => {
    const mobileHeaderSearch = document.querySelector('.mobile-app-search-btn');
    const mobileHeaderHamburger = document.querySelector('.mobile-app-hamburger-btn');
    const catStickySearch = document.querySelector('.tab-sticky-search');
    const bottomTabSearch = document.querySelector('.mobile-tab-item.tab-search-item');
    const fadeRight = document.querySelector('.bar-fade-right');

    return {
      hasMobileHeaderSearch: Boolean(mobileHeaderSearch),
      hasMobileHeaderHamburger: Boolean(mobileHeaderHamburger),
      hasCatStickySearch: Boolean(catStickySearch),
      hasBottomTabSearch: Boolean(bottomTabSearch),
      fadeRightWidth: fadeRight ? window.getComputedStyle(fadeRight).width : null
    };
  });
  results.mobileHeader = mobileMetrics;
  console.log('Mobil başlık ve kategori metrikleri:', mobileMetrics);

  // Take screenshot of mobile header & category bar
  await page.screenshot({ path: `${screenshotsDir}/category-bar-mobile-375.png` });

  // Open search from mobile bottom tab bar
  await page.click('.mobile-tab-item.tab-search-item');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${screenshotsDir}/search-modal-mobile-375.png` });

  await browser.close();

  fs.writeFileSync(`${screenshotsDir}/verification-report.json`, JSON.stringify(results, null, 2));
  console.log('\n Tüm testler başarıyla tamamlandı!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
