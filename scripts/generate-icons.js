import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Write public/icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c0e17" />
      <stop offset="50%" stop-color="#141829" />
      <stop offset="100%" stop-color="#080910" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
    </radialGradient>
  </defs>
  <!-- Background with Apple-style rounded rect -->
  <rect width="512" height="512" rx="115" fill="url(#bg)" />
  <circle cx="256" cy="256" r="210" fill="url(#glow)" />
  
  <!-- Outer Ring (representing life systems) -->
  <circle cx="256" cy="256" r="150" fill="none" stroke="url(#accent)" stroke-width="14" stroke-dasharray="40 16" stroke-linecap="round" />
  
  <!-- Middle Ring -->
  <circle cx="256" cy="256" r="105" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="8" stroke-dasharray="24 12" stroke-linecap="round" />
  
  <!-- Core OS Glyph -->
  <circle cx="256" cy="256" r="54" fill="url(#accent)" />
  <circle cx="256" cy="256" r="26" fill="#0c0e17" />
  <circle cx="256" cy="256" r="10" fill="#38bdf8" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
console.log('Created icon.svg');

// 2. Helper to generate smooth circle / icon PNG
function generatePNG(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const radius = size * (isMaskable ? 0.38 : 0.44);
  const ringRadius = radius * 0.72;
  const coreRadius = radius * 0.28;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background
      let r = 12, g = 14, b = 23, a = 255;

      // Glow around center
      if (dist < radius * 1.3) {
        const glowFactor = (1 - dist / (radius * 1.3));
        r += Math.floor(60 * glowFactor);
        g += Math.floor(70 * glowFactor);
        b += Math.floor(160 * glowFactor);
      }

      // Outer ring
      const ringDist = Math.abs(dist - ringRadius);
      if (ringDist < size * 0.03) {
        // Gradient from cyan to purple based on angle
        const angle = Math.atan2(dy, dx) + Math.PI; // 0 to 2PI
        const t = angle / (2 * Math.PI);
        r = Math.floor(56 + (168 - 56) * t);
        g = Math.floor(189 - 100 * t);
        b = Math.floor(248);
      }

      // Core glyph
      if (dist < coreRadius) {
        if (dist < coreRadius * 0.45) {
          // Center dot
          r = 56; g = 189; b = 248;
        } else if (dist < coreRadius * 0.75) {
          // Inner ring hole
          r = 12; g = 14; b = 23;
        } else {
          // Core disk
          r = 99; g = 102; b = 241;
        }
      }

      // If not maskable, round corners Apple style
      if (!isMaskable) {
        const cornerR = size * 0.22;
        // check corner clip
        const nx = Math.abs(x - center);
        const ny = Math.abs(y - center);
        const half = size / 2;
        if (nx > half - cornerR && ny > half - cornerR) {
          const cdx = nx - (half - cornerR);
          const cdy = ny - (half - cornerR);
          if (cdx * cdx + cdy * cdy > cornerR * cornerR) {
            a = 0; // transparent
          }
        }
      }

      png.data[idx] = Math.min(255, r);
      png.data[idx + 1] = Math.min(255, g);
      png.data[idx + 2] = Math.min(255, b);
      png.data[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}

fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, true));

console.log('PWA icons generated successfully.');
