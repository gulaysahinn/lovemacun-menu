import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe');

async function testMap() {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  const embedUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3015.4074218356877!2d29.125841776510344!3d40.87357767137025!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cac1df6857961f%3A0x8e6f8355a0cf344e!2sTa%C5%9Ff%C4%B1r%C4%B1n%20LoveMacun!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background: #120b08; }
        .wrap { width: 600px; height: 420px; margin: 40px auto; border-radius: 16px; overflow: hidden; position: relative; border: 1px solid #442; }
        iframe { width: 100%; height: 100%; border: 0; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <iframe src="${embedUrl}"></iframe>
      </div>
    </body>
    </html>
  `;
  await page.setContent(html);
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'scripts/official-embed-test.png' });
  console.log('Saved official-embed-test.png');
  await browser.close();
}

testMap().catch(console.error);
