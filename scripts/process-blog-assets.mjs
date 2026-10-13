import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const BLOG_DIR = path.resolve('public/blog')

async function processBlogAssets() {
  if (!fs.existsSync(BLOG_DIR)) {
    console.log('public/blog directory does not exist.')
    return
  }

  // 1. Cover image check
  const coverCandidates = ['cover.jpg', 'cover.jpeg', 'cover.png']
  for (const c of coverCandidates) {
    const srcPath = path.join(BLOG_DIR, c)
    if (fs.existsSync(srcPath)) {
      const outPath = path.join(BLOG_DIR, 'cover.webp')
      console.log(`Processing ${c} -> cover.webp (1600x900)...`)
      await sharp(srcPath)
        .resize(1600, 900, { fit: 'cover', position: 'center' })
        .webp({ quality: 85 })
        .toFile(outPath)
      console.log('✓ cover.webp generated successfully.')
      break
    }
  }

  // 2. Gallery images check (gallery-1, gallery-2, gallery-3)
  for (let i = 1; i <= 3; i++) {
    const candidates = [`gallery-${i}.jpg`, `gallery-${i}.jpeg`, `gallery-${i}.png`]
    for (const g of candidates) {
      const srcPath = path.join(BLOG_DIR, g)
      if (fs.existsSync(srcPath)) {
        const outPath = path.join(BLOG_DIR, `gallery-${i}.webp`)
        console.log(`Processing ${g} -> gallery-${i}.webp (1200x750)...`)
        await sharp(srcPath)
          .resize(1200, 750, { fit: 'cover', position: 'center' })
          .webp({ quality: 85 })
          .toFile(outPath)
        console.log(`✓ gallery-${i}.webp generated successfully.`)
        break
      }
    }
  }
}

processBlogAssets().catch(console.error)
