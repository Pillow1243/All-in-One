// OmniForge Pro — brand asset generator (v2)
// Single source of truth: the geometric mark below. Every icon, splash and
// store/PWA asset is rendered from it deterministically, so the shipped
// artwork can never drift from the source.
//
//   node scripts/generate-brand-assets.mjs
//
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const CANVAS = 1024;
const CENTER = CANVAS / 2;

const BG_DEEP = '#080d1e';
const BG_TOP = '#131c42';
const RING = '#ffffff';
const ACCENT = '#ffb020';

const R_OUTER = 316;
const R_INNER = 202;
const GAP_WIDTH = 34;
const GAP_OVERHANG = 11;
const DIAMOND_HALF_DIAGONAL = 82;

/** Regular octagon vertices, flats facing top/bottom/left/right. */
function octagon(radius, cx = CENTER, cy = CENTER) {
  const points = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = ((22.5 + i * 45) * Math.PI) / 180;
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  return points;
}

const toPath = (points) => `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`;

function gapRects() {
  const band = R_OUTER - R_INNER;
  const mid = (R_OUTER + R_INNER) / 2;
  const height = band + GAP_OVERHANG * 2;
  return [45, 135, 225, 315]
    .map((angle, index) => {
      const rad = (angle * Math.PI) / 180;
      const cx = CENTER + mid * Math.cos(rad);
      const cy = CENTER + mid * Math.sin(rad);
      return `<rect key="${index}" x="${(cx - GAP_WIDTH / 2).toFixed(2)}" y="${(cy - height / 2).toFixed(2)}" width="${GAP_WIDTH}" height="${height.toFixed(2)}" transform="rotate(${angle - 90} ${cx.toFixed(2)} ${cy.toFixed(2)})" fill="#000"/>`;
    })
    .join('\n');
}

/** The mark alone, drawn on a transparent canvas. */
function markSvg({ scale = 1, size = CANVAS } = {}) {
  const ringPath = `${toPath(octagon(R_OUTER))}${toPath(octagon(R_INNER).slice(1))}`;
  const offset = (size - size * scale) / 2;
  return `
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <defs>
      <mask id="forge-gaps" maskUnits="userSpaceOnUse" x="0" y="0" width="${CANVAS}" height="${CANVAS}">
        <rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="#fff"/>
        ${gapRects().replace(/ key="\d+"/g, '')}
      </mask>
    </defs>
    <path d="${ringPath}" fill="${RING}" fill-rule="evenodd" mask="url(#forge-gaps)"/>
    <rect x="${CENTER - DIAMOND_HALF_DIAGONAL}" y="${CENTER - DIAMOND_HALF_DIAGONAL}" width="${DIAMOND_HALF_DIAGONAL * 2}" height="${DIAMOND_HALF_DIAGONAL * 2}" transform="rotate(45 ${CENTER} ${CENTER})" fill="${ACCENT}"/>
  </g>`;
}

function background({ shape = 'square' } = {}) {
  if (shape === 'transparent') return '';
  const gradient = `<defs><linearGradient id="forge-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BG_TOP}"/><stop offset="55%" stop-color="#0c1330"/><stop offset="100%" stop-color="${BG_DEEP}"/>
    </linearGradient></defs>`;
  if (shape === 'circle') {
    return `${gradient}<circle cx="${CENTER}" cy="${CENTER}" r="${CENTER}" fill="url(#forge-bg)"/>`;
  }
  const rx = shape === 'rounded' ? 190 : 0;
  return `${gradient}<rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" rx="${rx}" fill="url(#forge-bg)"/>`;
}

function iconSvg({ shape = 'square', scale = 1 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
  ${background({ shape })}
  ${markSvg({ scale })}
</svg>`;
}

function splashSvg(width, height) {
  const markSize = Math.min(width, height) * 0.46;
  const scale = markSize / (R_OUTER * 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><radialGradient id="sp" cx="50%" cy="42%" r="75%">
    <stop offset="0%" stop-color="#16204a"/><stop offset="60%" stop-color="#0b1128"/><stop offset="100%" stop-color="${BG_DEEP}"/>
  </radialGradient></defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#sp)"/>
  <g transform="translate(${(width - CANVAS) / 2} ${(height - CANVAS) / 2})">
    ${markSvg({ scale }).replace(/translate\([^)]*\) scale\([^)]*\)/, `translate(${(CANVAS - CANVAS * scale) / 2} ${(CANVAS - CANVAS * scale) / 2}) scale(${scale})`)}
  </g>
</svg>`;
}

function render(svg, width, height) {
  const resvg = new Resvg(svg, {
    fitTo: height ? { mode: 'width', value: width } : { mode: 'width', value: width },
    background: 'rgba(0,0,0,0)',
  });
  return resvg.render().asPng();
}

function write(path, buffer) {
  const target = join(ROOT, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, buffer);
  console.log(`  ✓ ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

console.log('OmniForge Pro — generating brand assets\n');

// Source of truth
write('assets/icon.svg', Buffer.from(iconSvg({ shape: 'square' }), 'utf8'));
write('assets/icon-adaptive.svg', Buffer.from(iconSvg({ shape: 'transparent' }), 'utf8'));

// Master artwork kept in the repository
write('assets/app-icon-master.png', render(iconSvg({ shape: 'square' }), 1024));
write('assets/app-icon-fullbleed.png', render(iconSvg({ shape: 'square' }), 1024));
write('assets/app-icon-rounded.png', render(iconSvg({ shape: 'rounded' }), 1024));
write('assets/app-icon-adaptive.png', render(iconSvg({ shape: 'transparent', scale: 0.64 }), 1024));
write('assets/splash.png', render(splashSvg(1080, 1920), 1080, 1920));

// PWA / web
write('public/favicon.png', render(iconSvg({ shape: 'square' }), 256));
write('public/icons/icon-192.png', render(iconSvg({ shape: 'square' }), 192));
write('public/icons/icon-512.png', render(iconSvg({ shape: 'square' }), 512));
write('public/icons/apple-touch-icon.png', render(iconSvg({ shape: 'square' }), 180));
write('public/icons/maskable-512.png', render(iconSvg({ shape: 'transparent', scale: 0.62 }), 512));
write('public/icons/splash.png', render(splashSvg(1170, 2532), 1170, 2532));

// Android launcher icons
const LAUNCHER = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const FOREGROUND = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
for (const [density, size] of Object.entries(LAUNCHER)) {
  write(
    `android/app/src/main/res/mipmap-${density}/ic_launcher.png`,
    render(iconSvg({ shape: 'square' }), size),
  );
  write(
    `android/app/src/main/res/mipmap-${density}/ic_launcher_round.png`,
    render(iconSvg({ shape: 'circle' }), size),
  );
}
for (const [density, size] of Object.entries(FOREGROUND)) {
  write(
    `android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`,
    render(iconSvg({ shape: 'transparent', scale: 0.62 }), size),
  );
}

// Android splash screens
const SPLASH = {
  'drawable-port-mdpi': [320, 480],
  'drawable-port-hdpi': [480, 800],
  'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600],
  'drawable-port-xxxhdpi': [1280, 1920],
  'drawable-land-mdpi': [480, 320],
  'drawable-land-hdpi': [800, 480],
  'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960],
  'drawable-land-xxxhdpi': [1920, 1280],
};
for (const [folder, [w, h]] of Object.entries(SPLASH)) {
  write(`android/app/src/main/res/${folder}/splash.png`, render(splashSvg(w, h), w, h));
}
write('android/app/src/main/res/drawable/splash.png', render(splashSvg(1080, 1920), 1080, 1920));

console.log('\nDone. Mark: four forged segments + amber core.');
