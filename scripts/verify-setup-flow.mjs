import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const CHROME_PATH = path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe')
const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH

const ROOT = path.resolve('.')
const TASFIRIN_DATA = path.join(ROOT, 'tasfirin-data')
const PUBLIC_YONETIM = path.join(ROOT, 'public', 'yonetim')

async function testSetup() {
  console.log('--- TESTING SETUP WIZARD & LOCKOUT ---\n')

  // 1. Setup için test anahtarı ve hash oluştur
  const testPlainKey = 'LM-TEST-9999-8888-7777-6666-5555'
  const testHash = crypto.createHash('sha256').update(testPlainKey).digest('hex')

  const hashFile = path.join(PUBLIC_YONETIM, 'install_hash.php')
  fs.writeFileSync(hashFile, `<?php define('SETUP_KEY_HASH', '${testHash}');\n`, 'utf8')

  // Geçici olarak lock ve users temizle (yedekleyerek)
  const usersFile = path.join(TASFIRIN_DATA, 'users.json')
  const backupUsers = fs.existsSync(usersFile) ? fs.readFileSync(usersFile, 'utf8') : null

  const lock1 = path.join(PUBLIC_YONETIM, 'setup.lock')
  const lock2 = path.join(PUBLIC_YONETIM, 'kurulum.lock')
  if (fs.existsSync(lock1)) fs.unlinkSync(lock1)
  if (fs.existsSync(lock2)) fs.unlinkSync(lock2)
  if (fs.existsSync(usersFile)) fs.unlinkSync(usersFile)

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 480, height: 750 })

  console.log('1. Navigating to setup.php...')
  await page.goto('http://localhost:5175/yonetim/setup.php', { waitUntil: 'networkidle0' })

  // Sayfa alanlarını incele
  const formState = await page.evaluate(() => {
    const userInp = document.getElementById('username')
    const passInp = document.getElementById('password')
    const hint = document.querySelector('.hint-warning')?.innerText || ''
    return {
      usernameVal: userInp ? userInp.value : null,
      usernamePlaceholder: userInp ? userInp.placeholder : null,
      passwordMinLength: passInp ? passInp.getAttribute('minlength') : null,
      warningText: hint
    }
  })

  console.log('Form State:', JSON.stringify(formState, null, 2))
  await page.screenshot({ path: 'scripts/setup-page-empty-user.png' })
  console.log('✓ Screenshot saved: scripts/setup-page-empty-user.png')

  // 2. Formu doldur ve gönder
  console.log('2. Submitting setup form...')
  await page.type('#setup_key', testPlainKey)
  await page.type('#username', 'isletme_muduru')
  await page.type('#password', 'GucluSifre2026!#')
  await page.type('#password_confirm', 'GucluSifre2026!#')

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('.btn-submit')
  ])

  await page.screenshot({ path: 'scripts/setup-success.png' })
  console.log('✓ Screenshot saved: scripts/setup-success.png')

  // 3. Kilit ve imha kontrolü
  const lock1Created = fs.existsSync(lock1)
  const lock2Created = fs.existsSync(lock2)
  const hashDestroyed = !fs.existsSync(hashFile)
  console.log(`Lock oluşturuldu mu (setup.lock): ${lock1Created ? 'EVET ✓' : 'HAYIR ✗'}`)
  console.log(`Lock oluşturuldu mu (kurulum.lock): ${lock2Created ? 'EVET ✓' : 'HAYIR ✗'}`)
  console.log(`install_hash.php imha edildi mi: ${hashDestroyed ? 'EVET ✓' : 'HAYIR ✗'}`)

  // 4. İkinci kez kuruluma izin veriliyor mu? (Lockout testi)
  console.log('4. Testing second installation prevention (lockout)...')
  await page.goto('http://localhost:5175/yonetim/setup.php', { waitUntil: 'networkidle0' })
  const lockoutState = await page.evaluate(() => {
    const heading = document.querySelector('h1')?.innerText || ''
    const alert = document.querySelector('.alert-info')?.innerText || ''
    return { heading, alert }
  })

  console.log('Lockout State:', JSON.stringify(lockoutState, null, 2))
  await page.screenshot({ path: 'scripts/setup-locked-out.png' })
  console.log('✓ Screenshot saved: scripts/setup-locked-out.png')

  // Temizlik: Orijinal users.json'u geri yükle (veya yeni kurulanı tut)
  if (backupUsers) {
    fs.writeFileSync(usersFile, backupUsers, 'utf8')
  }

  await browser.close()
  console.log('\n--- SETUP WIZARD TEST COMPLETED SUCCESSFULLY ---\n')
}

testSetup().catch(err => {
  console.error('Setup test error:', err)
  process.exit(1)
})
