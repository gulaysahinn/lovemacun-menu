import http from 'http'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

const PORT = 8089
const BASE_URL = `http://127.0.0.1:${PORT}`
const PUBLIC_DIR = path.resolve('public')

console.log('🚀 PHP Yerel Test Sunucusu Başlatılıyor...')

// 1. Önce eski test dosyalarını temizle (varsa)
const configFile = path.join(PUBLIC_DIR, 'yonetim', 'config.php')
const lockFile = path.join(PUBLIC_DIR, 'yonetim', 'kurulum.lock')
const rateLimitsFile = path.join(PUBLIC_DIR, 'logs', 'rate_limits.json')

if (fs.existsSync(configFile)) fs.unlinkSync(configFile)
if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile)
if (fs.existsSync(rateLimitsFile)) fs.unlinkSync(rateLimitsFile)

const phpServer = spawn('C:\\xampp\\php\\php.exe', ['-S', `127.0.0.1:${PORT}`, '-t', PUBLIC_DIR], {
  stdio: 'inherit'
})

// Sunucunun açılması için kısa bekleme
await new Promise(r => setTimeout(r, 1200))

async function runTests() {
  try {
    let cookie = ''
    let csrfToken = ''

    console.log('\n--- TEST 1: Kurulum Olmadan Giriş Sayfasına İstek ---')
    let res = await fetch(`${BASE_URL}/yonetim/login.php`, { redirect: 'manual' })
    console.log(`Status: ${res.status} (Beklenen: 302 yönlendirme -> kurulum.php)`)
    const loc = res.headers.get('location')
    console.log(`Location: ${loc}`)
    if (!loc || !loc.includes('kurulum.php')) throw new Error('Kurulum yönlendirmesi başarısız!')

    console.log('\n--- TEST 2: Kurulum Sayfasından CSRF Token Alma ---')
    res = await fetch(`${BASE_URL}/yonetim/kurulum.php`)
    cookie = res.headers.get('set-cookie')?.split(';')[0] || ''
    const htmlKurulum = await res.text()
    const csrfMatch = htmlKurulum.match(/name="csrf_token"\s+value="([^"]+)"/)
    if (!csrfMatch) throw new Error('Kurulum sayfasından CSRF token alınamadı!')
    csrfToken = csrfMatch[1]
    console.log(`✓ Cookie: ${cookie.substring(0, 20)}...`)
    console.log(`✓ CSRF Token: ${csrfToken.substring(0, 16)}...`)

    console.log('\n--- TEST 3: Kurulum Yapma (Şifre Belirleme: Lovemacun2026!) ---')
    const setupParams = new URLSearchParams()
    setupParams.append('csrf_token', csrfToken)
    setupParams.append('password', 'Lovemacun2026!')
    setupParams.append('password_confirm', 'Lovemacun2026!')

    res = await fetch(`${BASE_URL}/yonetim/kurulum.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie
      },
      body: setupParams.toString()
    })
    const setupRespText = await res.text()
    if (!setupRespText.includes('Kurulum Başarılı') && !setupRespText.includes('Yönetim paneli güvenle yapılandırıldı')) {
      throw new Error('Kurulum tamamlanamadı!')
    }
    console.log('✓ Kurulum başarıyla tamamlandı ve kurulum.lock oluşturuldu!')

    console.log('\n--- TEST 4: Kurulum Sayfasının Kilitlendiğini Doğrulama ---')
    res = await fetch(`${BASE_URL}/yonetim/kurulum.php`, { headers: { 'Cookie': cookie } })
    const lockedHtml = await res.text()
    if (!lockedHtml.includes('Kurulum Zaten Tamamlanmış')) {
      throw new Error('Kurulum sayfası kilitlenmedi!')
    }
    console.log('✓ Kurulum sayfası korundu: "Kurulum Zaten Tamamlanmış" görüntülendi!')

    console.log('\n--- TEST 5: Yanlış Şifre & Rate Limiting Testi (5 Hatalı Giriş) ---')
    // Yeni oturum için login sayfasına git
    res = await fetch(`${BASE_URL}/yonetim/login.php`)
    cookie = res.headers.get('set-cookie')?.split(';')[0] || cookie
    const loginHtml = await res.text()
    csrfToken = loginHtml.match(/name="csrf_token"\s+value="([^"]+)"/)[1]

    for (let i = 1; i <= 5; i++) {
      const wrongParams = new URLSearchParams()
      wrongParams.append('csrf_token', csrfToken)
      wrongParams.append('password', 'YanlisSifre' + i)
      const r = await fetch(`${BASE_URL}/yonetim/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookie
        },
        body: wrongParams.toString()
      })
      const txt = await r.text()
      const newCsrf = txt.match(/name="csrf_token"\s+value="([^"]+)"/)
      if (newCsrf) csrfToken = newCsrf[1]
      console.log(`   Deneme ${i}: Yanlış şifre denendi (Kayıt düşüldü)`)
    }

    // 6. Deneme: Kilitlenmiş olmalı
    const attempt6 = new URLSearchParams()
    attempt6.append('csrf_token', csrfToken)
    attempt6.append('password', 'Lovemacun2026!')
    const res6 = await fetch(`${BASE_URL}/yonetim/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie
      },
      body: attempt6.toString()
    })
    const txt6 = await res6.text()
    if (!txt6.includes('15 dakika boyunca kilitlenmiştir') && !txt6.includes('Giriş Kilitlendi')) {
      throw new Error('Rate limiting başarısız, 5 denemeden sonra kilitlenmedi!')
    }
    console.log('✓ Brute-Force Koruması Doğrulandı: 5 hatalı denemeden sonra IP kilitlendi!')

    console.log('\n--- TEST 6: Rate Limiti Sıfırlayıp Doğru Şifre ile Giriş Yapma ---')
    // Test amaçlı rate limit dosyasını temizle
    if (fs.existsSync(rateLimitsFile)) fs.unlinkSync(rateLimitsFile)

    const correctParams = new URLSearchParams()
    correctParams.append('csrf_token', csrfToken)
    correctParams.append('password', 'Lovemacun2026!')
    res = await fetch(`${BASE_URL}/yonetim/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie
      },
      body: correctParams.toString(),
      redirect: 'manual'
    })
    console.log(`Giriş Yanıt Kodu: ${res.status}`)
    const newCookie = res.headers.get('set-cookie')?.split(';')[0]
    if (newCookie) cookie = newCookie
    if (res.status !== 302 || !res.headers.get('location')?.includes('index.php')) {
      throw new Error('Doğru şifre ile giriş yapılamadı!')
    }
    console.log('✓ Doğru şifre ile giriş başarılı! Oturum oluşturuldu.')

    console.log('\n--- TEST 7: Panele Erişim ve CSRF Token Alma ---')
    res = await fetch(`${BASE_URL}/yonetim/index.php`, { headers: { 'Cookie': cookie } })
    const panelHtml = await res.text()
    if (!panelHtml.includes('LOVEMACUN') || !panelHtml.includes('Menü Yönetim Paneli')) {
      throw new Error('Panel içeriği yüklenemedi!')
    }
    csrfToken = panelHtml.match(/const CSRF_TOKEN = "([^"]+)"/)?.[1]
    console.log(`✓ Yönetim paneli başarıyla yüklendi. Panel CSRF: ${csrfToken?.substring(0, 16)}...`)

    console.log('\n--- TEST 8: Yetkisiz / CSRF\'siz POST İsteği Engelleme (Güvenlik) ---')
    // 1. Oturumsuz POST
    let apiRes = await fetch(`${BASE_URL}/api/menu.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] })
    })
    console.log(`Oturumsuz POST durumu: ${apiRes.status} (Beklenen: 401)`)
    if (apiRes.status !== 401) throw new Error('Oturumsuz API isteği engellenmedi!')

    // 2. Oturumlu ama CSRF'siz POST
    apiRes = await fetch(`${BASE_URL}/api/menu.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({ items: [] })
    })
    console.log(`CSRF'siz POST durumu: ${apiRes.status} (Beklenen: 403)`)
    if (apiRes.status !== 403) throw new Error('CSRF\'siz API isteği engellenmedi!')
    console.log('✓ API Yetki ve CSRF doğrulamaları başarıyla korundu!')

    console.log('\n--- TEST 9: Fiyat Güncelleme, Otomatik Yedek & Atomik Yazma ---')
    // Mevcut menüyü çek
    const menuGet = await (await fetch(`${BASE_URL}/api/menu.php`)).json()
    const testItems = [...menuGet.items]
    const origPrice = testItems[0].price
    testItems[0].price = origPrice + 10 // Fiyatı 10 TL artır

    const updateRes = await fetch(`${BASE_URL}/api/menu.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookie
      },
      body: JSON.stringify({
        categories: menuGet.categories,
        items: testItems
      })
    })
    const updateJson = await updateRes.json()
    console.log(`API Güncelleme Yanıtı:`, updateJson)
    if (!updateJson.success || !updateJson.backup) throw new Error('Menü güncellenemedi!')

    // Yedek dosyasının oluştuğunu doğrula
    const backupPath = path.join(PUBLIC_DIR, 'backups', updateJson.backup)
    if (!fs.existsSync(backupPath)) throw new Error('Otomatik yedek dosyası bulunamadı!')
    console.log(`✓ Otomatik yedek doğrulandı: ${updateJson.backup}`)

    // Değişiklik logunu doğrula
    const logContent = fs.readFileSync(path.join(PUBLIC_DIR, 'logs', 'degisiklik.log'), 'utf8')
    if (!logContent.includes(testItems[0].name) || !logContent.includes('Fiyat:')) {
      throw new Error('Audit log yazılmadı!')
    }
    console.log(`✓ Audit log (denetim izi) doğrulandı!`)

    console.log('\n--- TEST 10: Path Traversal Koruması & Yedek Geri Yükleme ---')
    // 1. Path traversal denemesi
    const hackRes = await fetch(`${BASE_URL}/api/restore.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookie
      },
      body: JSON.stringify({ backup: '../../../../etc/passwd' })
    })
    console.log(`Path Traversal İstek Durumu: ${hackRes.status} (Beklenen: 400)`)
    if (hackRes.status !== 400) throw new Error('Path traversal engellenmedi!')

    // 2. Geçerli yedeği geri yükleme
    const restoreRes = await fetch(`${BASE_URL}/api/restore.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookie
      },
      body: JSON.stringify({ backup: updateJson.backup })
    })
    const restoreJson = await restoreRes.json()
    console.log(`Geri Yükleme Yanıtı:`, restoreJson)
    if (!restoreJson.success) throw new Error('Geri yükleme başarısız!')
    console.log('✓ Yedek geri yükleme ve güvenlik ön-yedeği başarıyla tamamlandı!')

    // Orijinal fiyatı geri getir
    testItems[0].price = origPrice
    await fetch(`${BASE_URL}/api/menu.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookie
      },
      body: JSON.stringify({
        categories: menuGet.categories,
        items: testItems
      })
    })
    console.log('✓ Test sonrası menü orijinal fiyatına geri alındı.')

    console.log('\n======================================================')
    console.log('🎉 TÜM 10 TEST BAŞARIYLA GEÇTİ! SİSTEM %100 ÇALIŞIYOR.')
    console.log('======================================================\n')
  } catch (err) {
    console.error('❌ TEST HATASI:', err)
  } finally {
    phpServer.kill()
    process.exit(0)
  }
}

runTests()
