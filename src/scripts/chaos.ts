// Contact page entrance: for ~10 seconds everything flies around at random,
// smearing a long rainbow trail behind it, then settles back into place.
// Skipped entirely when the OS asks for reduced motion (dose = sober).
import { getDose } from './dose';

const DURATION = 10000; // ms of chaos
const SETTLE = 1400; // ms to glide home at the end
const FADE = 1800; // ms for the trails to fade after

type Item = {
  el: HTMLElement;
  x: number; y: number; r: number; s: number;
  vx: number; vy: number; vr: number; vs: number;
  tx: number; ty: number; tr: number; ts: number;
  next: number; hue: number;
  pos: string; z: string;
};

export function runChaos(selector: string) {
  if (getDose() === 'sober') return;
  const els = [...document.querySelectorAll<HTMLElement>(selector)].filter((el) => el.getClientRects().length);
  if (!els.length) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '0' });
  // inside <main> (its own stacking layer) so the trail sits under the flying items
  const host = document.querySelector('main') ?? document.body;
  host.prepend(canvas);
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size();
  addEventListener('resize', size);

  const items: Item[] = els.map((el, i) => {
    const it = {
      el, x: 0, y: 0, r: 0, s: 1, vx: 0, vy: 0, vr: 0, vs: 0, tx: 0, ty: 0, tr: 0, ts: 1,
      next: 0, hue: (i * 47) % 360, pos: el.style.position, z: el.style.zIndex,
    };
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.zIndex = '2';
    el.style.willChange = 'translate, rotate, scale';
    return it;
  });

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const start = performance.now();
  let last = start;

  const frame = (now: number) => {
    const t = now - start;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    const settling = t > DURATION - SETTLE;
    const done = t > DURATION + FADE;

    // fade the old trail a little each frame -> long smeared tails
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0,0,0,${t > DURATION ? 0.12 : 0.045})`;
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.restore();

    const W = Math.min(innerWidth * 0.38, 460);
    const H = Math.min(innerHeight * 0.32, 320);

    for (const it of items) {
      if (t <= DURATION) {
        if (settling) { it.tx = 0; it.ty = 0; it.tr = 0; it.ts = 1; }
        else if (now > it.next) {
          it.tx = rand(-W, W); it.ty = rand(-H, H);
          it.tr = rand(-70, 70); it.ts = rand(0.6, 1.5);
          it.next = now + rand(110, 320);
        }
        // springy chase toward the target
        const k = settling ? 60 : 140, c = settling ? 14 : 9;
        it.vx += ((it.tx - it.x) * k - it.vx * c) * dt;
        it.vy += ((it.ty - it.y) * k - it.vy * c) * dt;
        it.vr += ((it.tr - it.r) * k - it.vr * c) * dt;
        it.vs += ((it.ts - it.s) * k - it.vs * c) * dt;
        it.x += it.vx * dt; it.y += it.vy * dt; it.r += it.vr * dt; it.s += it.vs * dt;
        it.el.style.translate = `${it.x.toFixed(1)}px ${it.y.toFixed(1)}px`;
        it.el.style.rotate = `${it.r.toFixed(1)}deg`;
        it.el.style.scale = it.s.toFixed(3);

        // stamp a ghost of the item onto the trail canvas
        const b = it.el.getBoundingClientRect();
        if (b.bottom > -50 && b.top < innerHeight + 50) {
          it.hue = (it.hue + 240 * dt) % 360;
          const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
          const w = Math.min(b.width, 520), h = Math.min(b.height, 420);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((it.r * Math.PI) / 180);
          ctx.fillStyle = `hsla(${it.hue}, 100%, 60%, .55)`;
          ctx.strokeStyle = `hsla(${(it.hue + 180) % 360}, 100%, 45%, .7)`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.3);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    if (t > DURATION && items[0].el.style.translate) {
      for (const it of items) {
        it.el.style.translate = it.el.style.rotate = it.el.style.scale = it.el.style.willChange = '';
        it.el.style.position = it.pos; it.el.style.zIndex = it.z;
      }
    }
    if (done) { removeEventListener('resize', size); canvas.remove(); return; }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
