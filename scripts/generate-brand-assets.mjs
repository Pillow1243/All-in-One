// OmniForge Pro — brand asset generator (v3 "ANVIL")
// Single source of truth: the hex-nut mark below. Every icon, splash and
// store/PWA asset is rendered from it deterministically, so the shipped
// artwork can never drift from the source.
//
//   node scripts/generate-brand-assets.mjs
//
// Mark: a machined hex nut — flat-top hexagon in safety yellow (#FFD400)
// with a black hexagonal bore, on a near-black plate. Industrial, geometric,
// readable at 48px. No gradients-as-decoration, no glow, no AI clichés.
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const CANVAS = 1024;
const CENTER = CANVAS / 2;

const PLATE = '#0A0A0A';
const PLATE_TOP = '#171717';
const NUT = '#FFD400';
const NUT_EDGE = '#E6BE00';

const R_OUTER = 332; // hexagon circumradius (flat-top)
const R_BORE = 152; // bore circumradius
const CHAMFER = 26; // chamfer ring width inside the bore edge

/** Flat-top hexagon vertices (vertices at 0°, 60°, …). */
function hexagon(radius, cx = CENTER, cy = CENTER) {
  const points = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (i * 60 * Math.PI) / 180;
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  return points;
}

const toPath = (points) => `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`;

/** The mark alone, drawn on a transparent canvas. */
function markSvg({ scale = 1, size = CANVAS } = {}) {
  const offset = (size - size * scale) / 2;
  const nutPath = `${toPath(hexagon(R_OUTER))}${toPath(hexagon(R_BORE))}`;
  const chamferPath = `${toPath(hexagon(R_BORE + CHAMFER))}${toPath(hexagon(R_BORE))}`;
  return `
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="${nutPath}" fill="${NUT}" fill-rule="evenodd"/>
    <path d="${chamferPath}" fill="${NUT_EDGE}" fill-rule="evenodd"/>
  </g>`;
}

function background({ shape = 'square' } = {}) {
  if (shape === 'transparent') return '';
  const gradient = `<defs><radialGradient id="anvil-bg" cx="50%" cy="38%" r="80%">
      <stop offset="0%" stop-color="${PLATE_TOP}"/><stop offset="62%" stop-color="#101010"/><stop offset="100%" stop-color="${PLATE}"/>
    </radialGradient></defs>`;
  if (shape === 'circle') {
    return `${gradient}<circle cx="${CENTER}" cy="${CENTER}" r="${CENTER}" fill="url(#anvil-bg)"/>`;
  }
  const rx = shape === 'rounded' ? 190 : 0;
  return `${gradient}<rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" rx="${rx}" fill="url(#anvil-bg)"/>`;
}

function iconSvg({ shape = 'square', scale = 1 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
  ${background({ shape })}
  ${markSvg({ scale })}
</svg>`;
}

function splashSvg(width, height) {
  const markSize = Math.min(width, height) * 0.52;
  const scale = markSize / (R_OUTER * 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><radialGradient id="sp" cx="50%" cy="42%" r="78%">
    <stop offset="0%" stop-color="#1b1b1b"/><stop offset="58%" stop-color="#0d0d0d"/><stop offset="100%" stop-color="${PLATE}"/>
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

console.log('OmniForge Pro — generating brand assets (v3 ANVIL)\n');

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

console.log('\nDone. Mark: hex nut (safety yellow on black plate).');
