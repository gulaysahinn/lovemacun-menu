import fs from 'fs';
import path from 'path';

const polishPath = path.resolve('src/polish.css');
let css = fs.readFileSync(polishPath, 'utf8');

// 1. Story val span font size: en az 13px
css = css.replace(
  /\.story-val-info span\s*\{[\s\S]*?\}/,
  `.story-val-info span {
  font-size: 13px !important;
  color: #b5a494 !important;
  line-height: 1.35 !important;
}`
);

// 2. Tradition card equal padding and full height
css = css.replace(
  /\.tradition-cards-grid\s*\{[\s\S]*?\}/,
  `.tradition-cards-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 20px !important;
  align-items: stretch !important;
}`
);

css = css.replace(
  /\.tradition-card\s*\{[\s\S]*?\}/,
  `.tradition-card {
  background: linear-gradient(145deg, #180f0a 0%, #110805 100%) !important;
  border: 1px solid rgba(255, 120, 40, 0.18) !important;
  border-radius: 18px !important;
  padding: 24px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45) !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 0.75rem !important;
  height: 100% !important;
  box-sizing: border-box !important;
  transition: transform 0.22s ease, border-color 0.22s ease !important;
}`
);

// 3. New section appended at the very end to override all previous with maximum specificity
const overrides = `

/* ==========================================================================
   UI/UX PRO MAX KESİN DÜZELTMELER & ÖLÇÜMLER (OVERRIDE SECTION)
   ========================================================================== */

/* 1. İLETİŞİM SAYFASI: HARİTA KARTSIZ / PIN MERKEZLİ & TAM 48PX BOŞLUK */
.contact-page .contact-header-section {
  padding-top: clamp(80px, 11vw, 95px) !important;
  padding-bottom: 0 !important;
  margin: 0 !important;
  text-align: center !important;
}

.contact-page .contact-sub {
  margin: 0 auto !important;
  line-height: 1.5 !important;
}

.contact-page .visit {
  margin-top: 48px !important;
  padding-top: 0 !important;
}

.contact-page .map-wrapper {
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  width: 100% !important;
}

/* Harita Kapsayıcısı: Google kartını yukarı/sola kırpan, pini tam merkezde tutan overflow:hidden pencere */
.contact-page .map-container {
  position: relative !important;
  width: 100% !important;
  height: 380px !important;
  border-radius: 20px !important;
  overflow: hidden !important;
  background: #140a06 !important;
  border: 1px solid rgba(255, 120, 40, 0.22) !important;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.5) !important;
}

.contact-page .map-container iframe,
.contact-page .map-container .map {
  position: absolute !important;
  top: -150px !important;
  left: 0 !important;
  width: 100% !important;
  height: calc(100% + 150px) !important;
  border: 0 !important;
  pointer-events: auto !important;
}

/* Mobil overlay ve buton artık yok, haritanın altında tek sıra tam genişlikte buton var */
.contact-page .map-mobile-overlay {
  display: none !important;
}

.contact-page .map-bottom-action {
  display: flex !important;
  width: 100% !important;
}

.btn-map-fullwidth {
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  background: rgba(255, 107, 0, 0.14) !important;
  border: 1px solid rgba(255, 107, 0, 0.35) !important;
  color: #ff9d4d !important;
  padding: 13px 20px !important;
  border-radius: 14px !important;
  font-size: 0.92rem !important;
  font-weight: 600 !important;
  text-decoration: none !important;
  transition: all 0.2s ease !important;
  box-sizing: border-box !important;
}

.btn-map-fullwidth:hover {
  background: #e64a19 !important;
  color: #fff !important;
  border-color: #e64a19 !important;
  transform: translateY(-2px) !important;
}

/* 2. HİKAYEMİZ FOTOĞRAF KOLAJI BAŞLIĞI */
.story-photo-caption-card {
  margin-top: 14px !important;
  margin-bottom: 16px !important;
  padding: 16px 20px !important;
  background: linear-gradient(145deg, #180f0a 0%, #110805 100%) !important;
  border: 1px solid rgba(255, 120, 40, 0.2) !important;
  border-radius: 16px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35) !important;
}

/* 3. ANA SAYFA: SONRAKİ KATEGORİ BUTONU & FOOTER BOŞLUĞU (48-64px) */
.next-category-wrap {
  display: flex !important;
  justify-content: center !important;
  margin-top: 36px !important;
  margin-bottom: 0 !important;
  width: 100% !important;
}

.btn-next-category {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  background: linear-gradient(135deg, rgba(230, 74, 25, 0.22), rgba(245, 166, 35, 0.22)) !important;
  border: 1px solid rgba(245, 166, 35, 0.4) !important;
  color: #f5a623 !important;
  font-weight: 700 !important;
  font-size: 0.98rem !important;
  padding: 13px 28px !important;
  border-radius: 99px !important;
  cursor: pointer !important;
  transition: all 0.22s ease !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
}

.btn-next-category:hover {
  background: linear-gradient(135deg, #e64a19, #f5a623) !important;
  color: #fff !important;
  border-color: #f5a623 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(230, 74, 25, 0.45) !important;
}

.menu-products-main {
  padding-bottom: 24px !important;
}

/* Footer margin üstten 28px, buton ile footer arasındaki net mesafe: 24px + 28px = 52px */
footer,
.site-footer {
  margin-top: 28px !important;
}
`;

if (!css.includes('UI/UX PRO MAX KESİN DÜZELTMELER')) {
  css += overrides;
}

fs.writeFileSync(polishPath, css, 'utf8');
console.log('Successfully applied polish overrides!');
