import React from 'react';
import { Pandal } from '../../types';
import { getCurrentPujaStatus, PujaFestivalStatus } from '../../utils/pujaDateStatus';
import { Globe, ExternalLink, MapPin, Sparkles } from 'lucide-react';
import { DurgaThirdEye, AlpanaCorner } from '../common/BengaliMotifs';
import QRCode from 'qrcode';

export interface FestiveFrameProps {
  pandal: Pandal;
  customDate?: string;
  imageSrc?: string | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  isPreview?: boolean;
}

export const PUJATRIP_WEBSITE_URL = 'https://puja-trip.vercel.app/';
export const DEVELOPER_PORTFOLIO_URL = 'https://amitkirankar.vercel.app/';

// Preload the authentic Durga Devi portrait asset for immediate canvas rendering
let cachedDurgaImage: HTMLImageElement | null = null;
if (typeof window !== 'undefined') {
  cachedDurgaImage = new Image();
  cachedDurgaImage.crossOrigin = 'anonymous';
  cachedDurgaImage.src = '/assets/share/durga-devi.png';
}

/**
 * Draws the complete, authentic 9:16 PujaTrip festive frame to an HTML5 canvas.
 * Produces a high-resolution, social-media ready JPEG/PNG.
 */
export function drawFestiveFrameToCanvas(
  canvas: HTMLCanvasElement,
  imageSource: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  pandal: Pandal,
  customDate?: string
): void {
  // Target standard 9:16 portrait resolution (1080 x 1920)
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const status: PujaFestivalStatus = getCurrentPujaStatus(customDate);
  const cityName = pandal.city === 'kolkata' ? 'Kolkata' : 'Contai';

  // 1. Deep Royal Maroon / Crimson Festive Background with Rich Texture
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#580816');
  bgGrad.addColorStop(0.12, '#7A0E22');
  bgGrad.addColorStop(0.45, '#35040D');
  bgGrad.addColorStop(0.75, '#500917');
  bgGrad.addColorStop(1, '#280208');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle radial gold halo in center and corners
  const topGlow = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 0, 600);
  topGlow.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
  topGlow.addColorStop(0.6, 'rgba(245, 158, 11, 0.08)');
  topGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, H * 0.35);

  // 2. Central Photo Window (Intelligent aspect ratio positioning)
  // Window occupies x: 44, y: 190, width: 992, height: 1320 (approx 3:4 / 9:12 window inside 9:16 frame)
  const photoX = 42;
  const photoY = 196;
  const photoW = W - photoX * 2; // 996
  const photoH = 1310;

  // Clip photo to rounded rectangle
  ctx.save();
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, 20);
  ctx.clip();

  // Draw user's captured photo with cover/contain intelligent fit
  const imgAspect = sourceWidth / sourceHeight;
  const windowAspect = photoW / photoH;
  let sWidth = sourceWidth;
  let sHeight = sourceHeight;
  let sX = 0;
  let sY = 0;

  if (imgAspect > windowAspect) {
    // Source is wider: crop sides
    sWidth = sourceHeight * windowAspect;
    sX = (sourceWidth - sWidth) / 2;
  } else {
    // Source is taller: crop top/bottom
    sHeight = sourceWidth / windowAspect;
    sY = (sourceHeight - sHeight) / 2;
  }

  ctx.drawImage(imageSource, sX, sY, sWidth, sHeight, photoX, photoY, photoW, photoH);

  // Soft bottom & top gradient inside photo window for text contrast
  const innerVignette = ctx.createLinearGradient(0, photoY, 0, photoY + photoH);
  innerVignette.addColorStop(0, 'rgba(40, 4, 10, 0.25)');
  innerVignette.addColorStop(0.25, 'rgba(0, 0, 0, 0)');
  innerVignette.addColorStop(0.65, 'rgba(0, 0, 0, 0)');
  innerVignette.addColorStop(0.85, 'rgba(26, 2, 7, 0.5)');
  innerVignette.addColorStop(1, 'rgba(26, 2, 7, 0.88)');
  ctx.fillStyle = innerVignette;
  ctx.fillRect(photoX, photoY, photoW, photoH);

  ctx.restore();

  // 3. Ornate Double Gold Border Around Photo Window
  ctx.save();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 5;
  drawRoundedRect(ctx, photoX - 2, photoY - 2, photoW + 4, photoH + 4, 22);
  ctx.stroke();

  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  drawRoundedRect(ctx, photoX + 6, photoY + 6, photoW - 12, photoH - 12, 16);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 4. Outer Poster Border (Double Maroon & Gold with Diamond Accents)
  ctx.save();
  const outerMargin = 16;
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, outerMargin, outerMargin, W - outerMargin * 2, H - outerMargin * 2, 28);
  ctx.stroke();

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, outerMargin + 8, outerMargin + 8, W - (outerMargin + 8) * 2, H - (outerMargin + 8) * 2, 22);
  ctx.stroke();

  // Gold diamond beads along the vertical edges
  ctx.fillStyle = '#FEF08A';
  for (let y = 260; y < 1400; y += 48) {
    drawDiamond(ctx, outerMargin + 4, y, 6);
    drawDiamond(ctx, W - outerMargin - 4, y, 6);
  }

  // Traditional Bengali Alpana Corner Ornaments at the upper corners of the frame
  drawAlpanaCornerMotif(ctx, photoX + 12, photoY + 12, 1, 1);
  drawAlpanaCornerMotif(ctx, photoX + photoW - 12, photoY + 12, -1, 1);
  ctx.restore();

  // 5. Top Header Banner
  // Red Shield Logo + PUJATRIP + KOLKATA & CONTAI + শারদ পরিক্রমা
  drawTopBanner(ctx, W);

  // 6. Illuminated Kolkata/Contai River Skyline (Howrah Bridge + Victoria Memorial)
  // Positioned along the bottom of the photo window
  drawCitySkyline(ctx, photoX, photoY + photoH - 180, photoW, 210);

  // 7. Bottom Left Pandal Info Card
  drawPandalCard(ctx, pandal, cityName, photoX + 16, H - 360, 540, 150);

  // 8. Bottom Right Festival Status Crest (Mutually Exclusive: Countdown vs Day Greeting)
  drawFestivalStatusCrest(ctx, status, W - 490, H - 395, 430, 195);

  // 9. Bottom Footer Bar (PujaTrip + Hashtags + Portfolio Link)
  drawFooterBar(ctx, W, H);
}

/**
 * Top Banner Drawing: PujaTrip Shield Logo + Slogan + Devi Durga Face silhouette
 */
function drawTopBanner(ctx: CanvasRenderingContext2D, W: number): void {
  ctx.save();

  // Top header background plate
  const headerGrad = ctx.createLinearGradient(0, 24, 0, 185);
  headerGrad.addColorStop(0, 'rgba(92, 10, 24, 0.95)');
  headerGrad.addColorStop(1, 'rgba(60, 6, 16, 0.98)');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(28, 28, W - 56, 155);

  // Bottom gold accent line under top banner
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(36, 183);
  ctx.lineTo(W - 36, 183);
  ctx.stroke();

  // Thin inner gold line
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 1;
  ctx.strokeRect(36, 36, W - 72, 140);

  // A. Logo Shield in Red & Gold (Left)
  const shieldX = 58;
  const shieldY = 52;
  const shieldW = 96;
  const shieldH = 108;

  // Shield backdrop
  const shieldGrad = ctx.createLinearGradient(shieldX, shieldY, shieldX + shieldW, shieldY + shieldH);
  shieldGrad.addColorStop(0, '#B91C1C');
  shieldGrad.addColorStop(0.5, '#DC2626');
  shieldGrad.addColorStop(1, '#881337');
  ctx.fillStyle = shieldGrad;
  drawRoundedRect(ctx, shieldX, shieldY, shieldW, shieldH, 20);
  ctx.fill();

  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, shieldX, shieldY, shieldW, shieldH, 20);
  ctx.stroke();

  // Durga Third Eye emblem inside shield
  drawDurgaEyeEmblem(ctx, shieldX + shieldW / 2, shieldY + shieldH / 2, 44);

  // B. PujaTrip Text Branding
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // "PUJATRIP"
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 46px "Cinzel", "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('PUJATRIP', 172, 94);

  // "KOLKATA & CONTAI"
  ctx.fillStyle = '#FEF08A';
  ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('KOLKATA & CONTAI', 175, 122);

  // "শারদ পরিক্রমা"
  ctx.fillStyle = '#FDE68A';
  ctx.font = '700 24px "Hind Siliguri", "Noto Serif Bengali", serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('শারদ পরিক্রমা', 175, 153);

  // C. Vertical Gold Divider
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(505, 54);
  ctx.lineTo(505, 156);
  ctx.stroke();

  // D. Slogan: "মায়ের ডাকে পথে পথে..."
  ctx.fillStyle = '#FFFDF9';
  ctx.font = '700 32px "Hind Siliguri", "Noto Serif Bengali", serif';
  ctx.fillText('মায়ের ডাকে পথে পথে...', 535, 102);

  // Decorative floral line beneath quote
  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(535, 126);
  ctx.lineTo(650, 126);
  ctx.stroke();

  ctx.fillStyle = '#FEF08A';
  drawDiamond(ctx, 660, 126, 5);

  ctx.beginPath();
  ctx.moveTo(670, 126);
  ctx.lineTo(785, 126);
  ctx.stroke();

  // E. Devi Durga Face Artwork Silhouette with Crown & Shiuli (Top Right)
  drawDurgaCrownArt(ctx, W - 150, 105, 75);

  ctx.restore();
}

/**
 * Draws the sacred Durga Third Eye (Trinayan) motif
 */
function drawDurgaEyeEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  const scale = size / 50;
  ctx.scale(scale, scale);

  // Lotus petal base
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.moveTo(-16, 12);
  ctx.bezierCurveTo(-8, 20, 8, 20, 16, 12);
  ctx.bezierCurveTo(8, 8, -8, 8, -16, 12);
  ctx.fill();

  // Devi Eye Arch
  ctx.fillStyle = '#FFFDF9';
  ctx.strokeStyle = '#881337';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.bezierCurveTo(-10, -16, 10, -16, 20, 0);
  ctx.bezierCurveTo(10, 14, -10, 14, -20, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden iris
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
  ctx.fill();

  // Dark pupil
  ctx.fillStyle = '#7F1D1D';
  ctx.beginPath();
  ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
  ctx.fill();

  // Sparkle
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(2, -2, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Top Tilak & Bindi
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(0, -22, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(0, -12);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the ornate Devi Durga face profile / crown with shiuli flowers and dhak
 */
function drawDurgaCrownArt(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  ctx.save();
  ctx.translate(cx, cy);

  // Golden halo aura
  const halo = ctx.createRadialGradient(0, 0, 10, 0, 0, radius);
  halo.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
  halo.addColorStop(0.65, 'rgba(245, 158, 11, 0.2)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // If high-resolution Bengali Durga asset is loaded, render it inside a regal gold medallion
  if (cachedDurgaImage && cachedDurgaImage.complete && cachedDurgaImage.naturalWidth > 0) {
    const medRadius = radius * 0.76;
    
    // Rich maroon medallion background
    const medGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, medRadius);
    medGrad.addColorStop(0, '#750B1D');
    medGrad.addColorStop(0.7, '#4E0713');
    medGrad.addColorStop(1, '#2E0209');
    ctx.fillStyle = medGrad;
    ctx.beginPath();
    ctx.arc(0, 0, medRadius, 0, Math.PI * 2);
    ctx.fill();

    // Clip to circle and draw Durga illustration
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, medRadius - 1, 0, Math.PI * 2);
    ctx.clip();
    const imgSize = medRadius * 2;
    ctx.drawImage(cachedDurgaImage, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
    ctx.restore();

    // Ornate double gold border ring
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, medRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, medRadius - 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Auspicious top Kalash dot
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(0, -medRadius - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
    return;
  }

  // Golden Mukut (Crown) Arches Fallback
  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = '#FEF08A';

  // Mukut apex
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.lineTo(12, -32);
  ctx.lineTo(-12, -32);
  ctx.closePath();
  ctx.fill();

  // Crown tiers
  ctx.beginPath();
  ctx.arc(0, -15, 34, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -10, 42, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  // Devi third eye on forehead
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.bezierCurveTo(5, -13, 5, -5, 0, 0);
  ctx.bezierCurveTo(-5, -5, -5, -13, 0, -22);
  ctx.fill();

  // Golden central pupil & Sindoor Bindi
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(0, -11, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(0, -28, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Arched Devi Eyebrows
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-28, -2);
  ctx.quadraticCurveTo(-14, -12, -4, -4);
  ctx.moveTo(4, -4);
  ctx.quadraticCurveTo(14, -12, 28, -2);
  ctx.stroke();

  // Sacred Almond Eyes
  ctx.fillStyle = '#FFFDF9';
  ctx.strokeStyle = '#991B1B';
  ctx.lineWidth = 1.6;

  // Left Eye
  ctx.beginPath();
  ctx.moveTo(-26, 4);
  ctx.bezierCurveTo(-18, -2, -8, -2, -5, 4);
  ctx.bezierCurveTo(-8, 9, -18, 9, -26, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Eye
  ctx.beginPath();
  ctx.moveTo(5, 4);
  ctx.bezierCurveTo(8, -2, 18, -2, 26, 4);
  ctx.bezierCurveTo(18, 9, 8, 9, 5, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dark Pupils & Golden Shimmer
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.arc(-15, 3.8, 2.5, 0, Math.PI * 2);
  ctx.arc(15, 3.8, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(-14, 3, 1, 0, Math.PI * 2);
  ctx.arc(16, 3, 1, 0, Math.PI * 2);
  ctx.fill();

  // Golden Nose Ring (Nath)
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(12, 20, 13, 0, Math.PI * 2);
  ctx.stroke();

  // Nath pendant bead
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(12, 33, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Nath chain to Mukut
  ctx.beginPath();
  ctx.moveTo(25, 17);
  ctx.quadraticCurveTo(42, 8, 48, -4);
  ctx.stroke();

  // Auspicious Red Lips
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(-8, 30);
  ctx.quadraticCurveTo(0, 26, 8, 30);
  ctx.quadraticCurveTo(0, 36, -8, 30);
  ctx.closePath();
  ctx.fill();

  // Shiuli Flower decoration (White with orange stem)
  drawShiuliFlower(ctx, -38, -25, 14);
  drawShiuliFlower(ctx, -48, 8, 16);
  drawShiuliFlower(ctx, 42, -28, 13);

  // Miniature Dhak Drum behind
  ctx.save();
  ctx.translate(-42, 34);
  ctx.rotate(-0.35);
  ctx.fillStyle = '#B91C1C';
  ctx.fillRect(-16, -12, 32, 24);
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 2;
  ctx.strokeRect(-16, -12, 32, 24);

  // Dhak ropes
  ctx.beginPath();
  ctx.moveTo(-16, -12);
  ctx.lineTo(16, 12);
  ctx.moveTo(16, -12);
  ctx.lineTo(-16, 12);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Draws an auspicious Shiuli flower (Parijat)
 */
function drawShiuliFlower(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.save();
  ctx.translate(cx, cy);

  // 5 white petals
  ctx.fillStyle = '#FFFDF9';
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.55, size * 0.28, size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Vibrant orange center (the signature of Shiuli)
  ctx.fillStyle = '#EA580C';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * City Skyline Drawing: Illuminated Howrah Bridge and Victoria Memorial Dome
 */
function drawCitySkyline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.translate(x, y);

  // Water Reflection gradient below
  const waterGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
  waterGrad.addColorStop(0, 'rgba(15, 2, 6, 0)');
  waterGrad.addColorStop(0.3, 'rgba(26, 3, 9, 0.7)');
  waterGrad.addColorStop(1, 'rgba(15, 1, 5, 0.95)');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, h * 0.5, w, h * 0.5);

  // 1. HOWRAH BRIDGE (Left side)
  ctx.save();
  ctx.strokeStyle = '#F59E0B';
  ctx.fillStyle = '#FEF08A';
  ctx.lineWidth = 2.5;

  const bStartX = 20;
  const bPylon1X = 120;
  const bPylon2X = 360;
  const bEndX = 460;
  const roadY = h * 0.62;
  const pylonTopY = h * 0.18;

  // Road deck
  ctx.beginPath();
  ctx.moveTo(bStartX, roadY);
  ctx.lineTo(bEndX, roadY);
  ctx.stroke();

  // Pylon 1 & 2
  ctx.beginPath();
  ctx.moveTo(bPylon1X - 16, roadY);
  ctx.lineTo(bPylon1X, pylonTopY);
  ctx.lineTo(bPylon1X + 16, roadY);

  ctx.moveTo(bPylon2X - 16, roadY);
  ctx.lineTo(bPylon2X, pylonTopY);
  ctx.lineTo(bPylon2X + 16, roadY);
  ctx.stroke();

  // Main suspension cantilevers
  ctx.beginPath();
  ctx.moveTo(bStartX, roadY - 10);
  ctx.lineTo(bPylon1X, pylonTopY);
  ctx.quadraticCurveTo((bPylon1X + bPylon2X) / 2, roadY - 20, bPylon2X, pylonTopY);
  ctx.lineTo(bEndX, roadY - 10);
  ctx.stroke();

  // Vertical suspender ties
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
  for (let sx = bPylon1X + 24; sx < bPylon2X; sx += 24) {
    ctx.beginPath();
    ctx.moveTo(sx, roadY);
    ctx.lineTo(sx, roadY - 18);
    ctx.stroke();
  }

  // Glowing pylon beacons
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(bPylon1X, pylonTopY, 4, 0, Math.PI * 2);
  ctx.arc(bPylon2X, pylonTopY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. VICTORIA MEMORIAL (Center-right side)
  ctx.save();
  const vmX = 490;
  const vmY = roadY;
  ctx.fillStyle = 'rgba(254, 240, 138, 0.95)';
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;

  // Central Grand Dome
  ctx.beginPath();
  ctx.arc(vmX + 60, vmY - 50, 36, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // Angel of Victory on top of dome
  ctx.beginPath();
  ctx.moveTo(vmX + 60, vmY - 86);
  ctx.lineTo(vmX + 60, vmY - 102);
  ctx.stroke();
  ctx.arc(vmX + 60, vmY - 102, 3, 0, Math.PI * 2);
  ctx.fill();

  // Colonades & facade base
  ctx.fillRect(vmX - 10, vmY - 26, 140, 26);
  ctx.strokeRect(vmX - 10, vmY - 26, 140, 26);

  // Side mini domes
  ctx.beginPath();
  ctx.arc(vmX + 10, vmY - 34, 14, Math.PI, 0);
  ctx.arc(vmX + 110, vmY - 34, 14, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // Water ripple light reflections
  ctx.save();
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
  ctx.lineWidth = 2;
  for (let ry = roadY + 8; ry < h - 10; ry += 12) {
    const startX = 60 + Math.random() * 40;
    const len = 400 + Math.random() * 150;
    ctx.beginPath();
    ctx.moveTo(startX, ry);
    ctx.lineTo(startX + len, ry);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

/**
 * Pandal Information Card Drawing (Bottom Left)
 */
function drawPandalCard(
  ctx: CanvasRenderingContext2D,
  pandal: Pandal,
  cityName: string,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();

  // Premium drop shadow for floating elevation on top of photo
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  // Rich maroon badge with subtle gradient
  const cardGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  cardGrad.addColorStop(0, '#750B1D');
  cardGrad.addColorStop(0.5, '#560613');
  cardGrad.addColorStop(1, '#3B040D');
  ctx.fillStyle = cardGrad;
  drawRoundedRect(ctx, x, y, w, h, 24);
  ctx.fill();

  // Reset shadow for crisp borders
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Ornate gold border
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, x, y, w, h, 24);
  ctx.stroke();

  // Fine inner dotted gold line
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  drawRoundedRect(ctx, x + 6, y + 6, w - 12, h - 12, 18);
  ctx.stroke();
  ctx.setLineDash([]);

  // Map pin badge
  const pinX = x + 38;
  const pinY = y + h / 2 - 4;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(pinX, pinY - 8, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(pinX, pinY - 8, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(pinX, pinY - 8, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Text content
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Primary English Pandal Title - dynamic font size if long
  ctx.fillStyle = '#FFFFFF';
  let titleFontSize = 29;
  if (pandal.name.length > 28) {
    titleFontSize = 24;
  } else if (pandal.name.length > 22) {
    titleFontSize = 26;
  }
  ctx.font = `900 ${titleFontSize}px "Plus Jakarta Sans", "Cinzel", sans-serif`;
  let displayName = pandal.name;
  if (displayName.length > 36) {
    displayName = displayName.substring(0, 34) + '...';
  }
  ctx.fillText(displayName, x + 68, y + 52);

  // Bengali Name & Locality / City
  ctx.fillStyle = '#FEF08A';
  ctx.font = '700 20px "Hind Siliguri", "Noto Serif Bengali", serif';
  const locality = pandal.area || pandal.zoneLabel || pandal.address || cityName;
  const subText = `${pandal.bengaliName}  |  ${locality} • ${cityName}`;
  let displaySub = subText;
  if (displaySub.length > 40) {
    displaySub = displaySub.substring(0, 38) + '...';
  }
  ctx.fillText(displaySub, x + 68, y + 90);

  // Small bottom verify tag
  ctx.fillStyle = '#FDE68A';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(`OFFICIAL PUJATRIP DARSHAN • 2026`, x + 68, y + 124);

  ctx.restore();
}

/**
 * Festival Status Crest Drawing (Bottom Right):
 * Parchment with Lit Diya, Dhak Drum, and Kash Phool.
 *
 * MUTUALLY EXCLUSIVE:
 * - When COUNTDOWN: displays countdown e.g. "আর ৫ দিন বাকি" and "5 DAYS TO MAHALAYA • 05 OCTOBER 2026"
 * - When MAHALAYA: displays "শুভ মহালয়া" and "SUBHO MAHALAYA • 10 OCTOBER 2026"
 * - When PUJA DAYS (Saptami): displays "শুভ সপ্তমী" and "MAHA SAPTAMI • 18 OCTOBER 2026"
 * - When POST PUJA: displays "আসছে বছর আবার হবে ❤️" and "SEE YOU NEXT PUJA"
 */
function drawFestivalStatusCrest(
  ctx: CanvasRenderingContext2D,
  status: PujaFestivalStatus,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();

  // Premium drop shadow for floating high-contrast crest
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 8;

  // 1. Parchment Badge with scalloped curved borders
  const parchGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  parchGrad.addColorStop(0, '#FFFDF5');
  parchGrad.addColorStop(0.5, '#FEF9E6');
  parchGrad.addColorStop(1, '#FDE68A');
  ctx.fillStyle = parchGrad;
  drawRoundedRect(ctx, x, y, w, h, 28);
  ctx.fill();

  // Reset shadow for crisp inner elements
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Golden trimmed double border
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, x, y, w, h, 28);
  ctx.stroke();

  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);

  // 2. Auspicious Lit Diya / Pradip on the right crest
  const diyaX = x + w - 42;
  const diyaY = y + 36;
  drawGlowingDiya(ctx, diyaX, diyaY, 24);

  // 3. Mini Kash Phool & Dhak beside Diya
  drawMiniDhakAndKash(ctx, diyaX - 32, diyaY + 28, 22);

  // 4. Festival Status Typography
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const textCenterX = x + (w - 70) / 2 + 12;

  // Primary Festive Bengali Calligraphy
  ctx.fillStyle = '#991B1B'; // Royal crimson calligraphy
  ctx.font = '900 42px "Hind Siliguri", "Noto Serif Bengali", serif';
  ctx.fillText(status.bengaliText, textCenterX, y + 78);

  // Decorative floral line
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(textCenterX - 110, y + 102);
  ctx.lineTo(textCenterX + 110, y + 102);
  ctx.stroke();

  ctx.fillStyle = '#B45309';
  drawDiamond(ctx, textCenterX, y + 102, 5);

  // Secondary English Status & Dynamic Date
  ctx.fillStyle = '#78350F';
  ctx.font = '800 18px "Cinzel", "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(status.englishText, textCenterX, y + 134);

  // Actual Calendar Date
  ctx.fillStyle = '#9A3412';
  ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillText(`— ${status.date} —`, textCenterX, y + 165);

  ctx.restore();
}

/**
 * Draws a lit Diya (Pradip) with golden flame and glow
 */
function drawGlowingDiya(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.save();
  ctx.translate(cx, cy);

  // Radial flame aura
  const aura = ctx.createRadialGradient(0, -size * 0.4, 4, 0, -size * 0.4, size * 1.5);
  aura.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
  aura.addColorStop(0.4, 'rgba(245, 158, 11, 0.35)');
  aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, -size * 0.4, size * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Terracotta Diya body
  ctx.fillStyle = '#C2410C';
  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.7, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden rim
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(-size * 0.7, -2, size * 1.4, 4);

  // Flame teardrop
  ctx.fillStyle = '#F97316';
  ctx.beginPath();
  ctx.moveTo(-size * 0.35, -2);
  ctx.bezierCurveTo(-size * 0.35, -size * 0.9, 0, -size * 1.3, 0, -size * 1.5);
  ctx.bezierCurveTo(0, -size * 1.3, size * 0.35, -size * 0.9, size * 0.35, -2);
  ctx.fill();

  // Inner bright yellow flame core
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.moveTo(-size * 0.18, -2);
  ctx.bezierCurveTo(-size * 0.18, -size * 0.65, 0, -size * 1.05, 0, -size * 1.25);
  ctx.bezierCurveTo(0, -size * 1.05, size * 0.18, -size * 0.65, size * 0.18, -2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws mini Dhak drum and Kash Phool
 */
function drawMiniDhakAndKash(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.save();
  ctx.translate(cx, cy);

  // White Kash Phool plumes
  ctx.strokeStyle = '#FFFDF9';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.quadraticCurveTo(12, -15, 24, -28);
  ctx.moveTo(0, 10);
  ctx.quadraticCurveTo(6, -20, 14, -34);
  ctx.stroke();

  // Mini Dhak body
  ctx.fillStyle = '#991B1B';
  ctx.fillRect(-size * 0.6, -size * 0.45, size * 1.2, size * 0.9);
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-size * 0.6, -size * 0.45, size * 1.2, size * 0.9);

  // Drum laces
  ctx.beginPath();
  ctx.moveTo(-size * 0.6, -size * 0.45);
  ctx.lineTo(size * 0.6, size * 0.45);
  ctx.moveTo(size * 0.6, -size * 0.45);
  ctx.lineTo(-size * 0.6, size * 0.45);
  ctx.stroke();

  ctx.restore();
}

/**
 * Bottom Footer Strip Drawing (Two High-Quality Scannable QR Codes + Hashtags)
 * Replaces URL text with scannable QR codes for PujaTrip and Developer Portfolio.
 */
function drawFooterBar(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  ctx.save();

  const footerY = H - 195;
  const footerH = 155;

  // Deep crimson footer bar container
  const footerGrad = ctx.createLinearGradient(0, footerY, 0, footerY + footerH);
  footerGrad.addColorStop(0, 'rgba(48, 5, 12, 0.96)');
  footerGrad.addColorStop(1, 'rgba(25, 2, 6, 0.99)');
  ctx.fillStyle = footerGrad;
  ctx.fillRect(40, footerY, W - 80, footerH);

  // Ornate gold frame
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, 40, footerY, W - 80, footerH, 20);
  ctx.stroke();

  // A. Left: Scannable QR Code 1 — PUJATRIP APP
  const leftCardX = 56;
  const cardY = footerY + 10;
  const cardW = 190;
  const cardH = 135;
  drawScannableQRCodeCard(ctx, PUJATRIP_WEBSITE_URL, leftCardX, cardY, cardW, cardH, 'OPEN PUJATRIP');

  // B. Center: Festive Hashtags & Bengali Branding
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Small Diya Accent
  drawGlowingDiya(ctx, W / 2, footerY + 28, 16);

  // Bengali Hashtag
  ctx.fillStyle = '#FDE68A';
  ctx.font = '700 24px "Hind Siliguri", "Noto Serif Bengali", serif';
  ctx.letterSpacing = '0.5px';
  ctx.fillText('#মায়েরডাকেপথেপথে', W / 2, footerY + 68);

  // English Campaign Hashtag
  ctx.fillStyle = '#FEF08A';
  ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('#PujaTripMoments', W / 2, footerY + 98);

  // Subtitle
  ctx.fillStyle = '#F59E0B';
  ctx.font = '800 12px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('SHAROD PARIKRAMA 2026', W / 2, footerY + 126);

  // C. Right: Scannable QR Code 2 — DEVELOPER PORTFOLIO
  const rightCardX = W - 56 - cardW;
  drawScannableQRCodeCard(ctx, DEVELOPER_PORTFOLIO_URL, rightCardX, cardY, cardW, cardH, 'DEVELOPER PORTFOLIO');

  ctx.restore();
}

/**
 * Draws a high-contrast, scannable QR code card with white/ivory background,
 * dark modules, quiet zone, gold border, and clear label underneath.
 */
function drawScannableQRCodeCard(
  ctx: CanvasRenderingContext2D,
  url: string,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  label: string
): void {
  ctx.save();

  // Subtle dark maroon card backing
  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  cardGrad.addColorStop(0, 'rgba(88, 8, 22, 0.9)');
  cardGrad.addColorStop(1, 'rgba(45, 4, 11, 0.95)');
  ctx.fillStyle = cardGrad;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 14);
  ctx.fill();

  // Subtle gold border
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 1.8;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 14);
  ctx.stroke();

  // QR Tile: clean white/ivory square
  const qrBoxSize = 92;
  const qrX = cardX + (cardW - qrBoxSize) / 2;
  const qrY = cardY + 10;

  ctx.fillStyle = '#FFFDF5';
  drawRoundedRect(ctx, qrX, qrY, qrBoxSize, qrBoxSize, 8);
  ctx.fill();

  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 1.2;
  drawRoundedRect(ctx, qrX, qrY, qrBoxSize, qrBoxSize, 8);
  ctx.stroke();

  // Draw QR Modules with quiet zone
  try {
    const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
    const count = qr.modules.size;
    const quietPadding = 6;
    const drawArea = qrBoxSize - quietPadding * 2;
    const cellSize = drawArea / count;
    const startX = qrX + quietPadding;
    const startY = qrY + quietPadding;

    ctx.fillStyle = '#111827'; // Dark charcoal/black modules for high-contrast scanning
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.modules.get(r, c)) {
          ctx.fillRect(
            startX + c * cellSize,
            startY + r * cellSize,
            cellSize + 0.3,
            cellSize + 0.3
          );
        }
      }
    }
  } catch (err) {
    console.error('[FestiveFrame] QR render failed:', err);
  }

  // Label underneath
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FEF08A';
  ctx.font = '800 12.5px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '0.5px';
  ctx.fillText(label, cardX + cardW / 2, cardY + cardH - 10);

  ctx.restore();
}

function drawGlobeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.45, r, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.stroke();

  ctx.restore();
}

function drawBriefcaseIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.save();
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const w = size * 1.3;
  const h = size * 0.9;
  const x = cx - w / 2;
  const y = cy - h / 2 + 2;

  // Main briefcase body
  drawRoundedRect(ctx, x, y, w, h, 3);
  ctx.stroke();

  // Top Handle
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.35, y);
  ctx.lineTo(cx - size * 0.35, y - size * 0.3);
  ctx.lineTo(cx + size * 0.35, y - size * 0.3);
  ctx.lineTo(cx + size * 0.35, y);
  ctx.stroke();

  // Center seam & clasp
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.45);
  ctx.lineTo(x + w, y + h * 0.45);
  ctx.stroke();

  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(cx - 2.5, y + h * 0.38, 5, 4);

  ctx.restore();
}

function drawLinkIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.save();
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.arc(cx - 4, cy + 4, size * 0.4, Math.PI * 0.75, Math.PI * 1.75);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx + 4, cy - 4, size * 0.4, -Math.PI * 0.25, Math.PI * 0.75);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 3);
  ctx.lineTo(cx + 3, cy - 3);
  ctx.stroke();

  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size, cy);
  ctx.closePath();
  ctx.fill();
}

/**
 * Traditional Bengali Alpana Corner Motif with transparent gold treatment
 */
function drawAlpanaCornerMotif(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);

  ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // Corner petal sweep
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(24, 0, 36, 12);
  ctx.quadraticCurveTo(48, 24, 48, 48);
  ctx.stroke();

  // Secondary inner sweep
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, 0, 22, 8);
  ctx.quadraticCurveTo(30, 16, 30, 32);
  ctx.stroke();

  // Corner dots
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(8, 8, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(16, 16, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
