// Cover rendering: sunset grade, seeded grain, stacked title lettering,
// palm silhouettes and birds — everything drawn on one canvas at export size.
import { drawPhotoCover } from './photos.js';
import { planFor } from './layouts.js';

const NAVY = '#14101f';
const MAGENTA = '#ff2e88';
const AMBER = '#ffb347';
const PURPLE = '#7b2ff7';

// Fixed-seed noise so repeat exports are byte-stable.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeGrainTile() {
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(128, 128);
  const rand = mulberry32(20261120);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  return tile;
}

// One shared grade for every frame: a purple → magenta → amber tonal band,
// a warm horizon glow, and a soft-light pass. `sunset` (0–100) scales it.
export function gradePhoto(ctx, cell, sunset, neon) {
  const s = Math.max(0, Math.min(100, sunset)) / 100;
  const g = ctx.createLinearGradient(0, cell.y, 0, cell.y + cell.h);
  g.addColorStop(0, 'rgba(255,122,61,0)');
  g.addColorStop(0.35, `rgba(255,122,61,${0.26 * s})`);
  g.addColorStop(0.6, `rgba(255,46,136,${0.28 * s})`);
  g.addColorStop(0.85, `rgba(123,47,247,${0.3 * s})`);
  g.addColorStop(1, `rgba(20,16,31,${0.34 * s})`);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = g;
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  ctx.restore();

  const glow = ctx.createRadialGradient(
    cell.x + cell.w / 2, cell.y + cell.h * 0.32, 0,
    cell.x + cell.w / 2, cell.y + cell.h * 0.32, cell.w * 0.55,
  );
  glow.addColorStop(0, `rgba(255,179,71,${0.22 * s})`);
  glow.addColorStop(1, 'rgba(255,179,71,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = g;
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  ctx.restore();
  void neon;
}

// Biggest Anton size whose widest line still fits `maxW` and whose stack
// still fits `maxH`.
function fitTitleSize(ctx, lines, maxW, maxH) {
  const lineHeight = 0.94;
  let size = maxH / (lines.length * lineHeight);
  ctx.font = '100px Anton, sans-serif';
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
  if (widest > 0) size = Math.min(size, (100 * maxW) / widest);
  return Math.max(8, size);
}

export function drawTitle(ctx, spec, neon) {
  const size = fitTitleSize(ctx, spec.lines, spec.w, spec.maxH);
  const lineHeight = size * 0.94;
  const total = spec.lines.length * lineHeight;
  let y = spec.y + (spec.maxH - total) / 2 + size * 0.78;
  ctx.textAlign = spec.align || 'center';
  ctx.textBaseline = 'alphabetic';
  for (const line of spec.lines) {
    const x = spec.x;
    ctx.font = `${size}px Anton, sans-serif`;
    // Magenta offset edge first, then the white face on top.
    const off = size * 0.022 * (neon ? 1.6 : 1);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = size * 0.05;
    ctx.shadowOffsetY = size * 0.02;
    ctx.fillStyle = MAGENTA;
    ctx.fillText(line, x + off, y + off);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, x, y);
    ctx.restore();
    y += lineHeight;
  }
  return size;
}

export function drawTagline(ctx, text, x, y, width) {
  if (!text) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = `${Math.max(2, width * 0.004)}px`; } catch (e) { /* older canvas: no tracking */ }
  ctx.font = `600 ${Math.max(10, width * 0.016)}px Oswald, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.restore();
}

export function drawCredits(ctx, marks, W) {
  if (!marks.left && !marks.right) return;
  ctx.save();
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = '3px'; } catch (e) { /* no tracking */ }
  ctx.font = `600 ${Math.max(10, W * 0.013)}px Oswald, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  if (marks.left) {
    ctx.textAlign = 'left';
    ctx.fillText(marks.left, W * 0.04, marks.y);
  }
  if (marks.right) {
    ctx.textAlign = 'right';
    ctx.fillText(marks.right, W * 0.96, marks.y);
  }
  ctx.restore();
}

export function drawNameplate(ctx, name, x, y, align, width) {
  ctx.save();
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.max(16, width * 0.038)}px "Great Vibes", cursive`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillText(name, x, y);
  ctx.restore();
}

function drawPalm(ctx, palm) {
  const { x, baseY, h, lean } = palm;
  const topX = x + lean;
  const topY = baseY - h;
  ctx.save();
  ctx.strokeStyle = '#0d0817';
  ctx.fillStyle = '#0d0817';
  ctx.lineCap = 'round';
  // Trunk, slightly bowed.
  ctx.lineWidth = Math.max(3, h * 0.02);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * 0.4, baseY - h * 0.55, topX, topY);
  ctx.stroke();
  // Fronds fanning out from the crown.
  ctx.lineWidth = Math.max(2, h * 0.012);
  const spread = h * 0.3;
  for (let i = -3; i <= 3; i += 1) {
    const tipX = topX + (i / 3) * spread;
    const tipY = topY + Math.abs(i) * h * 0.045 + h * 0.06;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + (i / 3) * spread * 0.7, topY - h * 0.05, tipX, tipY);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX - h * 0.012, topY + h * 0.012, h * 0.014, 0, Math.PI * 2);
  ctx.arc(topX + h * 0.014, topY + h * 0.016, h * 0.012, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBird(ctx, bird) {
  ctx.save();
  ctx.strokeStyle = 'rgba(13,8,23,0.85)';
  ctx.lineWidth = Math.max(1.5, bird.s * 0.09);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bird.x - bird.s, bird.y);
  ctx.quadraticCurveTo(bird.x - bird.s * 0.4, bird.y - bird.s * 0.55, bird.x, bird.y);
  ctx.quadraticCurveTo(bird.x + bird.s * 0.4, bird.y - bird.s * 0.55, bird.x + bird.s, bird.y);
  ctx.stroke();
  ctx.restore();
}

function drawFrame(ctx, cell, img, crop, state) {
  const cx = cell.x + cell.w / 2;
  const cy = cell.y + cell.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((cell.tilt || 0) * Math.PI) / 180);
  const local = { x: -cell.w / 2, y: -cell.h / 2, w: cell.w, h: cell.h };
  ctx.beginPath();
  ctx.rect(local.x, local.y, local.w, local.h);
  ctx.clip();
  drawPhotoCover(ctx, img, local, crop);
  gradePhoto(ctx, local, state.sunset, state.neon);
  ctx.restore();
  if (cell.border) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((cell.tilt || 0) * Math.PI) / 180);
    if (state.neon) {
      ctx.shadowColor = MAGENTA;
      ctx.shadowBlur = Math.max(6, cell.w * 0.03);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, cell.w * 0.004);
    ctx.strokeRect(-cell.w / 2, -cell.h / 2, cell.w, cell.h);
    ctx.restore();
  }
}

// Paint the whole cover at exactly W x H. `images` maps slot ids to loaded
// Image elements; `grain` is the seeded noise tile.
export function renderCover(ctx, W, H, state, images, grain) {
  ctx.save();
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, H);
  const plan = planFor(state.layout, W, H, state);

  const sky = plan.cells.find((c) => c.slot === 'sky');
  if (sky && images.sky) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    drawPhotoCover(ctx, images.sky, sky, state.crops.sky);
    gradePhoto(ctx, sky, state.sunset, state.neon);
    ctx.restore();
  }

  // A soft scrim behind the title so white letters hold over bright sky.
  if (state.layout !== 'split') {
    const scrim = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    scrim.addColorStop(0, 'rgba(16,8,28,0.38)');
    scrim.addColorStop(1, 'rgba(16,8,28,0)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, W, H * 0.45);
  }

  for (const palm of plan.palms) drawPalm(ctx, palm);
  for (const bird of plan.birds) drawBird(ctx, bird);

  for (const cell of plan.cells) {
    if (cell.slot === 'sky') continue;
    const img = images[cell.slot];
    if (!img) continue;
    drawFrame(ctx, cell, img, state.crops[cell.slot], state);
  }

  if (plan.title.band) {
    const band = ctx.createLinearGradient(0, 0, W, 0);
    band.addColorStop(0, 'rgba(10,6,20,0)');
    band.addColorStop(0.5, 'rgba(10,6,20,0.5)');
    band.addColorStop(1, 'rgba(10,6,20,0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, plan.title.y - plan.title.maxH * 0.12, W, plan.title.maxH * 1.24);
  }

  drawTitle(ctx, plan.title, state.neon);
  if (plan.tagline.text) drawTagline(ctx, plan.tagline.text, plan.tagline.x, plan.tagline.y, W);
  for (const name of plan.names) drawNameplate(ctx, name.text, name.x, name.y, name.align, W);
  drawCredits(ctx, plan.marks, W);

  // Vignette, then the seeded grain over everything.
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(10,6,20,0)');
  vig.addColorStop(1, 'rgba(10,6,20,0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  if (grain) {
    const pattern = ctx.createPattern(grain, 'repeat');
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  ctx.restore();
}

// Load every sample the current state needs and hand back slot → Image.
export async function buildAssets(state, loadSample) {
  const images = {};
  for (const slot of ['sky', 'her', 'him']) {
    const crop = state.crops[slot];
    if (!crop) continue;
    images[slot] = await loadSample(crop.photoId);
  }
  return { images, grain: makeGrainTile() };
}
