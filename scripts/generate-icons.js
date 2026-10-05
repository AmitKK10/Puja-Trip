import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#881337"/>
      <stop offset="35%" stop-color="#991B1B"/>
      <stop offset="70%" stop-color="#DC2626"/>
      <stop offset="100%" stop-color="#78350F"/>
    </linearGradient>
    <radialGradient id="goldGlow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.5"/>
      <stop offset="45%" stop-color="#F59E0B" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#991B1B" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#450A0A" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Base Rounded Container with Golden Festive Trim -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bgGrad)"/>
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#goldGlow)"/>
  <rect x="16" y="16" width="480" height="480" rx="108" fill="none" stroke="#F59E0B" stroke-width="6" stroke-opacity="0.75"/>
  <rect x="28" y="28" width="456" height="456" rx="96" fill="none" stroke="#FEF08A" stroke-width="1.8" stroke-opacity="0.4" stroke-dasharray="8 5"/>

  <!-- Centered Durga Third Eye Emblem -->
  <g filter="url(#shadow)" transform="translate(256, 238) scale(7.8) translate(-22, -22)">
    <!-- Lotus Petal Base -->
    <path d="M12 30 C 18 34, 26 34, 32 30 C 28 27, 16 27, 12 30 Z" fill="#FDE68A"/>
    
    <!-- Devi Eye Arch & Trip Path -->
    <path d="M8 22 C 16 11, 28 11, 36 22 C 28 30, 16 30, 8 22 Z" stroke="#FFFDF9" stroke-width="2.5" fill="#881337" stroke-linejoin="round"/>
    <circle cx="22" cy="21.5" r="5" fill="#F59E0B"/>
    <circle cx="22" cy="21.5" r="2.5" fill="#7F1D1D"/>
    <circle cx="23.3" cy="20.3" r="1.0" fill="#FFFDF9"/>
    
    <!-- Forehead Sindoor Bindi & Tilak -->
    <circle cx="22" cy="7.2" r="2.5" fill="#FEF08A"/>
    <path d="M22 10.2 L22 13.5" stroke="#FEF08A" stroke-width="1.8" stroke-linecap="round"/>

    <!-- Auspicious Eyebrows -->
    <path d="M9 16 C 14 11, 19 11, 21 14" stroke="#FFFDF9" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <path d="M23 14 C 25 11, 30 11, 35 16" stroke="#FFFDF9" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Typography Brand Accent -->
  <text x="256" y="420" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" letter-spacing="6" fill="#FEF08A">PUJATRIP</text>
  <text x="256" y="452" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" letter-spacing="2" fill="#FDE68A" opacity="0.85">পূজাত্রিপ</text>
</svg>`;

// Maskable icon: full-bleed background, safe zone in central 80% (60% scale)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="mBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#70102B"/>
      <stop offset="35%" stop-color="#881337"/>
      <stop offset="70%" stop-color="#991B1B"/>
      <stop offset="100%" stop-color="#450A0A"/>
    </linearGradient>
    <radialGradient id="mGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.45"/>
      <stop offset="50%" stop-color="#F59E0B" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#70102B" stop-opacity="0"/>
    </radialGradient>
    <filter id="mShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#300707" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Full Bleed Background (no rounded corners, extends edge to edge) -->
  <rect x="0" y="0" width="512" height="512" fill="url(#mBgGrad)"/>
  <circle cx="256" cy="256" r="230" fill="url(#mGlow)"/>

  <!-- Subtle Alpana circular motif within safe zone -->
  <circle cx="256" cy="256" r="176" fill="none" stroke="#F59E0B" stroke-width="2" stroke-opacity="0.4" stroke-dasharray="6 6"/>
  <circle cx="256" cy="256" r="186" fill="none" stroke="#FEF08A" stroke-width="1.2" stroke-opacity="0.3"/>

  <!-- Centered Durga Third Eye Artwork scaled inside Android safe circle (diameter ~300px out of 512) -->
  <g filter="url(#mShadow)" transform="translate(256, 240) scale(6.2) translate(-22, -22)">
    <!-- Lotus Petal Base -->
    <path d="M12 30 C 18 34, 26 34, 32 30 C 28 27, 16 27, 12 30 Z" fill="#FDE68A"/>
    
    <!-- Devi Eye Arch & Trip Path -->
    <path d="M8 22 C 16 11, 28 11, 36 22 C 28 30, 16 30, 8 22 Z" stroke="#FFFDF9" stroke-width="2.5" fill="#881337" stroke-linejoin="round"/>
    <circle cx="22" cy="21.5" r="5" fill="#F59E0B"/>
    <circle cx="22" cy="21.5" r="2.5" fill="#7F1D1D"/>
    <circle cx="23.3" cy="20.3" r="1.0" fill="#FFFDF9"/>
    
    <!-- Forehead Sindoor Bindi & Tilak -->
    <circle cx="22" cy="7.2" r="2.5" fill="#FEF08A"/>
    <path d="M22 10.2 L22 13.5" stroke="#FEF08A" stroke-width="1.8" stroke-linecap="round"/>

    <!-- Auspicious Eyebrows -->
    <path d="M9 16 C 14 11, 19 11, 21 14" stroke="#FFFDF9" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <path d="M23 14 C 25 11, 30 11, 35 16" stroke="#FFFDF9" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Typography within safe zone -->
  <text x="256" y="385" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="900" letter-spacing="5" fill="#FEF08A">PUJATRIP</text>
</svg>`;

// Write public/icon.svg
fs.writeFileSync(path.join(process.cwd(), 'public', 'icon.svg'), standardSvg);

// Render standard PNG 512
const resvg512 = new Resvg(standardSvg, { fitTo: { mode: 'width', value: 512 } });
fs.writeFileSync(path.join(process.cwd(), 'public', 'pwa-512x512.png'), resvg512.render().asPng());

// Render standard PNG 192
const resvg192 = new Resvg(standardSvg, { fitTo: { mode: 'width', value: 192 } });
fs.writeFileSync(path.join(process.cwd(), 'public', 'pwa-192x192.png'), resvg192.render().asPng());

// Render apple-touch-icon 180x180
const resvg180 = new Resvg(standardSvg, { fitTo: { mode: 'width', value: 180 } });
fs.writeFileSync(path.join(process.cwd(), 'public', 'apple-touch-icon.png'), resvg180.render().asPng());

// Render maskable PNG 512
const resvgMaskable = new Resvg(maskableSvg, { fitTo: { mode: 'width', value: 512 } });
fs.writeFileSync(path.join(process.cwd(), 'public', 'pwa-maskable-512x512.png'), resvgMaskable.render().asPng());

console.log('All icons generated successfully!');
