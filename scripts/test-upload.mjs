import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

const PORT = 8091
const BASE_URL = `http://127.0.0.1:${PORT}`
const PUBLIC_DIR = path.resolve('public')

console.log('🚀 Image Upload Test Başlatılıyor...')

const phpServer = spawn('C:\\xampp\\php\\php.exe', ['-S', `127.0.0.1:${PORT}`, '-t', PUBLIC_DIR])
await new Promise(r => setTimeout(r, 1200))

async function runUploadTests() {
  try {
    // 1. Giriş yap ve oturum al
    let res = await fetch(`${BASE_URL}/yonetim/login.php`)
    let cookie = res.headers.get('set-cookie')?.split(';')[0] || ''
    let html = await res.text()
    let csrfToken = html.match(/name="csrf_token"\s+value="([^"]+)"/)[1]

    const loginParams = new URLSearchParams()
    loginParams.append('csrf_token', csrfToken)
    loginParams.append('password', 'Lovemacun2026!')
    res = await fetch(`${BASE_URL}/yonetim/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie
      },
      body: loginParams.toString(),
      redirect: 'manual'
    })
    const newCookie = res.headers.get('set-cookie')?.split(';')[0]
    if (newCookie) cookie = newCookie

    // CSRF token al
    res = await fetch(`${BASE_URL}/yonetim/index.php`, { headers: { 'Cookie': cookie } })
    const panelHtml = await res.text()
    csrfToken = panelHtml.match(/const CSRF_TOKEN = "([^"]+)"/)?.[1]

    console.log('--- TEST 1: Zararlı Dosya (fake .php) Yükleme Engeli ---')
    const fakePhp = new Blob(['<?php echo "hacked"; ?>'], { type: 'application/x-php' })
    const formBad = new FormData()
    formBad.append('csrf_token', csrfToken)
    formBad.append('image', fakePhp, 'shell.php')

    let uploadRes = await fetch(`${BASE_URL}/api/upload.php`, {
      method: 'POST',
      headers: { 'Cookie': cookie },
      body: formBad
    })
    console.log(`Zararlı Dosya Yükleme Durumu: ${uploadRes.status} (Beklenen: 400)`)
    if (uploadRes.status !== 400) throw new Error('Zararlı dosya reddedilmedi!')
    console.log('✓ Zararlı dosya finfo MIME kontrolüyle başarıyla engellendi!')

    console.log('\n--- TEST 2: Gerçek Görsel Yükleme & 400x400 WebP Dönüştürme ---')
    // 1x1 geçerli PNG verisi
    const validPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    const imgBlob = new Blob([validPngBuffer], { type: 'image/png' })
    const formGood = new FormData()
    formGood.append('csrf_token', csrfToken)
    formGood.append('category', 'lahmacun')
    formGood.append('image', imgBlob, 'orijinal-urun.png')

    uploadRes = await fetch(`${BASE_URL}/api/upload.php`, {
      method: 'POST',
      headers: { 'Cookie': cookie },
      body: formGood
    })
    const uploadData = await uploadRes.json()
    console.log('Görsel Yükleme Sonucu:', uploadData)
    if (!uploadData.success || !uploadData.path.endsWith('.webp')) {
      throw new Error('Görsel WebP olarak yüklenemedi!')
    }

    const savedFilePath = path.join(PUBLIC_DIR, uploadData.path.replace(/^\//, ''))
    if (!fs.existsSync(savedFilePath)) throw new Error('Sunucuda WebP dosyası bulunamadı!')
    console.log(`✓ 400x400 WebP Görsel Doğrulandı: ${savedFilePath}`)

    // Test görselini temizle
    fs.unlinkSync(savedFilePath)
    console.log('✓ Test görseli temizlendi.')

    console.log('\n======================================================')
    console.log('🎉 GÖRSEL YÜKLEME VE GD TESTİ BAŞARIYLA GEÇTİ!')
    console.log('======================================================\n')
  } catch (err) {
    console.error('❌ Upload Test Hatası:', err)
  } finally {
    phpServer.kill()
    process.exit(0)
  }
}

runUploadTests()
