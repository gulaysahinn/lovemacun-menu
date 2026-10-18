import fs from 'fs'
import path from 'path'
import { CATS, FEATURED, TAGS } from '../src/menu.js'

const slug = (s) =>
  s
    ? s
        .replace(/İ/g, 'i')
        .replace(/I/g, 'i')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'c')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    : ''

const menuJsonRaw = fs.readFileSync('./public/data/menu.json', 'utf8')
const menuData = JSON.parse(menuJsonRaw)
const images = JSON.parse(fs.readFileSync('./src/images.json', 'utf8'))

let totalOriginal = 0
let matchCount = 0
const errors = []

// Flatten original CATS
const originalItems = []
CATS.forEach((c) => {
  c.items.forEach((it) => {
    const name = Array.isArray(it) ? it[0] : it.name
    const price = Array.isArray(it) ? it[1] : it.price
    const description = (Array.isArray(it) ? it[2] : it.desc) || ''
    const s = slug(name)
    const imgEntry = images[s]
    const image = imgEntry ? (typeof imgEntry === 'string' ? imgEntry : imgEntry.sm || imgEntry.lg || '') : ''

    const tags = []
    if (TAGS.sef && TAGS.sef.includes(name)) tags.push('sef')
    if (TAGS.aci && TAGS.aci.includes(name)) tags.push('aci')
    if (TAGS.vejetaryen && TAGS.vejetaryen.includes(name)) tags.push('vejetaryen')
    if (TAGS.vegan && TAGS.vegan.includes(name)) tags.push('vegan')
    if (TAGS.glutensiz && TAGS.glutensiz.includes(name)) tags.push('glutensiz')

    const featIdx = FEATURED.indexOf(name)
    const featuredOrder = featIdx !== -1 ? featIdx + 1 : 0

    originalItems.push({
      category: c.id,
      name,
      price,
      description,
      image,
      tags,
      featuredOrder
    })
    totalOriginal++
  })
})

if (originalItems.length !== menuData.items.length) {
  errors.push(`Ürün sayısı uyuşmuyor: Orijinal=${originalItems.length}, JSON=${menuData.items.length}`)
}

originalItems.forEach((orig, idx) => {
  const jsonItem = menuData.items[idx]
  if (!jsonItem) {
    errors.push(`JSON öğesi bulunamadı: index ${idx} (${orig.name})`)
    return
  }

  let itemMatch = true

  if (orig.name !== jsonItem.name) {
    errors.push(`İsim uyuşmazlığı [${idx}]: Orijinal="${orig.name}", JSON="${jsonItem.name}"`)
    itemMatch = false
  }
  if (orig.price !== jsonItem.price) {
    errors.push(`Fiyat uyuşmazlığı [${orig.name}]: Orijinal=${orig.price}, JSON=${jsonItem.price}`)
    itemMatch = false
  }
  if (orig.category !== jsonItem.category) {
    errors.push(`Kategori uyuşmazlığı [${orig.name}]: Orijinal=${orig.category}, JSON=${jsonItem.category}`)
    itemMatch = false
  }
  if (orig.description !== jsonItem.description) {
    errors.push(`Açıklama uyuşmazlığı [${orig.name}]: Orijinal="${orig.description}", JSON="${jsonItem.description}"`)
    itemMatch = false
  }
  if (orig.image !== jsonItem.image) {
    errors.push(`Görsel uyuşmazlığı [${orig.name}]: Orijinal="${orig.image}", JSON="${jsonItem.image}"`)
    itemMatch = false
  }
  if (JSON.stringify(orig.tags) !== JSON.stringify(jsonItem.tags)) {
    errors.push(`Etiket uyuşmazlığı [${orig.name}]: Orijinal=${JSON.stringify(orig.tags)}, JSON=${JSON.stringify(jsonItem.tags)}`)
    itemMatch = false
  }
  if (orig.featuredOrder !== jsonItem.featuredOrder) {
    errors.push(`FeaturedOrder uyuşmazlığı [${orig.name}]: Orijinal=${orig.featuredOrder}, JSON=${jsonItem.featuredOrder}`)
    itemMatch = false
  }

  if (itemMatch) {
    matchCount++
  }
})

console.log('=== MENÜ VERİ PARİTE DOĞRULAMA RAPORU ===')
console.log(`Toplam Orijinal Ürün: ${totalOriginal}`)
console.log(`Toplam JSON Ürünü: ${menuData.items.length}`)
console.log(`Eşleşen Ürün: ${matchCount}/${totalOriginal}`)

if (errors.length === 0 && matchCount === totalOriginal) {
  console.log(`✅ SONUÇ: ${matchCount}/${totalOriginal} aynı! Birebir tam eşleşme doğrulandı.`)
} else {
  console.error(`❌ Hatalar bulundu (${errors.length}):`, errors)
  process.exit(1)
}
