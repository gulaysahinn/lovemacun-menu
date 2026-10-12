import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const IMG_DIR = path.join(rootDir, 'public', 'img');
const BACKUP_DIR = path.join(rootDir, 'public', 'img-original');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.tiff']);

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Klasördeki dosyaları tara
function getFilesRecursively(dir, relPath = '') {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    const entryRel = relPath ? `${relPath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files = files.concat(getFilesRecursively(fullPath, entryRel));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        files.push({
          fullPath,
          relPath: entryRel,
          dirRel: relPath,
          fileName: entry.name,
          baseName: path.basename(entry.name, path.extname(entry.name)),
          ext,
        });
      }
    }
  }
  return files;
}

async function main() {
  console.log('============================================================');
  console.log('⚡ SHARP GÖRSEL OPTİMİZASYON SCRIPTI BAŞLATILIYOR...');
  console.log('============================================================\n');

  if (!fs.existsSync(IMG_DIR)) {
    console.error(`Hata: ${IMG_DIR} klasörü bulunamadı!`);
    process.exit(1);
  }

  // 1) Orijinalleri yedekle
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const initialFiles = getFilesRecursively(IMG_DIR);
  console.log(`📦 Toplam taranan orijinal görsel: ${initialFiles.length}`);

  let totalOriginalSize = 0;

  for (const file of initialFiles) {
    const backupTarget = path.join(BACKUP_DIR, file.relPath);
    const backupTargetDir = path.dirname(backupTarget);

    if (!fs.existsSync(backupTargetDir)) {
      fs.mkdirSync(backupTargetDir, { recursive: true });
    }

    // Yedek yoksa kopyala (zaten varsa orijinali koru)
    if (!fs.existsSync(backupTarget)) {
      fs.copyFileSync(file.fullPath, backupTarget);
    }

    const stat = fs.statSync(backupTarget);
    totalOriginalSize += stat.size;
  }

  console.log(`✅ Orijinal görseller 'public/img-original/' klasörüne yedeklendi.`);
  console.log(`📊 Orijinal Toplam Boyut: ${formatBytes(totalOriginalSize)}\n`);

  // 2) Yedeklenen orijinalleri alıp WebP'ye dönüştür
  const backupFiles = getFilesRecursively(BACKUP_DIR);

  console.log('🔄 Görseller WebP formatına dönüştürülüyor (900px ve 400px -sm)...');

  let processedCount = 0;

  for (const file of backupFiles) {
    // -sm ile biten bir dosya zaten varsa çift küçültme yapma
    const cleanBaseName = file.baseName.replace(/-sm$/, '');
    const targetDir = path.join(IMG_DIR, file.dirRel);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetLg = path.join(targetDir, `${cleanBaseName}.webp`);
    const targetSm = path.join(targetDir, `${cleanBaseName}-sm.webp`);

    try {
      // Büyük sürüm: uzun kenar en fazla 900px, kalite 78
      await sharp(file.fullPath)
        .rotate()
        .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(targetLg);

      // Küçük sürüm: uzun kenar en fazla 400px, kalite 78 (-sm.webp)
      await sharp(file.fullPath)
        .rotate()
        .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(targetSm);

      processedCount++;
    } catch (err) {
      console.error(`❌ Dönüştürme hatası (${file.relPath}):`, err.message);
    }
  }

  // 3) public/img/ içinde kalan eski uzantılı (png, jpg vs.) dosyaları temizle
  for (const file of initialFiles) {
    if (file.ext !== '.webp' && fs.existsSync(file.fullPath)) {
      try {
        fs.unlinkSync(file.fullPath);
      } catch (e) {
        // Hata durumunda yoksay
      }
    }
  }

  // 4) Optimize edilmiş dosyaların boyutunu hesapla
  const optimizedFiles = getFilesRecursively(IMG_DIR);
  let totalOptimizedSize = 0;
  for (const f of optimizedFiles) {
    totalOptimizedSize += fs.statSync(f.fullPath).size;
  }

  const savedBytes = totalOriginalSize - totalOptimizedSize;
  const savedPercent = totalOriginalSize > 0 ? ((savedBytes / totalOriginalSize) * 100).toFixed(1) : 0;

  console.log('\n============================================================');
  console.log('🎉 OPTİMİZASYON TAMAMLANDI!');
  console.log('============================================================');
  console.log(`🖼️  Dönüştürülen Görsel Sayısı: ${processedCount}`);
  console.log(`📁 Üretilen Toplam WebP:       ${optimizedFiles.length} (.webp ve -sm.webp)`);
  console.log(`📉 Önceki Boyut (Orijinal):     ${formatBytes(totalOriginalSize)}`);
  console.log(`📈 Sonraki Boyut (WebP Toplam): ${formatBytes(totalOptimizedSize)}`);
  console.log(`💾 Toplam Tasarruf:            ${formatBytes(savedBytes)} (%${savedPercent} küçülme)`);
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('Beklenmeyen hata:', err);
  process.exit(1);
});
