// Local OFL faces for the cover maker. Every file lives under app/fonts/;
// nothing is fetched from a CDN. Oswald ships as its variable font, so the
// SemiBold weight (600) is requested through the face's weight range.
const FACES = [
  { family: 'Anton', file: 'Anton-Regular.ttf', weight: '400' },
  { family: 'Oswald', file: 'Oswald-Variable.ttf', weight: '200 700' },
  { family: 'Bebas Neue', file: 'BebasNeue-Regular.ttf', weight: '400' },
  { family: 'Great Vibes', file: 'GreatVibes-Regular.ttf', weight: '400' },
];

const loaded = new Map();

export async function loadFonts() {
  for (const face of FACES) {
    if (loaded.has(face.family)) continue;
    const url = new URL(`../fonts/${face.file}`, import.meta.url).href;
    const fontFace = new FontFace(face.family, `url(${url})`, { weight: face.weight });
    await fontFace.load();
    document.fonts.add(fontFace);
    loaded.set(face.family, fontFace);
  }
}

export function fontsReady() {
  return (
    document.fonts.check('16px Anton') &&
    document.fonts.check('600 16px Oswald') &&
    document.fonts.check('16px "Bebas Neue"') &&
    document.fonts.check('16px "Great Vibes"')
  );
}
