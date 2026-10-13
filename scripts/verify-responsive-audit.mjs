import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PATH_ALT = 'C:\\Users\\gulay\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';

const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : CHROME_PATH_ALT;

async function runAudit() {
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots', { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  const results = {
    viewports: {},
    metrics: {}
  };

  console.log('=== STARTING RESPONSIVE & UX AUDIT ===');

  // ----------------------------------------------------
  // TEST 1: 375x640 Viewport
  // ----------------------------------------------------
  console.log('\n--- Testing 375x640 Viewport ---');
  await page.setViewport({ width: 375, height: 640, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 600));

  // Measure First Fold
  const fold375 = await page.evaluate(() => {
    const header = document.querySelector('.mobile-app-header')?.getBoundingClientRect();
    const tabbar = document.querySelector('.mobile-tab-bar')?.getBoundingClientRect();
    const hero = document.querySelector('.menu-hero-video-section')?.getBoundingClientRect();
    const featStrip = document.querySelector('.feat-strip-section')?.getBoundingClientRect();
    const catBar = document.querySelector('.menu-bar-section')?.getBoundingClientRect();
    const firstImg = document.querySelector('.menu-card .card-media img')?.getBoundingClientRect();
    const firstCard = document.querySelector('.menu-card')?.getBoundingClientRect();

    const usableTop = header ? header.bottom : 56;
    const usableBottom = tabbar ? tabbar.top : 640 - 56;
    const usableHeight = usableBottom - usableTop;

    // Check how many pixels of first product image are visible inside usable area
    let imgVisiblePx = 0;
    if (firstImg) {
      const topInView = Math.max(firstImg.top, usableTop);
      const bottomInView = Math.min(firstImg.bottom, usableBottom);
      imgVisiblePx = Math.max(0, bottomInView - topInView);
    }

    // Cat bar fully visible if bottom <= usableBottom and top >= usableTop
    const catBarFullyVisible = catBar ? (catBar.bottom <= usableBottom && catBar.top >= usableTop) : false;

    // Search & compact lang button sizes
    const searchBtn = document.querySelector('.mobile-app-search-btn')?.getBoundingClientRect();
    const langBtn = document.querySelector('.lang-trigger-compact')?.getBoundingClientRect();
    const brandTitle = document.querySelector('.mobile-app-title')?.getBoundingClientRect();

    // Horizontal overflow check
    const docScrollWidth = document.documentElement.scrollWidth;
    const docClientWidth = document.documentElement.clientWidth;
    const hasHorizontalOverflow = docScrollWidth > docClientWidth;

    return {
      headerHeight: header?.height,
      tabbarHeight: tabbar?.height,
      usableHeight,
      heroHeight: hero?.height,
      featStripHeight: featStrip?.height,
      catBar: {
        top: catBar?.top,
        bottom: catBar?.bottom,
        height: catBar?.height,
        fullyVisible: catBarFullyVisible
      },
      firstImg: {
        top: firstImg?.top,
        bottom: firstImg?.bottom,
        height: firstImg?.height,
        visiblePxInFold: imgVisiblePx
      },
      searchBtn: { width: searchBtn?.width, height: searchBtn?.height },
      langBtn: { width: langBtn?.width, height: langBtn?.height },
      brandTitle: { width: brandTitle?.width, text: document.querySelector('.mobile-app-title')?.innerText },
      hasHorizontalOverflow,
      docScrollWidth,
      docClientWidth
    };
  });

  results.metrics['375x640_fold'] = fold375;
  console.log('375x640 Fold Measurements:');
  console.log(`- Header height: ${fold375.headerHeight}px`);
  console.log(`- Tab bar height: ${fold375.tabbarHeight}px`);
  console.log(`- Usable height: ${fold375.usableHeight}px`);
  console.log(`- Hero height: ${fold375.heroHeight}px (req <= 140px)`);
  console.log(`- Featured strip height: ${fold375.featStripHeight}px (req <= 170px)`);
  console.log(`- Category bar: top=${fold375.catBar.top}px, bottom=${fold375.catBar.bottom}px, fully visible=${fold375.catBar.fullyVisible}`);
  console.log(`- First product image visible pixels: ${fold375.firstImg.visiblePxInFold}px (req >= 100px)`);
  console.log(`- Search button size: ${fold375.searchBtn.width}x${fold375.searchBtn.height}px (req 44x44)`);
  console.log(`- Lang trigger size: ${fold375.langBtn.width}x${fold375.langBtn.height}px (req 44x44)`);
  console.log(`- Horizontal overflow: ${fold375.hasHorizontalOverflow} (scrollWidth=${fold375.docScrollWidth}, clientWidth=${fold375.docClientWidth})`);

  await page.screenshot({ path: 'screenshots/375x640-01-menu-first-fold.png' });

  // Open compact Language Switcher Sheet
  console.log('Testing Language Switcher Sheet on 375x640...');
  await page.evaluate(() => document.querySelector('.lang-trigger-compact')?.click());
  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: 'screenshots/375x640-02-lang-sheet.png' });
  // Close sheet
  await page.evaluate(() => document.querySelector('.lang-sheet-close')?.click());
  await new Promise((r) => setTimeout(r, 350));

  // Open Ara Panel (via Tab Bar "Ara")
  console.log('Testing Ara Panel (via Tab Bar "Ara") on 375x640...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.mobile-tab-item'));
    const araBtn = btns.find((b) => b.innerText.includes('Ara'));
    if (araBtn) araBtn.click();
  });
  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: 'screenshots/375x640-03-search-modal.png' });
  // Close search modal
  await page.evaluate(() => document.querySelector('.search-modal-close')?.click());
  await new Promise((r) => setTimeout(r, 350));

  // Open Listem Drawer
  console.log('Testing Listem Drawer on 375x640...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.mobile-tab-item'));
    const listBtn = btns.find((b) => b.innerText.includes('Listem'));
    if (listBtn) listBtn.click();
  });
  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: 'screenshots/375x640-04-listem-drawer.png' });
  await page.evaluate(() => document.querySelector('.list-drawer-close')?.click());
  await new Promise((r) => setTimeout(r, 350));

  // Open Bilgi Drawer
  console.log('Testing Bilgi Drawer on 375x640...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.mobile-tab-item'));
    const bilgiBtn = btns.find((b) => b.innerText.includes('Bilgi'));
    if (bilgiBtn) bilgiBtn.click();
  });
  await new Promise((r) => setTimeout(r, 450));

  const bilgiBlogCheck = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('.info-links-group .info-nav-link'));
    const blogIdx = links.findIndex((l) => l.getAttribute('href') === '/blog');
    const blogLink = links[blogIdx];
    const blogText = blogLink ? blogLink.innerText : '';
    const rect = blogLink ? blogLink.getBoundingClientRect() : null;
    return {
      blogPositionInGroup: blogIdx + 1,
      blogText,
      rect
    };
  });
  console.log('Bilgi Drawer Blog Link:', bilgiBlogCheck);
  await page.screenshot({ path: 'screenshots/375x640-05-bilgi-drawer.png' });

  await page.evaluate(() => document.querySelector('.info-drawer-close-btn')?.click());
  await new Promise((r) => setTimeout(r, 350));

  // Open Product Detail Bottom Sheet
  console.log('Testing Product Detail Bottom Sheet on 375x640...');
  await page.evaluate(() => document.querySelector('.menu-card')?.click());
  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: 'screenshots/375x640-06-bottom-sheet.png' });
  await page.evaluate(() => document.querySelector('.sheet-close-btn')?.click());
  await new Promise((r) => setTimeout(r, 350));

  // Navigate to Blog List (/blog)
  console.log('Testing /blog on 375x640...');
  await page.goto('http://localhost:5173/blog', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));
  const blogListMetrics375 = await page.evaluate(() => {
    const header = document.querySelector('.mobile-app-header')?.getBoundingClientRect();
    const kicker = document.querySelector('.blog-kicker')?.getBoundingClientRect();
    const pageEl = document.querySelector('.blog-page')?.getBoundingClientRect();
    const footer = document.querySelector('.site-footer')?.getBoundingClientRect();
    const readBtn = document.querySelector('.btn-blog-read')?.getBoundingClientRect();
    const summary = document.querySelector('.blog-card-summary')?.getBoundingClientRect();

    const docScrollWidth = document.documentElement.scrollWidth;
    const docClientWidth = document.documentElement.clientWidth;

    return {
      headerBottom: header?.bottom,
      kickerTop: kicker?.top,
      kickerText: document.querySelector('.blog-kicker')?.innerText,
      distanceFromHeaderToKicker: kicker ? kicker.top - header.bottom : null,
      summaryToButtonGap: readBtn && summary ? readBtn.top - summary.bottom : null,
      overflow: docScrollWidth > docClientWidth
    };
  });
  console.log('Blog List Metrics 375x640:', blogListMetrics375);
  await page.screenshot({ path: 'screenshots/375x640-07-blog-list.png' });

  // Navigate to Blog Post Detail
  console.log('Testing Blog Post Detail on 375x640...');
  await page.goto('http://localhost:5173/buyukadada-ezber-bozan-bir-lezzet-tasfirinlovemacun', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));
  const postMetrics375 = await page.evaluate(() => {
    const header = document.querySelector('.mobile-app-header')?.getBoundingClientRect();
    const backBtn = document.querySelector('.btn-back-blog')?.getBoundingClientRect();
    const bodyP = document.querySelector('.post-paragraph');
    const computedP = bodyP ? window.getComputedStyle(bodyP) : null;
    const container = document.querySelector('.blog-post-page');
    const computedContainer = container ? window.getComputedStyle(container) : null;

    const docScrollWidth = document.documentElement.scrollWidth;
    const docClientWidth = document.documentElement.clientWidth;

    return {
      backBtnTop: backBtn?.top,
      headerBottom: header?.bottom,
      fontSize: computedP?.fontSize,
      lineHeight: computedP?.lineHeight,
      paddingLeft: computedContainer?.paddingLeft,
      paddingRight: computedContainer?.paddingRight,
      overflow: docScrollWidth > docClientWidth
    };
  });
  console.log('Blog Post Detail Metrics 375x640:', postMetrics375);
  await page.screenshot({ path: 'screenshots/375x640-08-blog-post.png' });

  // Navigate to Hikayemiz on 375x640
  console.log('Testing Hikayemiz on 375x640...');
  await page.goto('http://localhost:5173/hikayemiz', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));
  const storyOverflow375 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('Hikayemiz horizontal overflow 375x640:', storyOverflow375);
  await page.screenshot({ path: 'screenshots/375x640-09-story.png' });

  // Navigate to İletişim on 375x640
  console.log('Testing İletişim on 375x640...');
  await page.goto('http://localhost:5173/iletisim', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));
  const contactOverflow375 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('İletişim horizontal overflow 375x640:', contactOverflow375);
  await page.screenshot({ path: 'screenshots/375x640-10-contact.png' });

  // ----------------------------------------------------
  // TEST 2: 360x700 Viewport
  // ----------------------------------------------------
  console.log('\n--- Testing 360x700 Viewport ---');
  await page.setViewport({ width: 360, height: 700, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 600));

  const fold360 = await page.evaluate(() => {
    const header = document.querySelector('.mobile-app-header')?.getBoundingClientRect();
    const tabbar = document.querySelector('.mobile-tab-bar')?.getBoundingClientRect();
    const hero = document.querySelector('.menu-hero-video-section')?.getBoundingClientRect();
    const featStrip = document.querySelector('.feat-strip-section')?.getBoundingClientRect();
    const catBar = document.querySelector('.menu-bar-section')?.getBoundingClientRect();
    const firstImg = document.querySelector('.menu-card .card-media img')?.getBoundingClientRect();

    const usableTop = header ? header.bottom : 56;
    const usableBottom = tabbar ? tabbar.top : 700 - 56;
    const usableHeight = usableBottom - usableTop;

    let imgVisiblePx = 0;
    if (firstImg) {
      const topInView = Math.max(firstImg.top, usableTop);
      const bottomInView = Math.min(firstImg.bottom, usableBottom);
      imgVisiblePx = Math.max(0, bottomInView - topInView);
    }
    const catBarFullyVisible = catBar ? (catBar.bottom <= usableBottom && catBar.top >= usableTop) : false;

    const docScrollWidth = document.documentElement.scrollWidth;
    const docClientWidth = document.documentElement.clientWidth;

    return {
      headerHeight: header?.height,
      tabbarHeight: tabbar?.height,
      usableHeight,
      heroHeight: hero?.height,
      featStripHeight: featStrip?.height,
      catBar: {
        top: catBar?.top,
        bottom: catBar?.bottom,
        height: catBar?.height,
        fullyVisible: catBarFullyVisible
      },
      firstImg: {
        top: firstImg?.top,
        bottom: firstImg?.bottom,
        height: firstImg?.height,
        visiblePxInFold: imgVisiblePx
      },
      hasHorizontalOverflow: docScrollWidth > docClientWidth
    };
  });

  results.metrics['360x700_fold'] = fold360;
  console.log('360x700 Fold Measurements:');
  console.log(`- Usable height: ${fold360.usableHeight}px`);
  console.log(`- Hero height: ${fold360.heroHeight}px`);
  console.log(`- Featured strip height: ${fold360.featStripHeight}px`);
  console.log(`- Category bar fully visible: ${fold360.catBar.fullyVisible}`);
  console.log(`- First product image visible pixels: ${fold360.firstImg.visiblePxInFold}px (req >= 100px)`);
  console.log(`- Horizontal overflow: ${fold360.hasHorizontalOverflow}`);

  await page.screenshot({ path: 'screenshots/360x700-01-menu-first-fold.png' });

  // Bilgi drawer on 360x700
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.mobile-tab-item'));
    const bilgiBtn = btns.find((b) => b.innerText.includes('Bilgi'));
    if (bilgiBtn) bilgiBtn.click();
  });
  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: 'screenshots/360x700-02-bilgi-drawer.png' });
  await page.evaluate(() => document.querySelector('.info-drawer-close-btn')?.click());
  await new Promise((r) => setTimeout(r, 350));

  // Lang sheet on 360x700
  await page.evaluate(() => document.querySelector('.lang-trigger-compact')?.click());
  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: 'screenshots/360x700-03-lang-sheet.png' });
  await page.evaluate(() => document.querySelector('.lang-sheet-close')?.click());
  await new Promise((r) => setTimeout(r, 350));

  // Blog list on 360x700
  await page.goto('http://localhost:5173/blog', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: 'screenshots/360x700-04-blog-list.png' });

  // Blog post on 360x700
  await page.goto('http://localhost:5173/buyukadada-ezber-bozan-bir-lezzet-tasfirinlovemacun', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: 'screenshots/360x700-05-blog-post.png' });

  // ----------------------------------------------------
  // TEST 3: Desktop 1280x800 Viewport
  // ----------------------------------------------------
  console.log('\n--- Testing Desktop 1280x800 Viewport ---');
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));

  // Verify desktop header navigation links
  const desktopNavLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('.top-bar-links.desktop-only a'));
    return links.map((l) => ({ text: l.innerText, href: l.getAttribute('href'), active: l.classList.contains('active') }));
  });
  console.log('Desktop Header Links:', desktopNavLinks);
  await page.screenshot({ path: 'screenshots/desktop-01-header-blog-link.png' });

  // Desktop Blog List (Single Post Layout)
  console.log('Testing Desktop Blog List on 1280x800...');
  await page.goto('http://localhost:5173/blog', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));

  const desktopBlogMetrics = await page.evaluate(() => {
    const isBlogLinkActive = Array.from(document.querySelectorAll('.top-bar-links.desktop-only a'))
      .find((l) => l.getAttribute('href') === '/blog')?.classList.contains('active');
    const card = document.querySelector('.blog-grid.blog-grid-single .blog-card')?.getBoundingClientRect();
    const mediaLink = document.querySelector('.blog-grid.blog-grid-single .blog-card-media-link')?.getBoundingClientRect();
    const body = document.querySelector('.blog-grid.blog-grid-single .blog-card-body')?.getBoundingClientRect();
    const summary = document.querySelector('.blog-card-summary');
    const computedSummary = summary ? window.getComputedStyle(summary) : null;
    const readBtn = document.querySelector('.btn-blog-read')?.getBoundingClientRect();

    return {
      isBlogLinkActive,
      cardWidth: card?.width,
      cardHeight: card?.height,
      mediaWidth: mediaLink?.width,
      mediaRatio: card && mediaLink ? (mediaLink.width / card.width).toFixed(2) : null,
      summaryFontSize: computedSummary?.fontSize,
      summaryLineHeight: computedSummary?.lineHeight,
      readBtnColor: window.getComputedStyle(document.querySelector('.btn-blog-read'))?.color
    };
  });
  console.log('Desktop Blog List Metrics:', desktopBlogMetrics);
  await page.screenshot({ path: 'screenshots/desktop-02-blog-list.png' });

  // Desktop Blog Post Detail
  console.log('Testing Desktop Blog Post on 1280x800...');
  await page.goto('http://localhost:5173/buyukadada-ezber-bozan-bir-lezzet-tasfirinlovemacun', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));

  const desktopPostMetrics = await page.evaluate(() => {
    const isBlogLinkActive = Array.from(document.querySelectorAll('.top-bar-links.desktop-only a'))
      .find((l) => l.getAttribute('href') === '/blog')?.classList.contains('active');
    const postContainer = document.querySelector('.blog-post-page')?.getBoundingClientRect();
    const bodyP = document.querySelector('.post-paragraph');
    const computedP = bodyP ? window.getComputedStyle(bodyP) : null;
    const menuBtn = document.querySelector('.btn-post-menu')?.getBoundingClientRect();
    const routeBtn = document.querySelector('.btn-post-route')?.getBoundingClientRect();

    return {
      isBlogLinkActive,
      containerWidth: postContainer?.width,
      fontSize: computedP?.fontSize,
      lineHeight: computedP?.lineHeight,
      hasBottomButtons: Boolean(menuBtn && routeBtn)
    };
  });
  console.log('Desktop Blog Post Metrics:', desktopPostMetrics);
  await page.screenshot({ path: 'screenshots/desktop-03-blog-post.png' });

  // 320px Width Overflow Check for Brand Name
  console.log('\n--- Checking 320px Brand Name Overflow ---');
  await page.setViewport({ width: 320, height: 600, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 400));
  const check320 = await page.evaluate(() => {
    const title = document.querySelector('.mobile-app-title')?.getBoundingClientRect();
    const docScrollWidth = document.documentElement.scrollWidth;
    const docClientWidth = document.documentElement.clientWidth;
    return {
      titleWidth: title?.width,
      hasHorizontalOverflow: docScrollWidth > docClientWidth,
      docScrollWidth,
      docClientWidth
    };
  });
  console.log('320px Check:', check320);

  await browser.close();
  console.log('\n=== AUDIT COMPLETE ===');
}

runAudit().catch(console.error);
