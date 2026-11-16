// Paints one spiral tie-dye "shirt" into a canvas once, then hands it to CSS as a background.
// Cheap: ~512² pixels, computed once per page load. The slow spin is a CSS animation.
const COLORS: [number, number, number][] = [
  [255, 46, 151],  // magenta
  [255, 138, 30],  // orange
  [253, 184, 39],  // yellow
  [182, 255, 59],  // lime
  [0, 194, 184],   // teal
  [0, 157, 220],   // blue
  [123, 44, 255],  // violet
];

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function fbm(x: number, y: number) {
  let v = 0, a = 0.5;
  for (let i = 0; i < 4; i++) { v += a * noise(x, y); x = x * 2.1 + 9.2; y = y * 2.1 + 3.7; a *= 0.5; }
  return v;
}

export function paintTieDye(size = 512, seed = Math.random() * 100): string {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(size, size);
  const arms = 3 + Math.floor(seed % 3);           // 3–5 spiral arms
  const twist = 1.6 + (seed % 1) * 1.2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size - 0.5, ny = y / size - 0.5;
      // wobble the coordinates like folded, bunched fabric
      const wx = nx + 0.06 * (fbm(nx * 5 + seed, ny * 5) - 0.5);
      const wy = ny + 0.06 * (fbm(nx * 5, ny * 5 + seed) - 0.5);
      const r = Math.hypot(wx, wy) + 0.002, ang = Math.atan2(wy, wx);
      let s = (ang / (Math.PI * 2)) * arms + Math.log(r) * twist + 0.5 * fbm(nx * 9 + seed, ny * 9);
      s = ((s % 1) + 1) % 1 * COLORS.length;
      const i = Math.floor(s), f = s - i;
      // mostly solid dye with a soft bleed into the next color
      const m = Math.min(1, Math.max(0, (f - 0.7) / 0.3));
      const c0 = COLORS[i % COLORS.length], c1 = COLORS[(i + 1) % COLORS.length];
      let R = c0[0] + (c1[0] - c0[0]) * m, G = c0[1] + (c1[1] - c0[1]) * m, B = c0[2] + (c1[2] - c0[2]) * m;
      // darker where dye pooled at the band edge
      const edge = Math.max(0, 1 - Math.abs(f - 0.72) * 9) * 0.25;
      R *= 1 - edge; G *= 1 - edge; B *= 1 - edge;
      // crinkle: pale streaks where the fabric was folded and the dye didn't reach
      const cr = fbm(ang * 6 + seed, r * 40);
      const w = Math.max(0, (cr - 0.58) / 0.2) * 0.55;
      R += (250 - R) * w; G += (244 - G) * w; B += (230 - B) * w;
      const k = (y * size + x) * 4;
      img.data[k] = R; img.data[k + 1] = G; img.data[k + 2] = B; img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv.toDataURL('image/jpeg', 0.85);
}

const layer = document.getElementById('tiedye');
if (layer) {
  const paint = () => {
    const url = paintTieDye();
    if (url) { layer.style.backgroundImage = `url(${url})`; layer.classList.add('painted'); }
  };
  ('requestIdleCallback' in window ? (window as any).requestIdleCallback : setTimeout)(paint);
}
