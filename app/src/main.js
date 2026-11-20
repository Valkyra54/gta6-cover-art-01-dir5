// Editor wiring: tray, layout/size pickers, caption fields, grade controls,
// drag-pan + wheel-zoom on the live preview, one-click PNG export, and the
// ?shot= boot for screenshots.
import { loadFonts, fontsReady } from './fonts.js';
import { SAMPLES, loadSample, loadImage, freshCrop, clampCrop, sampleUrl } from './photos.js';
import { renderCover, buildAssets } from './cover.js';
import { planFor } from './layouts.js';
import { bootShot } from './shots.js';

export const CAPTION_BY_LAYOUT = {
  duo: 'TWO FOR THE ROAD',
  split: 'GOLDEN HOUR',
  car: 'LAST LIGHT DUO',
};

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide' },
};

export function defaultState() {
  return {
    layout: 'duo',
    size: '1920x1080',
    sunset: 70,
    neon: true,
    caption: CAPTION_BY_LAYOUT.duo,
    tagline: 'EVERY SUNSET HAS A PRICE',
    nameHer: 'MARA VOSS',
    nameHim: 'DARIO KENT',
    dateLine: 'NOV 20 2026',
    crops: {
      sky: freshCrop('boulevard'),
      her: freshCrop('woman'),
      him: freshCrop('man'),
    },
    selected: 'her',
  };
}

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const sctx = stage.getContext('2d');
let state = defaultState();
let assets = null;
let renderToken = 0;

function previewSize() {
  const size = SIZES[state.size] || SIZES['1920x1080'];
  const scale = Math.min(1, 960 / Math.max(size.w, size.h));
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

async function drawPreview() {
  const token = ++renderToken;
  if (!assets) assets = await buildAssets(state, loadSample);
  if (token !== renderToken) return;
  const { w, h } = previewSize();
  if (stage.width !== w || stage.height !== h) {
    stage.width = w;
    stage.height = h;
  }
  renderCover(sctx, w, h, state, assets.images, assets.grain);
  highlightSelected(w, h);
}

function highlightSelected(w, h) {
  const plan = planFor(state.layout, w, h, state);
  const cell = plan.cells.find((c) => c.slot === state.selected);
  if (!cell || !cell.border) return;
  sctx.save();
  sctx.strokeStyle = '#ff2e88';
  sctx.lineWidth = 3;
  sctx.setLineDash([10, 6]);
  sctx.strokeRect(cell.x - 4, cell.y - 4, cell.w + 8, cell.h + 8);
  sctx.restore();
}

function scheduleDraw() {
  requestAnimationFrame(() => drawPreview());
}

function buildTray() {
  const tray = $('tray');
  tray.innerHTML = '';
  for (const sample of SAMPLES) {
    const fig = document.createElement('figure');
    fig.dataset.photoId = sample.id;
    const img = document.createElement('img');
    img.src = sampleUrl(sample);
    img.alt = sample.label;
    const cap = document.createElement('figcaption');
    cap.textContent = sample.label;
    fig.append(img, cap);
    fig.addEventListener('click', () => assignPhoto(sample.id));
    tray.append(fig);
  }
}

function markTray() {
  for (const fig of document.querySelectorAll('#tray figure')) {
    const crop = state.crops[state.selected];
    fig.classList.toggle('picked', !!crop && fig.dataset.photoId === crop.photoId);
  }
}

async function assignPhoto(photoId) {
  const crop = state.crops[state.selected];
  if (!crop) return;
  crop.photoId = photoId;
  const sample = SAMPLES.find((s) => s.id === photoId);
  if (sample) crop.focus = sample.focus;
  crop.panX = 0;
  crop.panY = 0;
  assets = await buildAssets(state, loadSample);
  markTray();
  scheduleDraw();
}

function canvasPoint(event) {
  const rect = stage.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * stage.width,
    y: ((event.clientY - rect.top) / rect.height) * stage.height,
  };
}

function pickCell(point) {
  const plan = planFor(state.layout, stage.width, stage.height, state);
  for (let i = plan.cells.length - 1; i >= 0; i -= 1) {
    const c = plan.cells[i];
    if (c.slot === 'sky') continue;
    if (point.x >= c.x && point.x <= c.x + c.w && point.y >= c.y && point.y <= c.y + c.h) return c.slot;
  }
  return null;
}

let drag = null;

stage.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const slot = pickCell(point);
  if (!slot) return;
  state.selected = slot;
  markTray();
  drag = { slot, lastX: point.x, lastY: point.y, moved: false };
  stage.setPointerCapture(event.pointerId);
  scheduleDraw();
});

stage.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const point = canvasPoint(event);
  const plan = planFor(state.layout, stage.width, stage.height, state);
  const cell = plan.cells.find((c) => c.slot === drag.slot);
  if (!cell) return;
  const crop = state.crops[drag.slot];
  crop.panX += (point.x - drag.lastX) / cell.w;
  crop.panY += (point.y - drag.lastY) / cell.h;
  clampCrop(crop);
  drag.lastX = point.x;
  drag.lastY = point.y;
  drag.moved = true;
  scheduleDraw();
});

stage.addEventListener('pointerup', () => { drag = null; });

stage.addEventListener('wheel', (event) => {
  event.preventDefault();
  const crop = state.crops[state.selected];
  if (!crop) return;
  crop.zoom *= 1 - event.deltaY * 0.001;
  clampCrop(crop);
  scheduleDraw();
}, { passive: false });

function bindPicker(id, attr, apply) {
  const box = $(id);
  box.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;
    for (const other of box.querySelectorAll('button')) other.classList.remove('on');
    btn.classList.add('on');
    apply(btn.dataset[attr]);
  });
}

bindPicker('layoutChoices', 'layout', (layout) => {
  state.layout = layout;
  if (!$('caption').value || Object.values(CAPTION_BY_LAYOUT).includes($('caption').value)) {
    state.caption = CAPTION_BY_LAYOUT[layout];
    $('caption').value = state.caption;
  }
  scheduleDraw();
});

bindPicker('sizeChoices', 'size', (size) => {
  state.size = size;
  scheduleDraw();
});

$('caption').addEventListener('input', (e) => { state.caption = e.target.value; scheduleDraw(); });
$('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; scheduleDraw(); });
$('nameHer').addEventListener('input', (e) => { state.nameHer = e.target.value; scheduleDraw(); });
$('nameHim').addEventListener('input', (e) => { state.nameHim = e.target.value; scheduleDraw(); });
$('sunset').addEventListener('input', (e) => {
  state.sunset = Number(e.target.value);
  $('sunsetVal').textContent = String(state.sunset);
  scheduleDraw();
});
$('neon').addEventListener('change', (e) => { state.neon = e.target.checked; scheduleDraw(); });

$('upload').addEventListener('change', async (event) => {
  for (const file of event.target.files) {
    const url = URL.createObjectURL(file);
    await loadImage(url);
    const id = `upload-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    SAMPLES.push({ id, file: url, label: file.name.slice(0, 18), focus: { x: 0.5, y: 0.4 }, face: null, url });
    const tray = $('tray');
    const fig = document.createElement('figure');
    fig.dataset.photoId = id;
    const thumb = document.createElement('img');
    thumb.src = url;
    thumb.alt = file.name;
    const cap = document.createElement('figcaption');
    cap.textContent = file.name.slice(0, 18);
    fig.append(thumb, cap);
    fig.addEventListener('click', () => assignPhoto(id));
    tray.append(fig);
  }
  event.target.value = '';
});

// Export the real PNG at the exact chosen size, drawn fresh at full size.
$('exportBtn').addEventListener('click', async () => {
  const size = SIZES[state.size] || SIZES['1920x1080'];
  $('status').textContent = 'Rendering…';
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  const octx = off.getContext('2d');
  const fresh = await buildAssets(state, loadSample);
  renderCover(octx, size.w, size.h, state, fresh.images, fresh.grain);
  off.toBlob((blob) => {
    if (!blob) {
      $('status').textContent = 'Export failed — try again.';
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    $('status').textContent = `Saved cover-${size.w}x${size.h}.png`;
  }, 'image/png');
});

buildTray();
markTray();

loadFonts().then(() => {
  if (!fontsReady()) console.warn('a cover font did not report ready');
  bootShot(state, drawPreview).then((handled) => {
    if (!handled) scheduleDraw();
  });
});
