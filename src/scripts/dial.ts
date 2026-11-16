import { getDose, setDose, onDose, PARAMS, type Dose } from './dose';

const ORDER: Dose[] = ['sober', 'contact', 'trip'];
const ROT: Record<Dose, string> = { sober: '-120deg', contact: '0deg', trip: '120deg' };

/* ---------------- knob ---------------- */
const knob = document.getElementById('knob') as HTMLButtonElement | null;
const radios = Array.from(document.querySelectorAll<HTMLInputElement>('#dial input[name="dose"]'));

function syncKnob(d: Dose) {
  radios.forEach((r) => (r.checked = r.value === d));
  if (knob) {
    knob.style.setProperty('--rot', ROT[d]);
    knob.setAttribute('aria-label', `Intensity: ${d === 'contact' ? 'Contact high' : d === 'trip' ? 'Full trip' : 'Sober'}. Press to turn the knob.`);
  }
}
radios.forEach((r) => r.addEventListener('change', () => r.checked && setDose(r.value as Dose)));
knob?.addEventListener('click', () => setDose(ORDER[(ORDER.indexOf(getDose()) + 1) % 3]));
syncKnob(getDose());
onDose(syncKnob);

/* ---------------- first-visit notice ---------------- */
const notice = document.getElementById('notice');
let seen = false;
try { seen = !!localStorage.getItem('seenNotice'); } catch {}
if (notice && !seen) {
  notice.hidden = false;
  const close = () => { notice.hidden = true; try { localStorage.setItem('seenNotice', '1'); } catch {} };
  document.getElementById('notice-ok')?.addEventListener('click', close);
  onDose(close);
  setTimeout(close, 12000);
}

/* ---------------- breathing type (SVG warp) ---------------- */
const turb = document.getElementById('warp-turb');
const disp = document.getElementById('warp-disp');
let warpRaf = 0;
function warpLoop(t: number) {
  const p = PARAMS[getDose()];
  const s = t / 1000 * (p.speed || 1);
  const bx = 0.010 + 0.004 * Math.sin(s * 0.35);
  const by = 0.018 + 0.006 * Math.cos(s * 0.27);
  turb?.setAttribute('baseFrequency', `${bx.toFixed(4)} ${by.toFixed(4)}`);
  disp?.setAttribute('scale', (p.warp * (0.8 + 0.2 * Math.sin(s * 0.5))).toFixed(2));
  warpRaf = requestAnimationFrame(warpLoop);
}
function startWarp() {
  cancelAnimationFrame(warpRaf);
  if (getDose() === 'sober' || document.hidden) { disp?.setAttribute('scale', '0'); return; }
  warpRaf = requestAnimationFrame(warpLoop);
}

/* ---------------- cursor trail (Full trip, fine pointers only) ---------------- */
const canvas = document.getElementById('trail') as HTMLCanvasElement | null;
const ctx = canvas?.getContext('2d') ?? null;
const STRIPES = ['#61BB46', '#FDB827', '#F5821F', '#E03A3E', '#963D97', '#009DDC'];
const pts: { x: number; y: number }[] = [];
let trailRaf = 0;
const finePointer = matchMedia('(pointer: fine)').matches;

function sizeCanvas() {
  if (!canvas) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function onMove(e: PointerEvent) { pts.push({ x: e.clientX, y: e.clientY }); if (pts.length > 20) pts.shift(); }
function drawTrail() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  if (pts.length > 1) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    STRIPES.forEach((c, k) => {
      const off = (k - 2.5) * 3;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len * off, ny = dx / len * off;
        ctx.globalAlpha = (i / pts.length) * 0.85;
        ctx.strokeStyle = c; ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.moveTo(a.x + nx, a.y + ny); ctx.lineTo(b.x + nx, b.y + ny); ctx.stroke();
      }
    });
    pts.shift(); // fade even when the pointer rests
  }
  trailRaf = requestAnimationFrame(drawTrail);
}
function startTrail() {
  cancelAnimationFrame(trailRaf);
  window.removeEventListener('pointermove', onMove);
  pts.length = 0;
  ctx?.clearRect(0, 0, innerWidth, innerHeight);
  if (!finePointer || !PARAMS[getDose()].trail || document.hidden) return;
  sizeCanvas();
  window.addEventListener('pointermove', onMove, { passive: true });
  trailRaf = requestAnimationFrame(drawTrail);
}
addEventListener('resize', sizeCanvas);

/* ---------------- lifecycle ---------------- */
function startAll() { startWarp(); startTrail(); }
onDose(startAll);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(warpRaf); cancelAnimationFrame(trailRaf); }
  else startAll();
});
startAll();
