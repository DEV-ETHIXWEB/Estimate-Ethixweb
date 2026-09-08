// Strict monochrome UI palette - grayscale only, no hue. The light theme is
// not a separately designed palette: it's the exact photographic negative of
// the dark one (R'=255-R, G'=255-G, B'=255-B, alpha untouched), computed here
// rather than hand-authored so the two stay mathematically exact inverses.
function invert(value) {
  const rgba = value.match(/rgba?\(([^)]+)\)/);
  if (rgba) {
    const parts = rgba[1].split(',').map(s => s.trim());
    const [r, g, b] = parts;
    const a = parts[3];
    const inv = [255 - Number(r), 255 - Number(g), 255 - Number(b)];
    return a !== undefined ? `rgba(${inv.join(',')},${a})` : `rgb(${inv.join(',')})`;
  }
  const hex = value.replace('#', '');
  const n = parseInt(hex, 16);
  const r = 255 - ((n >> 16) & 255), g = 255 - ((n >> 8) & 255), b = 255 - (n & 255);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Brand marks keep their real brand color in both themes - inverting a logo
// isn't a "dark mode", it's a different, wrong color.
export const BRAND = {
  google: '#4285F4', // Google Ads, per simple-icons
  meta: '#0467DF',   // Meta, per simple-icons
};

const DARK = {
  bg: '#0A0A0B',
  card: '#131315',
  ink: '#F5F5F4',
  inkSoft: 'rgba(245,245,244,0.56)',
  hairline: 'rgba(245,245,244,0.10)',
  track: 'rgba(245,245,244,0.10)',
  fill: '#F5F5F4',
  fillSoft: 'rgba(245,245,244,0.55)',
  fillFaint: 'rgba(245,245,244,0.28)',
  tooltipBg: '#131315',
};

const LIGHT = Object.fromEntries(Object.entries(DARK).map(([k, v]) => [k, invert(v)]));

const PALETTES = { dark: DARK, light: LIGHT };

export function getColors(mode) {
  return PALETTES[mode] || DARK;
}
