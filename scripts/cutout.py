#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/cutout.py
Lovemacun Menü - Ürün Fotoğrafları Arka Plan Temizleme Scripti

1) public/img altındaki ürün fotoğraflarının beyaz arka planını temizler.
2) rembg ile alpha_matting=True kullanarak tabağın beyaz kenarlarının yenmesini önler.
3) Şeffaf WebP olarak public/img-cut/<kategori>/<dosya>.webp konumuna kaydeder (kalite 85, uzun kenar en fazla 900px).
4) Kenarı bozulan ya da içi delinen görselleri tespit edip konsola "[ELLE KONTROL GEREKLI]" olarak listeler.
5) src/images.json dosyasına her ürün için "cut" alanı ekler / günceller.
"""

import os
import sys

# Windows konsolunda UTF-8 çıktı desteği (cp1254 hatasını önlemek için)
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import json
import argparse
from pathlib import Path
from PIL import Image
import numpy as np
from scipy.ndimage import (
    binary_fill_holes,
    label,
    binary_erosion,
    gaussian_filter,
    distance_transform_edt,
)

try:
    import rembg
except ImportError:
    print("[HATA] rembg kütüphanesi bulunamadı! 'pip install rembg[cpu]' çalıştırın.", flush=True)
    sys.exit(1)

ROOT_DIR = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT_DIR / "public" / "img"
IMG_CUT_DIR = ROOT_DIR / "public" / "img-cut"
IMAGES_JSON = ROOT_DIR / "src" / "images.json"

FEATURED_FILES = [
    "lahmacun/lovemacunn-restaurant-kebapli-lahmacun-400x400.webp",
    "pide/lovemacunn-restaurant-kiymali-kasarli-400x400.webp",
    "et/lovemacunn-restaurant-iskender-400x400.webp",
    "tatlilar/lovemacunn-restaurant-kunefe-400x400.webp",
    "et/lovemacunn-restaurant-adana-kebap-400x400.webp",
]

def clean_edge_halo(img_rgba):
    """
    Kenar halosu temizliği:
    1) alpha'yı 1px erode et (kenar pikselleri içeri çek).
    2) kenar piksellerin rengini içeriğe doğru çek (color bleed / solid renkten dışa doğru yayarak beyaz kenar bırakma).
    3) 1px feather uygula.
    """
    arr = np.array(img_rgba)
    if arr.ndim != 3 or arr.shape[2] < 4:
        return img_rgba

    rgb = arr[:, :, :3].astype(np.float32)
    alpha = arr[:, :, 3].astype(np.float32)

    # Katı ön plan pikselleri (alpha > 200)
    solid_mask = alpha > 200
    if not np.any(solid_mask):
        return img_rgba

    # Renkleri içeriden kenara doğru çek (distance_transform_edt ile en yakın katı piksel rengi)
    # Bu sayede beyaz zeminden karışmış yarı saydam piksellerin RGB değeri gerçek yemek rengiyle değiştirilir.
    indices = distance_transform_edt(~solid_mask, return_distances=False, return_indices=True)
    bled_rgb = rgb[indices[0], indices[1]]

    # 1px alpha erosion
    structure = np.ones((3, 3), dtype=bool)
    mask_above = alpha > 30
    eroded_mask = binary_erosion(mask_above, structure=structure, iterations=1)
    
    eroded_alpha = alpha.copy()
    eroded_alpha[~eroded_mask] = 0.0

    # 1px feather (sigma=0.8 ~ 1px gaussian blur)
    feathered_alpha = gaussian_filter(eroded_alpha, sigma=0.8)
    feathered_alpha[alpha == 0] = 0.0
    feathered_alpha = np.clip(feathered_alpha, 0.0, 255.0)

    clean_rgba = np.dstack([
        np.clip(bled_rgb, 0, 255).astype(np.uint8),
        feathered_alpha.astype(np.uint8)
    ])
    return Image.fromarray(clean_rgba, mode="RGBA")

def check_image_defects(img_rgba):
    """
    Her görselin kenarını koyu zemin (#160c07) üstünde otomatik önizler:
    1) İçi delinen (plate/food interior hollowed out)
    2) Kenarı aşırı aşınan veya parçalanan
    3) Koyu zemin üzerinde beyaz halo kalan
    durumları tespit eder.
    """
    arr = np.array(img_rgba)
    if arr.ndim != 3 or arr.shape[2] < 4:
        return True, "Görsel RGBA formatında değil"

    alpha = arr[:, :, 3]
    h, w = alpha.shape

    # Ön plan pikselleri (yarı saydam veya opak)
    fg_mask = alpha > 40
    total_fg_pixels = int(np.sum(fg_mask))

    # Eğer ön plan aşırı küçükse (< %4), görsel neredeyse tamamen silinmiş olabilir
    if total_fg_pixels < 0.04 * (h * w):
        return True, f"Ön plan çok az kaldı ({total_fg_pixels} px, %{total_fg_pixels/(h*w)*100:.1f})"

    # İçi delinen (hollow interior) analizi
    filled_mask = binary_fill_holes(fg_mask)
    holes_mask = filled_mask & (~fg_mask)
    hole_count = int(np.sum(holes_mask))
    hole_ratio = hole_count / max(1, total_fg_pixels)

    if hole_count > 350 and hole_ratio > 0.02:
        return True, f"İçi delik tespit edildi ({hole_count} px, %{hole_ratio*100:.1f} delik oranı)"

    # Parçalanma / kopuk adacık analizi
    labeled_array, num_features = label(fg_mask)
    if num_features > 1:
        component_sizes = np.bincount(labeled_array.ravel())[1:]
        main_size = np.max(component_sizes)
        small_islands = [s for s in component_sizes if 40 < s < main_size * 0.05]
        if len(small_islands) > 10:
            return True, f"Kenarda aşırı kopuk adacıklar ({len(small_islands)} adet)"

    # Koyu zemin (#160c07) üstünde halo kontrolü:
    # Kenar geçiş kuşağında (alpha 15 ila 180 arası)
    edge_zone = (alpha > 15) & (alpha < 180)
    if np.any(edge_zone):
        edge_rgb = arr[edge_zone, :3]
        white_edge_pixels = np.sum((edge_rgb[:, 0] > 230) & (edge_rgb[:, 1] > 230) & (edge_rgb[:, 2] > 230))
        if white_edge_pixels > 250:
            return True, f"Beyaz kenar halosu şüphesi ({white_edge_pixels} parlak piksel)"

    return False, "Sorunsuz"

def deskew_image(img_rgba, min_skew_deg=12.0):
    """
    Çapraz dönmüş kesitleri (Kaşarlı Lahmacun vb.) minAreaRect / PCA yön analizi ile tespit edip düzeltir.
    Ana eksen açısı belirgin bir çaprazlıktaysa (örn. 25-65 derece), yataya hizalar.
    """
    arr = np.array(img_rgba)
    if arr.ndim != 3 or arr.shape[2] < 4:
        return img_rgba
    alpha = arr[:, :, 3]
    pts = np.argwhere(alpha > 30)
    if len(pts) < 100:
        return img_rgba
    try:
        cov = np.cov(pts, rowvar=False)
        evals, evecs = np.linalg.eigh(cov)
        primary_vec = evecs[:, np.argmax(evals)]
        angle = np.degrees(np.arctan2(primary_vec[0], primary_vec[1]))
        if abs(angle) >= min_skew_deg and abs(angle) <= (90 - min_skew_deg):
            rotated = img_rgba.rotate(-angle, expand=True, resample=Image.Resampling.BICUBIC)
            return rotated
    except Exception as e:
        print(f"[UYARI] Deskew uygulanamadı: {e}", flush=True)
    return img_rgba

def equalize_image(img_rgba, target_size=900, padding_pct=0.09, deskew=True):
    """
    1) Çapraz kesitleri deskew ile düzeltir.
    2) Şeffaf görseli alpha sınırlayıcı kutusuna (getbbox) kırpar (trim).
    3) %8-10 boşlukla kare tuvale (1:1) ortalar (kartta %78-82 doluluk).
    """
    if deskew:
        img_rgba = deskew_image(img_rgba)

    bbox = img_rgba.getbbox()
    if bbox is None:
        return Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))

    cropped = img_rgba.crop(bbox)
    cw, ch = cropped.size

    # %8 boşluk: her iki kenarda %8 pay, yani nesne en fazla (1 - 2 * 0.08) = %84 yer kaplar
    max_inner = int(round(target_size * (1.0 - 2.0 * padding_pct)))
    scale = min(max_inner / cw, max_inner / ch)
    new_w = max(1, int(round(cw * scale)))
    new_h = max(1, int(round(ch * scale)))

    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    paste_x = (target_size - new_w) // 2
    paste_y = (target_size - new_h) // 2
    canvas.paste(resized, (paste_x, paste_y), resized)
    return canvas

def resize_to_max_edge(img, max_edge=900):
    w, h = img.size
    cur_max = max(w, h)
    if cur_max > max_edge:
        scale = max_edge / cur_max
        new_w = max(1, int(round(w * scale)))
        new_h = max(1, int(round(h * scale)))
        return img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    return img

def find_candidate_images(priority_featured=True):
    """
    public/img altındaki işlenecek fotoğrafları listeler.
    -sm ile bitenleri atlar (çünkü bunlar küçük önizleme, tam boyuttan türetilecek).
    Kategori alt klasörlerindeki görselleri toplar.
    """
    candidates = []
    if not IMG_DIR.exists():
        print(f"[HATA] {IMG_DIR} klasörü bulunamadı!", flush=True)
        return candidates

    featured_candidates = []
    other_candidates = []

    for cat_dir in sorted(IMG_DIR.iterdir()):
        if not cat_dir.is_dir():
            continue
        cat_name = cat_dir.name
        for img_file in sorted(cat_dir.glob("*.webp")):
            # Küçük thumbnail'leri atla
            if img_file.name.endswith("-sm.webp"):
                continue
            item = {
                "path": img_file,
                "category": cat_name,
                "filename": img_file.name,
                "rel_in": f"img/{cat_name}/{img_file.name}",
                "rel_out": f"img-cut/{cat_name}/{img_file.name}",
            }
            rel_check = f"{cat_name}/{img_file.name}"
            if priority_featured and rel_check in FEATURED_FILES:
                featured_candidates.append(item)
            else:
                other_candidates.append(item)

    if priority_featured:
        # Önce featured olanları koy
        return featured_candidates + other_candidates
    return other_candidates

import concurrent.futures

def update_images_json(processed_records=None):
    """
    src/images.json dosyasına her ürün için "cut" ve "cutSm" alanlarını ekler.
    Şeffaf sürümü olmayan ürünlerde mevcut görseli ('lg' veya 'sm') korur.
    """
    if not IMAGES_JSON.exists():
        print(f"[HATA] {IMAGES_JSON} bulunamadı!", flush=True)
        return

    with open(IMAGES_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Var olan tüm cut dosyalarını tara
    existing_cuts = set()
    if IMG_CUT_DIR.exists():
        for f in IMG_CUT_DIR.glob("**/*.webp"):
            rel_path = "/" + f.relative_to(ROOT_DIR / "public").as_posix()
            existing_cuts.add(rel_path)

    updated_count = 0

    # images.json içindeki girdileri güncelle
    for key, value in data.items():
        if isinstance(value, dict):
            lg_path = value.get("lg") or value.get("sm")
            if lg_path and lg_path.startswith("/img/"):
                potential_cut = lg_path.replace("/img/", "/img-cut/").replace("-sm.webp", ".webp")
                potential_cut_sm = potential_cut.replace(".webp", "-sm.webp")
                if potential_cut in existing_cuts:
                    value["cut"] = potential_cut
                    value["cutSm"] = potential_cut_sm if potential_cut_sm in existing_cuts else potential_cut
                    updated_count += 1
                else:
                    value["cut"] = lg_path
                    value["cutSm"] = value.get("sm") or lg_path
        elif isinstance(key, str) and not key.endswith("-lg") and not key.endswith("-sm") and isinstance(value, str):
            pass

    with open(IMAGES_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"[OK] src/images.json güncellendi! ({updated_count} ürün için şeffaf 'cut' & 'cutSm' yolları atandı)", flush=True)

def process_single_equalize(fpath):
    try:
        with Image.open(fpath) as img:
            img_rgba = img.convert("RGBA")
            
            # 900px detay görseli (1:1 tuval, %8 boşluk)
            eq_900 = equalize_image(img_rgba, target_size=900, padding_pct=0.08)
            eq_900.save(fpath, format="WEBP", quality=85, method=4)
            
            # 400px kart görseli (1:1 tuval, %8 boşluk)
            sm_path = fpath.parent / f"{fpath.stem.replace('-sm', '')}-sm.webp"
            eq_400 = equalize_image(img_rgba, target_size=400, padding_pct=0.08)
            eq_400.save(sm_path, format="WEBP", quality=85, method=4)
            return True, fpath.name
    except Exception as e:
        return False, f"{fpath.name}: {e}"

def equalize_all_existing():
    """
    public/img-cut altındaki tüm mevcut şeffaf görselleri eşitler:
    - Alpha sınırlayıcı kutusuna kırpar (trim).
    - %8 boşlukla 1:1 kare tuvale ortalar.
    - Hem 900px (detay paneli) hem 400px (-sm.webp, kartlar) olarak kaydeder.
    """
    if not IMG_CUT_DIR.exists():
        print(f"[HATA] {IMG_CUT_DIR} bulunamadı!", flush=True)
        return

    # Sadece ana webp dosyalarını al (-sm olanları atla)
    files = [f for f in IMG_CUT_DIR.glob("**/*.webp") if not f.name.endswith("-sm.webp")]
    print(f"\n[INFO] {len(files)} adet mevcut cutout görseli eşitleniyor (%8 boşluk, 1:1 tuval, 900px ve 400px)...", flush=True)

    success_count = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(process_single_equalize, f): f for f in files}
        for future in concurrent.futures.as_completed(futures):
            ok, msg = future.result()
            if ok:
                success_count += 1
            else:
                print(f"[HATA] {msg}", flush=True)

    print(f"[OK] Toplam {success_count}/{len(files)} görsel başarıyla 900px ve 400px boyutlarında eşitlendi!\n", flush=True)
    update_images_json()

def main():
    parser = argparse.ArgumentParser(description="Lovemacun Fotoğraf Arka Plan Temizleyici")
    parser.add_argument("--limit", type=int, default=None, help="İşlenecek görsel sayısı limiti")
    parser.add_argument("--all", action="store_true", help="Tüm fotoğrafları işle")
    parser.add_argument("--categories", nargs="+", help="Sadece belirtilen kategorileri işle")
    parser.add_argument("--model", default="isnet-general-use", help="rembg model adı (varsayılan: isnet-general-use)")
    parser.add_argument("--update-json-only", action="store_true", help="Sadece images.json dosyasını güncelle")
    parser.add_argument("--equalize", action="store_true", help="Mevcut cutout görsellerini %8 boşlukla 900px ve 400px olarak eşitle")
    args = parser.parse_args()

    if args.equalize:
        equalize_all_existing()
        return

    if args.update_json_only:
        update_images_json()
        return

    candidates = find_candidate_images(priority_featured=True)
    print(f"[INFO] Toplam {len(candidates)} adet ana ürün fotoğrafı bulundu.", flush=True)

    if args.categories:
        candidates = [c for c in candidates if c["category"] in args.categories]
        print(f"[INFO] Filtrelenen kategoriler: {args.categories} ({len(candidates)} görsel)", flush=True)

    limit = args.limit
    if not args.all and limit is None:
        limit = 5
        print(f"[INFO] Test modu: İlk {limit} görsel işlenecektir. (Tümü için: --all)", flush=True)

    if limit:
        candidates = candidates[:limit]

    print(f"\n[INFO] {len(candidates)} adet görsel işleniyor (Model: {args.model}, alpha_matting=True)...", flush=True)
    print("=" * 70, flush=True)

    try:
        session = rembg.new_session(args.model)
    except Exception as e:
        print(f"[UYARI] Model yüklenirken hata: {e}", flush=True)
        print("[INFO] Alternatif olarak varsayılan model deneniyor...", flush=True)
        session = rembg.new_session()

    manual_check_needed = []
    processed_count = 0

    for idx, item in enumerate(candidates, 1):
        in_path = item["path"]
        out_path = IMG_CUT_DIR / item["category"] / item["filename"]
        out_path.parent.mkdir(parents=True, exist_ok=True)

        print(f"[{idx}/{len(candidates)}] İşleniyor: {item['category']}/{item['filename']} ...", end=" ", flush=True)

        try:
            with Image.open(in_path) as input_img:
                rgb_img = input_img.convert("RGB")
                
                # rembg ile arka planı temizle (alpha matting devrede)
                # alpha_matting=True: tabağın beyaz kenarlarının yenmesini önler
                cutout = rembg.remove(
                    rgb_img,
                    session=session,
                    alpha_matting=True,
                    alpha_matting_foreground_threshold=240,
                    alpha_matting_background_threshold=10,
                    alpha_matting_erode_size=10
                )

                # Kenar halosu temizliği: 1px alpha erosion, color bleeding (renkleri içeriye çek), 1px feather
                cutout_clean = clean_edge_halo(cutout)

                # Koyu zemin üstünde otomatik önizleme ve kalite kontrolü
                has_defect, defect_reason = check_image_defects(cutout_clean)

                # %8 boşlukla 1:1 kare tuvale ortala (900px detay ve 400px kart sürümü)
                cutout_900 = equalize_image(cutout_clean, target_size=900, padding_pct=0.08)
                cutout_900.save(out_path, format="WEBP", quality=85, method=6)

                sm_out_path = out_path.parent / f"{out_path.stem}-sm.webp"
                cutout_400 = equalize_image(cutout_clean, target_size=400, padding_pct=0.08)
                cutout_400.save(sm_out_path, format="WEBP", quality=85, method=6)

                processed_count += 1

                if has_defect:
                    print(f"⚠️ [ELLE KONTROL GEREKLI] ({defect_reason})", flush=True)
                    manual_check_needed.append((item['rel_out'], defect_reason))
                else:
                    print("[OK] Tamamlandı", flush=True)

        except Exception as err:
            print(f"[HATA] {err}", flush=True)
            manual_check_needed.append((item['rel_out'], f"İşlem hatası: {err}"))

    print("=" * 70, flush=True)
    print(f"\n[INFO] İşlem tamamlandı! Toplam {processed_count} görsel 'public/img-cut/' klasörüne kaydedildi.", flush=True)

    # Manuel kontrol gerekenleri konsola listele
    if manual_check_needed:
        print("\n" + "!" * 70, flush=True)
        print("[ELLE KONTROL GEREKLI] AŞAĞIDAKİ GÖRSELLERİ İNCELEYİNİZ:", flush=True)
        print("!" * 70, flush=True)
        for f_path, reason in manual_check_needed:
            print(f"   • {f_path} -> Sebep: {reason}", flush=True)
        print("!" * 70 + "\n", flush=True)
    else:
        print("\n[OK] Harika! Tüm işlenen görseller kenar ve doluluk testlerinden başarıyla geçti.\n", flush=True)

    # images.json dosyasını güncelle
    print("[INFO] src/images.json güncelleniyor...", flush=True)
    update_images_json(candidates)

if __name__ == "__main__":
    main()
