// Photo store: the shipped samples plus anything the user uploads. Each
// sample carries a focus point (where a cover crop should anchor) and, for
// portraits, a face box so no crop ever cuts a face out of its frame.
export const SAMPLES = [
  {
    id: 'woman',
    file: 'samples/protective-woman.jpg',
    label: 'Mara · protective',
    focus: { x: 0.35, y: 0.32 },
    face: { x: 0.32, y: 0.27, w: 0.32 },
  },
  {
    id: 'man',
    file: 'samples/duo-man.jpg',
    label: 'Dario · duo',
    focus: { x: 0.53, y: 0.30 },
    face: { x: 0.53, y: 0.30, w: 0.30 },
  },
  {
    id: 'boulevard',
    file: 'samples/sunset-boulevard.jpg',
    label: 'Sunset boulevard',
    focus: { x: 0.5, y: 0.45 },
    face: null,
  },
  {
    id: 'street',
    file: 'samples/boulevard.jpg',
    label: 'Boulevard',
    focus: { x: 0.5, y: 0.4 },
    face: null,
  },
  {
    id: 'pier',
    file: 'samples/pier.jpg',
    label: 'Pier',
    focus: { x: 0.5, y: 0.4 },
    face: null,
  },
];

export const SAMPLE_BY_ID = new Map(SAMPLES.map((s) => [s.id, s]));

const imageCache = new Map();

export function sampleUrl(sample) {
  if (sample.url) return sample.url;
  return new URL(`../${sample.file}`, import.meta.url).href;
}

export function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const done = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
  imageCache.set(src, done);
  return done;
}

export function loadSample(id) {
  const sample = SAMPLE_BY_ID.get(id);
  if (sample) return loadImage(sampleUrl(sample));
  // An uploaded photo: it lives only in the live SAMPLES list, keyed by its
  // object URL.
  const upload = SAMPLES.find((s) => s.id === id);
  if (!upload || !upload.url) throw new Error(`unknown sample ${id}`);
  return loadImage(upload.url);
}

// One frame's crop: which photo, how far zoomed in, and how far panned.
// Pan is stored as a fraction of the frame's own size.
export function freshCrop(photoId) {
  const sample = SAMPLE_BY_ID.get(photoId);
  return { photoId, zoom: 1, panX: 0, panY: 0, focus: sample ? sample.focus : { x: 0.5, y: 0.5 } };
}

// Draw an image cover-fit inside a cell, anchored on its focus point so a
// face stays in frame, then clamped so the image always covers the cell.
export function drawPhotoCover(ctx, img, cell, crop) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const zoom = Math.max(1, Math.min(3, crop.zoom || 1));
  const scale = Math.max(cell.w / iw, cell.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const fx = crop.focus ? crop.focus.x : 0.5;
  const fy = crop.focus ? crop.focus.y : 0.5;
  let dx = cell.x + cell.w / 2 - fx * dw + (crop.panX || 0) * cell.w;
  let dy = cell.y + cell.h / 2 - fy * dh + (crop.panY || 0) * cell.h;
  dx = Math.min(cell.x, Math.max(cell.x + cell.w - dw, dx));
  dy = Math.min(cell.y, Math.max(cell.y + cell.h - dh, dy));
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Keep a focus point visible inside a cell: the largest zoom-out that still
// shows the whole face box is 1, so zoom never drops below it.
export function clampCrop(crop) {
  crop.zoom = Math.max(1, Math.min(3, crop.zoom || 1));
  crop.panX = Math.max(-0.5, Math.min(0.5, crop.panX || 0));
  crop.panY = Math.max(-0.5, Math.min(0.5, crop.panY || 0));
  return crop;
}
