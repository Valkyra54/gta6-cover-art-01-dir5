// The three duo layouts. Every layout is anchored on the same pair — the
// woman on one side, the man on the other — and every plan keeps the title
// clear of both faces: faces live in the lower frames (duo, car) or above
// the title band (split), never underneath the lettering.
//
// A plan is plain geometry in cover pixels:
//   cells   — photo frames {slot, x, y, w, h, tilt, border}
//   title   — stacked caption {lines, x, y, w, maxH, align}
//   tagline — one small line {text, x, y}
//   names   — handwritten nameplates {text, x, y, align}
//   marks   — thin numeral / date {left, right, y}
//   palms   — silhouette palms {x, baseY, h, lean}
//   birds   — sky birds {x, y, s}

export const LAYOUT_NAMES = { duo: 'Duo Hood', split: 'Split', car: 'Car' };

// Split a caption's words into `count` stacked lines, as even as possible.
export function stackLines(text, count) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  if (count <= 1 || words.length === 1) return [words.join(' ')];
  const lines = Array.from({ length: count }, () => []);
  const perLine = Math.ceil(words.length / count);
  let line = 0;
  for (const word of words) {
    if (lines[line].length >= perLine && line < count - 1) line += 1;
    lines[line].push(word);
  }
  return lines.map((parts) => parts.join(' ')).filter(Boolean);
}

function duoPlan(W, H, state) {
  const titleLines = stackLines(state.caption, state.caption.trim().split(/\s+/).length > 4 ? 3 : 2);
  return {
    cells: [
      { slot: 'sky', x: 0, y: 0, w: W, h: H, tilt: 0, border: false },
      { slot: 'her', x: 0.055 * W, y: 0.4 * H, w: 0.4 * W, h: 0.55 * H, tilt: -1.5, border: true },
      { slot: 'him', x: 0.545 * W, y: 0.4 * H, w: 0.4 * W, h: 0.55 * H, tilt: 1.5, border: true },
    ],
    title: { lines: titleLines, x: W / 2, y: 0.035 * H, w: 0.94 * W, maxH: 0.33 * H, align: 'center' },
    tagline: { text: state.tagline, x: W / 2, y: 0.972 * H },
    names: [],
    marks: { left: 'N° 01', right: state.dateLine, y: 0.972 * H },
    palms: [
      { x: 0.012 * W, baseY: 0.98 * H, h: 0.52 * H, lean: -0.02 * W },
      { x: 0.988 * W, baseY: 0.98 * H, h: 0.46 * H, lean: 0.02 * W },
    ],
    birds: [],
  };
}

function splitPlan(W, H, state) {
  const titleLines = stackLines(state.caption, 2);
  return {
    cells: [
      { slot: 'her', x: 0, y: 0, w: W / 2, h: H, tilt: 0, border: false },
      { slot: 'him', x: W / 2, y: 0, w: W / 2, h: H, tilt: 0, border: false },
    ],
    title: { lines: titleLines, x: W / 2, y: 0.44 * H, w: 0.96 * W, maxH: 0.26 * H, align: 'center', band: true },
    tagline: { text: state.tagline, x: W / 2, y: 0.035 * H },
    names: [
      { text: state.nameHer, x: 0.06 * W, y: 0.9 * H, align: 'left' },
      { text: state.nameHim, x: 0.94 * W, y: 0.9 * H, align: 'right' },
    ],
    marks: { left: '', right: '', y: 0 },
    palms: [],
    birds: [],
  };
}

function carPlan(W, H, state) {
  const titleLines = stackLines(state.caption, 3);
  return {
    cells: [
      { slot: 'sky', x: 0, y: 0, w: W, h: H, tilt: 0, border: false },
      { slot: 'her', x: 0.05 * W, y: 0.66 * H, w: 0.42 * W, h: 0.3 * H, tilt: -2, border: true },
      { slot: 'him', x: 0.53 * W, y: 0.66 * H, w: 0.42 * W, h: 0.3 * H, tilt: 2, border: true },
    ],
    title: { lines: titleLines, x: W / 2, y: 0.05 * H, w: 0.92 * W, maxH: 0.3 * H, align: 'center' },
    tagline: { text: state.tagline, x: W / 2, y: 0.58 * H },
    names: [],
    marks: { left: 'N° 03', right: state.dateLine, y: 0.982 * H },
    palms: [
      { x: 0.03 * W, baseY: 0.68 * H, h: 0.34 * H, lean: -0.015 * W },
      { x: 0.97 * W, baseY: 0.68 * H, h: 0.3 * H, lean: 0.015 * W },
    ],
    birds: [
      { x: 0.3 * W, y: 0.42 * H, s: 0.02 * W },
      { x: 0.42 * W, y: 0.38 * H, s: 0.016 * W },
      { x: 0.68 * W, y: 0.44 * H, s: 0.018 * W },
    ],
  };
}

export const LAYOUTS = { duo: duoPlan, split: splitPlan, car: carPlan };

export function planFor(layout, W, H, state) {
  const build = LAYOUTS[layout] || LAYOUTS.duo;
  return build(W, H, state);
}
