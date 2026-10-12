import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1) Türkçe karakter destekli slug fonksiyonu
export function slugify(str) {
  if (!str) return '';
  return str
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
    .replace(/^-+|-+$/g, '');
}

// Dosya adındaki WordPress / uploader artıklarını temizle
export function cleanFileName(filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  return base
    .replace(/^lovemacunn?-restaurant-?/i, '')
    .replace(/-\d+x\d+$/i, '');
}

// 4) Klasör -> Kategori eşlemesi
export const FOLDER_TO_CAT = {
  'makarnalar': 'makarna',
  'baliklar': 'balik',
  'sokaklezzetleri': 'sokak',
  'tatlilar': 'tatli',
  'icecekler': 'icecek',
  'ara-sicaklar': 'arasicak',
  'kahvalti': 'kahvalti',
  'lahmacun': 'lahmacun',
  'pide': 'pide',
  'et': 'et',
  'tavuk': 'tavuk',
  'pizza': 'pizza',
  'meze': 'meze',
  'salata': 'salata',
};

// Kategori içi bilinen varyasyonlar (yüksek güvenilirlikli eşleşmeler)
const KNOWN_MAPS = {
  pide: {
    'kiymali': 'kiymali-pide',
    'kiymali-kasarli': 'kiymali-kasarli-pide',
    'kavurmali-kasarli': 'kavurmali-kasarli-pide',
    'kasar-sucuk': 'kasarli-sucuklu-pide',
    'kusbasi-kasar': 'kusbasili-kasarli-pide',
    'tavuklu': 'tavuklu-pide',
    'karisik': 'karisik-pide',
    'vejeteryan-1': 'vejetaryen-pide',
    'kasarli-pide': 'kasarli-pide',
  },
  kahvalti: {
    'serpme-kahvalti': 'serpme-kahvalti-2-kisilik',
    'kahvalti-tabagi': 'kahvalti-tabagi',
    'menemen': 'menemen',
    'sucuklu-yumurta': 'sucuklu-yumurta',
    'omlet': 'kasarli-omlet',
    'sigara-boregi': 'sigara-boregi',
    'sosis-tabagi': 'sosis-tabagi',
  },
  pizza: {
    'margarita': 'margarita-pizza',
    'pepperoni': 'pepperoni-pizza',
    'karisik-pizza': 'karisik-pizza',
    'vejeteryan': 'vejetaryen-pizza',
    'tavuklu-pizza': 'tavuklu-pizza',
    'ton-balikli': 'ton-balikli-pizza',
    'pastirmali': 'pastirmali-pizza',
    'karidesli': 'karidesli-pizza',
    'et-doner': 'et-donerli-pizza',
  },
  balik: {
    'levrek': 'izgara-levrek',
    'cupra': 'izgara-cupura',
    'somon': 'izgara-somon',
    'uskumru': 'izgara-uskumru',
    'hamsi': 'tava-hamsi',
    'kalamar': 'citir-kalamar',
    'karides-guvec': 'karides-guvec',
    'balik-ekmek': 'balik-ekmek',
  },
  et: {
    'adana-kebap': 'adana-kebap',
    'kuzu-sis': 'kuzu-sis',
    'kuzu-pirzola': 'kuzu-pirzola',
    'iskender': 'iskender-kebap',
    'beyti': 'firin-beyti',
    'patlicanli-kebap': 'patlicanli-kebap',
    'kofte': 'izgara-kofte',
    'doner-porsiyon': 'et-doner-porsiyon',
    '7': 'karisik-et',
  },
  tavuk: {
    'tavuk-sis': 'tavuk-sis',
    'tavuk-pirzola': 'tavuk-pirzola',
    'tavuk-kanat': 'tavuk-kanat',
    'tavuk-doner': 'tavuk-doner',
    'sinitzel': 'tavuk-sinitzel',
    'kori-soslu-tavuk': 'kori-soslu-tavuk',
    'tavuk-guvec': 'tavuk-guvec',
    'tavuk-karisik': 'karisik-tavuk-tabagi',
  },
  makarna: {
    'spagetti': 'napoliten-spaghetti',
    'bolognez-spagetti': 'bolognese-spaghetti',
    'sosisli-spagetti': 'sosisli-spaghetti',
    'peynirli-spagetti': 'peynirli-spaghetti',
    'penne-arabita': 'penne-arrabbiata',
    'penne-kremali-mantarli': 'kremali-mantarli-penne',
    'fettucine': 'fettuccine-alfredo',
    'mantarli-fettucine-1': 'mantarli-fettuccine',
    'manti': 'kayseri-mantisi',
  },
  arasicak: {
    'combo-tabagi': 'combo-tabak',
    'icli-kofte': 'icli-kofte',
    'falafel': 'falafel',
    'firinda-mantar': 'firinda-mantar',
    'patates': 'patates-kizartmasi',
    'kuru-fasulye': 'kuru-fasulye',
    'pirinc-pilavi': 'pirinc-pilavi',
    'gunun-corbasi': 'gunun-corbasi',
  },
  meze: {
    'ordovr-tabagi': 'ordovr-tabagi',
    'yaprak-sarma': 'yaprak-sarma',
    'humus': 'humus',
    'aci-ezme': 'aci-ezme',
    'cigkofte': 'cig-kofte',
    'haydari': 'haydari',
    'cacik': 'cacik',
  },
  salata: {
    'coban-salata': 'coban-salatasi',
    'mevsim-salata': 'mevsim-salatasi',
    'sezar-salata': 'sezar-salata',
    'ton-balikli-salata': 'ton-balikli-salata',
    'tebbule': 'tebbule-salatasi',
    'patlican-salatasi': 'patlican-salatasi',
    'havuc-salatasi': 'havuc-salatasi',
    'sogus': 'sogus-tabagi',
    'karisik-tursu': 'karisik-tursu',
  },
  tatli: {
    'kunefe': 'kunefe',
    'baklava': 'fistikli-baklava',
    'sutlac': 'firin-sutlac',
  },
  icecek: {
    'su': 'su',
    'ayran': 'ayran',
    'sade-meyveli-soda': 'sade-meyveli-soda',
    'fanta-sprite-ice-tea': 'fanta-sprite-ice-tea',
    'limonata': 'limonata',
    'portakal-suyu': 'portakal-suyu',
    'nar-suyu': 'nar-suyu',
    'turk-kahvesi': 'turk-kahvesi',
    'cappuccino': 'cappuccino',
  },
  sokak: {
    'tavuk-durum': 'tavuk-durum',
    'et-doner-1': 'et-doner-durum',
    'adana-durum': 'adana-durum',
    'balik-durum': 'balik-durum',
    'kofte-ekmek': 'kofte-ekmek',
    'tavuk-burger-menu': 'tavuk-burger-menu',
    'et-burger-menu': 'et-burger-menu',
  },
  lahmacun: {
    'kebapli-lahmacun': 'kebapli-lahmacun',
    'donerli-lahmacun': 'donerli-lahmacun',
    'yumurtali-lahmacun': 'yumurtali-lahmacun',
    'soganli-lahmacun': 'soganli-lahmacun',
    'sarimsakli-lahmacun': 'sarimsakli-lahmacun',
    'kasarli-lahmacun': 'kasarli-lahmacun',
  },
};

// Bulanık / emin olunmayan eşleşmeler (kullanıcı isteği: uygulanmayıp konsola listelenecek)
const UNCERTAIN_MATCHES = [
  {
    product: 'Et Güveç (et)',
    file: '/img/tavuk/lovemacunn-restaurant-et-guvec-400x400.png',
    reason: "Görsel 'et' klasörü yerine 'tavuk' klasöründe yer alıyor (klasör uyuşmazlığı, uygulanmadı)",
  },
  {
    product: 'Fettuş Salatası (salata)',
    file: '/img/meze/lovemacunn-restaurant-fettus-400x400.png',
    reason: "Görsel 'salata' klasörü yerine 'meze' klasöründe yer alıyor (klasör uyuşmazlığı, uygulanmadı)",
  },
];

async function main() {
  const publicImgDir = path.join(rootDir, 'public', 'img');
  const menuPath = path.join(rootDir, 'src', 'menu.js');
  const outputPath = path.join(rootDir, 'src', 'images.json');

  const { CATS, GALLERY, HERO } = await import(pathToFileURL(menuPath).href + '?t=' + Date.now());

  // Galeri doğrulaması: Var olmayan görsel dosyalarını otomatik filtrele
  const validGallery = (GALLERY || []).filter((g) => {
    const full = path.join(rootDir, 'public', g.replace(/^\//, ''));
    const exists = fs.existsSync(full);
    if (!exists) {
      console.warn(`⚠️  [Galeri] Var olmayan görsel elendi: ${g}`);
    }
    return exists;
  });

  // Menüdeki tüm ürünler
  const allMenuItems = [];
  for (const cat of CATS) {
    for (const item of cat.items) {
      allMenuItems.push({
        catId: cat.id,
        catName: cat.name,
        name: item[0],
        slug: slugify(item[0]),
        manualImg: item[3] || null,
      });
    }
  }

  // public/img altındaki tüm görselleri tara ve -sm ile ana görseli eşleştir
  const imageFilesByBase = new Map();

  function scanDir(dir, relPath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      const entryRel = relPath ? `${relPath}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        scanDir(fullPath, entryRel);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.webp') {
          const folder = relPath.split('/')[0] || '';
          const isSm = entry.name.endsWith('-sm.webp');
          const mainBase = isSm
            ? entry.name.slice(0, -8) // remove -sm.webp
            : entry.name.slice(0, -5); // remove .webp
          const key = `${folder}/${mainBase}`;

          if (!imageFilesByBase.has(key)) {
            imageFilesByBase.set(key, {
              folder,
              mainBase,
              cleanBase: cleanFileName(mainBase),
              cleanSlug: slugify(cleanFileName(mainBase)),
              rawSlug: slugify(mainBase),
              lg: '',
              sm: '',
            });
          }

          const record = imageFilesByBase.get(key);
          const webPath = `/img/${entryRel.replace(/\\/g, '/')}`;
          if (isSm) {
            record.sm = webPath;
          } else {
            record.lg = webPath;
          }
        }
      }
    }
  }

  scanDir(publicImgDir);

  const scannedFiles = Array.from(imageFilesByBase.values()).map((f) => {
    // sm yoksa lg, lg yoksa sm kullan
    if (!f.sm) f.sm = f.lg;
    if (!f.lg) f.lg = f.sm;
    return f;
  });

  const imagesMap = {};
  const matchedItemSlugs = new Set();
  const matchedFilePaths = new Set();
  const matchedList = [];

  // 1) Dosya tabanlı anahtarları ekle (dosyanın temiz slug'ı ve ham slug'ı)
  for (const file of scannedFiles) {
    const cutRel = file.lg ? file.lg.replace('/img/', '/img-cut/') : '';
    const cutDisk = path.join(rootDir, 'public', cutRel.replace(/^\//, ''));
    const hasCut = cutRel && fs.existsSync(cutDisk);
    const payload = { sm: file.sm, lg: file.lg, cut: hasCut ? cutRel : file.lg };

    if (file.cleanSlug) {
      imagesMap[file.cleanSlug] = payload;
      imagesMap[`${file.cleanSlug}-sm`] = file.sm;
      imagesMap[`${file.cleanSlug}-lg`] = file.lg;
      if (hasCut) imagesMap[`${file.cleanSlug}-cut`] = cutRel;
    }
    if (file.rawSlug) {
      imagesMap[file.rawSlug] = payload;
      imagesMap[`${file.rawSlug}-sm`] = file.sm;
      imagesMap[`${file.rawSlug}-lg`] = file.lg;
      if (hasCut) imagesMap[`${file.rawSlug}-cut`] = cutRel;
    }
  }

  // 2) Kategori bazlı ürün eşleştirmesi
  for (const item of allMenuItems) {
    const catKnown = KNOWN_MAPS[item.catId] || {};
    let matchedFile = null;

    // Aynı kategorideki dosyaları ara
    const catFiles = scannedFiles.filter((f) => {
      const mappedCat = FOLDER_TO_CAT[f.folder] || f.folder;
      return mappedCat === item.catId;
    });

    for (const f of catFiles) {
      // Bilinen eşleşme sözlüğü kontrolü
      if (catKnown[f.cleanSlug] === item.slug) {
        matchedFile = f;
        break;
      }
      // Doğrudan slug eşitliği
      if (f.cleanSlug === item.slug || f.rawSlug === item.slug) {
        matchedFile = f;
        break;
      }
      // Kategori ekiyle eşitlik: örn. kiymali-pide
      if (`${f.cleanSlug}-${item.catId}` === item.slug) {
        matchedFile = f;
        break;
      }
    }

    if (matchedFile) {
      const cutRel = matchedFile.lg ? matchedFile.lg.replace('/img/', '/img-cut/') : '';
      const cutDisk = path.join(rootDir, 'public', cutRel.replace(/^\//, ''));
      const hasCut = cutRel && fs.existsSync(cutDisk);
      const cutSmRel = cutRel ? cutRel.replace(/\.webp$/, '-sm.webp') : '';
      const cutSmDisk = path.join(rootDir, 'public', cutSmRel.replace(/^\//, ''));
      const hasCutSm = cutSmRel && fs.existsSync(cutSmDisk);

      const payload = {
        sm: matchedFile.sm,
        lg: matchedFile.lg,
        cut: hasCut ? cutRel : matchedFile.lg,
        cutSm: hasCutSm ? cutSmRel : (hasCut ? cutRel : matchedFile.sm),
      };

      imagesMap[item.slug] = payload;
      imagesMap[`${item.slug}-sm`] = matchedFile.sm;
      imagesMap[`${item.slug}-lg`] = matchedFile.lg;
      if (hasCut) imagesMap[`${item.slug}-cut`] = cutRel;
      if (hasCutSm) imagesMap[`${item.slug}-cut-sm`] = cutSmRel;

      matchedItemSlugs.add(item.slug);
      matchedFilePaths.add(matchedFile.lg);
      matchedList.push({
        item: item.name,
        category: item.catName,
        slug: item.slug,
        file: matchedFile.sm,
        lgFile: matchedFile.lg,
      });
    }
  }

  // Eşleşmeyen ürünler
  const unmatchedItems = allMenuItems.filter((item) => !matchedItemSlugs.has(item.slug));

  // Hiçbir ürünle eşleşmeyen dosyalar
  const unmatchedFiles = scannedFiles.filter(
    (f) => !matchedFilePaths.has(f.lg) && !f.lg.includes('lahmacun-hero')
  );

  // images.json dosyasını alfabetik anahtarlarla yaz
  const sortedImagesMap = Object.keys(imagesMap)
    .sort()
    .reduce((acc, key) => {
      acc[key] = imagesMap[key];
      return acc;
    }, {});

  sortedImagesMap._gallery = validGallery;
  fs.writeFileSync(outputPath, JSON.stringify(sortedImagesMap, null, 2) + '\n', 'utf-8');

  // ====================== KONSOL ÇIKTISI ======================
  console.log('\n============================================================');
  console.log('🍽️  LOVEMACUN GÖRSEL EŞLEŞTİRME VE images.json RAPORU');
  console.log('============================================================');
  console.log(`📁 Toplam Taranan Görsel: ${scannedFiles.length}`);
  console.log(`📋 Toplam Menü Ürünü:    ${allMenuItems.length}`);
  console.log(`✅ Başarıyla Eşleşen:    ${matchedList.length}`);
  console.log(`⚠️  Eşleşmeyen Ürün:      ${unmatchedItems.length}`);
  console.log(`📂 Eşleşmeyen Dosya:     ${unmatchedFiles.length}`);
  console.log(`🤔 Bulanık / Şüpheli:    ${UNCERTAIN_MATCHES.length}`);
  console.log('------------------------------------------------------------');

  console.log(`\n✅ EŞLEŞEN ÜRÜNLER (${matchedList.length}):`);
  for (const m of matchedList) {
    console.log(`  ✓ [${m.category}] ${m.item} -> ${m.file}`);
  }

  console.log(`\n⚠️  EŞLEŞMEYEN MENÜ ÜRÜNLERİ (${unmatchedItems.length}):`);
  if (unmatchedItems.length === 0) {
    console.log('  (Tüm ürünler eşleşti)');
  } else {
    for (const u of unmatchedItems) {
      console.log(`  ✗ [${u.catName}] "${u.name}" (slug: ${u.slug})`);
    }
  }

  console.log(`\n📂 HİÇBİR ÜRÜNLE EŞLEŞMEYEN DOSYALAR (${unmatchedFiles.length}):`);
  if (unmatchedFiles.length === 0) {
    console.log('  (Tüm dosyalar eşleşti)');
  } else {
    for (const f of unmatchedFiles) {
      console.log(`  - ${f.lg} (slug: ${f.cleanSlug})`);
    }
  }

  console.log(`\n🤔 BULANIK / EMİN OLUNMAYAN VE UYGULANMAYAN EŞLEŞMELER (${UNCERTAIN_MATCHES.length}):`);
  for (const um of UNCERTAIN_MATCHES) {
    console.log(`  ? Ürün: ${um.product}`);
    console.log(`    Aday Dosya: ${um.file}`);
    console.log(`    Neden: ${um.reason}`);
  }

  console.log('\n✨ src/images.json başarıyla oluşturuldu!');
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('Hata oluştu:', err);
  process.exit(1);
});
