import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe');

async function verify() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const report = {};

  // =========================================================================
  // 1. İLETİŞİM SAYFASI TESTİ (1280px & 375px)
  // =========================================================================
  report.contact = {};

  for (const w of [1280, 375]) {
    await page.setViewport({ width: w, height: 850, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/iletisim', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    const metrics = await page.evaluate(() => {
      const sub = document.querySelector('.contact-sub');
      const mapContainer = document.querySelector('.map-container');
      const mapBtn = document.querySelector('.btn-map-fullwidth');
      const subRect = sub.getBoundingClientRect();
      const mapRect = mapContainer.getBoundingClientRect();
      const btnRect = mapBtn ? mapBtn.getBoundingClientRect() : null;

      return {
        subBottom: subRect.bottom,
        mapTop: mapRect.top,
        actualGap: Math.round(mapRect.top - subRect.bottom),
        mapWidth: Math.round(mapRect.width),
        mapHeight: Math.round(mapRect.height),
        btnWidth: btnRect ? Math.round(btnRect.width) : null,
        btnAlignDiff: btnRect ? Math.abs(Math.round(btnRect.width - mapRect.width)) : null,
      };
    });

    report.contact[`w${w}`] = metrics;
    const shotPath = `scripts/verification-contact-${w}.png`;
    await page.screenshot({ path: shotPath });
    report.contact[`shot_${w}`] = shotPath;
  }

  // =========================================================================
  // 2 & 3. HİKAYEMİZ TESTİ (1280px & 375px)
  // =========================================================================
  report.story = {};

  for (const w of [1280, 375]) {
    await page.setViewport({ width: w, height: 850, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/hikayemiz', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    const metrics = await page.evaluate(() => {
      // Stats values
      const statCards = Array.from(document.querySelectorAll('.about-stat-card b'));
      const statTexts = statCards.map(el => el.textContent.trim());

      // Small value cards font size
      const valSpans = Array.from(document.querySelectorAll('.story-val-info span'));
      const valFontSizes = valSpans.map(el => window.getComputedStyle(el).fontSize);

      // Tradition cards padding
      const tradCards = Array.from(document.querySelectorAll('.tradition-card'));
      const tradMetrics = tradCards.map(c => {
        const cs = window.getComputedStyle(c);
        const rect = c.getBoundingClientRect();
        return {
          title: c.querySelector('.tradition-card-title')?.textContent.trim(),
          paddingTop: cs.paddingTop,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft,
          paddingRight: cs.paddingRight,
          height: Math.round(rect.height),
        };
      });

      // Photo caption
      const captionCard = document.querySelector('.story-photo-caption-card');
      const captionRect = captionCard ? captionCard.getBoundingClientRect() : null;
      const photoFrame = document.querySelector('.story-photo-frame');
      const photoRect = photoFrame ? photoFrame.getBoundingClientRect() : null;

      return {
        statTexts,
        valFontSizes,
        tradMetrics,
        captionBelowPhoto: captionRect && photoRect ? captionRect.top >= photoRect.bottom : false,
      };
    });

    report.story[`w${w}`] = metrics;
    const shotPath = `scripts/verification-story-${w}.png`;
    await page.screenshot({ path: shotPath });
    report.story[`shot_${w}`] = shotPath;
  }

  // =========================================================================
  // 4. ANA SAYFA TESTİ (1280px & 375px)
  // =========================================================================
  report.home = {};

  // 1280px Desktop
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const desktopHome = await page.evaluate(() => {
    const featHead = document.querySelector('.feat-strip-head');
    const featScroll = document.querySelector('.feat-strip-scroll');
    const featCards = Array.from(document.querySelectorAll('.feat-strip-card'));
    const menuGrid = document.querySelector('.menu-products-main .grid');
    const menuCards = Array.from(document.querySelectorAll('.menu-card'));
    const nextCatBtn = document.querySelector('.btn-next-category');
    const nextCatWrap = document.querySelector('.next-category-wrap');
    const footer = document.querySelector('footer');

    const featHeadRect = featHead ? featHead.getBoundingClientRect() : null;
    const featScrollRect = featScroll ? featScroll.getBoundingClientRect() : null;
    const gridRect = menuGrid ? menuGrid.getBoundingClientRect() : null;
    const btnRect = nextCatBtn ? nextCatBtn.getBoundingClientRect() : null;
    const footerRect = footer ? footer.getBoundingClientRect() : null;

    // Check columns of feat-strip-scroll at 1280px
    const featGridCols = window.getComputedStyle(featScroll).gridTemplateColumns;

    // Button to footer gap
    const btnToFooterGap = footerRect && btnRect ? Math.round(footerRect.top - btnRect.bottom) : null;

    return {
      featHeadX: featHeadRect ? Math.round(featHeadRect.left) : null,
      featScrollX: featScrollRect ? Math.round(featScrollRect.left) : null,
      menuGridX: gridRect ? Math.round(gridRect.left) : null,
      featCardCount: featCards.length,
      featCardWidth: featCards[0] ? Math.round(featCards[0].getBoundingClientRect().width) : null,
      menuCardWidth: menuCards[0] ? Math.round(menuCards[0].getBoundingClientRect().width) : null,
      featGridCols,
      nextCatBtnText: nextCatBtn ? nextCatBtn.textContent.trim() : null,
      btnToFooterGap,
    };
  });
  report.home.desktop = desktopHome;
  const shotHomeDesktop = 'scripts/verification-home-1280.png';
  await page.screenshot({ path: shotHomeDesktop });
  report.home.shot_1280 = shotHomeDesktop;

  // 375px Mobile
  await page.setViewport({ width: 375, height: 750, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const mobileHome = await page.evaluate(() => {
    const featScroll = document.querySelector('.feat-strip-scroll');
    const featNames = Array.from(document.querySelectorAll('.feat-strip-name')).map(el => {
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        text: el.textContent.trim(),
        lineClamp: cs.webkitLineClamp,
        height: Math.round(rect.height),
      };
    });

    const tabs = document.querySelector('.tabs');
    const searchBtn = document.querySelector('.tab-sticky-search');
    const tabsRect = tabs ? tabs.getBoundingClientRect() : null;
    const searchRect = searchBtn ? searchBtn.getBoundingClientRect() : null;
    const tabsCs = tabs ? window.getComputedStyle(tabs) : null;

    const nextCatBtn = document.querySelector('.btn-next-category');
    const footer = document.querySelector('footer');
    const btnRect = nextCatBtn ? nextCatBtn.getBoundingClientRect() : null;
    const footerRect = footer ? footer.getBoundingClientRect() : null;
    const btnToFooterGap = footerRect && btnRect ? Math.round(footerRect.top - btnRect.bottom) : null;

    return {
      featOverflowX: featScroll ? window.getComputedStyle(featScroll).overflowX : null,
      featNames,
      tabsPaddingRight: tabsCs ? tabsCs.paddingRight : null,
      searchBtnWidth: searchRect ? Math.round(searchRect.width) : null,
      nextCatBtnText: nextCatBtn ? nextCatBtn.textContent.trim() : null,
      btnToFooterGap,
    };
  });
  report.home.mobile = mobileHome;

  // Mobile screenshots: First fold (hero), Menu cards
  await page.screenshot({ path: 'scripts/verification-home-375-fold1.png' });
  report.home.shot_375_hero = 'scripts/verification-home-375-fold1.png';

  // Scroll to menu cards and take screenshot
  await page.evaluate(() => {
    const el = document.getElementById('kategoriler');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scripts/verification-home-375-menu.png' });
  report.home.shot_375_menu = 'scripts/verification-home-375-menu.png';

  // Test next category click
  const testClickNext = await page.evaluate(() => {
    const btn = document.querySelector('.btn-next-category');
    const beforeText = btn ? btn.textContent.trim() : null;
    if (btn) btn.click();
    return { beforeText };
  });
  await new Promise(r => setTimeout(r, 1000));
  const afterClick = await page.evaluate(() => {
    const activeChip = document.querySelector('.tab-chip.act');
    const btn = document.querySelector('.btn-next-category');
    return {
      activeCatName: activeChip ? activeChip.textContent.trim() : null,
      nextBtnTextAfter: btn ? btn.textContent.trim() : null,
    };
  });
  report.home.nextCatClickTest = { testClickNext, afterClick };

  await browser.close();

  fs.writeFileSync('scripts/verification-report.json', JSON.stringify(report, null, 2));
  console.log('Verification completed successfully!');
  console.log(JSON.stringify(report, null, 2));
}

verify().catch(console.error);
