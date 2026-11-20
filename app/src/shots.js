// ?shot= routes for screenshots. `cover` paints the cover full-viewport
// (controls hidden by the shot-cover body class); `editor` shows the editor
// with the samples loaded. Either way window.__shotReady is set after two
// animation frames, once fonts and photos are in.
import { loadSample, freshCrop } from './photos.js';
import { renderCover, buildAssets } from './cover.js';
import { CAPTION_BY_LAYOUT, SIZES } from './main.js';

function readParams() {
  const q = new URLSearchParams(location.search);
  return {
    shot: q.get('shot'),
    layout: q.get('layout'),
    size: q.get('size'),
    caption: q.get('caption'),
    tagline: q.get('tagline'),
    her: q.get('her'),
    him: q.get('him'),
    sky: q.get('sky') || q.get('photo'),
  };
}

function applyParams(state, params) {
  if (params.layout && CAPTION_BY_LAYOUT[params.layout]) state.layout = params.layout;
  if (params.size && SIZES[params.size]) state.size = params.size;
  if (params.caption) state.caption = params.caption;
  else if (params.layout) state.caption = CAPTION_BY_LAYOUT[params.layout];
  if (params.tagline) state.tagline = params.tagline;
  if (params.her) state.crops.her = freshCrop(params.her);
  if (params.him) state.crops.him = freshCrop(params.him);
  if (params.sky) state.crops.sky = freshCrop(params.sky);
}

function afterTwoFrames() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function bootShot(state, drawPreview) {
  const params = readParams();
  if (!params.shot) return false;
  applyParams(state, params);

  if (params.shot === 'cover') {
    document.body.classList.add('shot-cover');
    const stage = document.getElementById('stage');
    stage.width = window.innerWidth;
    stage.height = window.innerHeight;
    const assets = await buildAssets(state, loadSample);
    renderCover(stage.getContext('2d'), stage.width, stage.height, state, assets.images, assets.grain);
    await afterTwoFrames();
    window.__shotReady = true;
    return true;
  }

  if (params.shot === 'editor') {
    // Keep the editor visible; sync its fields with the shot params.
    const caption = document.getElementById('caption');
    if (caption) caption.value = state.caption;
    const tagline = document.getElementById('tagline');
    if (tagline) tagline.value = state.tagline;
    await drawPreview();
    await afterTwoFrames();
    window.__shotReady = true;
    return true;
  }

  return false;
}
