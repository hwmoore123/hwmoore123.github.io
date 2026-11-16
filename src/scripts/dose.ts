// Shared intensity state. The inline head script sets the initial value.
export type Dose = 'sober' | 'contact' | 'trip';
const root = document.documentElement;

export const getDose = (): Dose => (root.dataset.dose as Dose) || 'contact';

export function setDose(d: Dose) {
  root.dataset.dose = d;
  root.setAttribute('data-dose-chosen', '');
  try { localStorage.setItem('dose', d); } catch {}
  window.dispatchEvent(new CustomEvent('dose', { detail: d }));
}

export function onDose(fn: (d: Dose) => void) {
  window.addEventListener('dose', (e) => fn((e as CustomEvent).detail));
}

/** Per-dose numbers every effect reads from. */
export const PARAMS: Record<Dose, { warp: number; speed: number; light: number; trail: boolean }> = {
  sober:   { warp: 0,  speed: 0,   light: 0,   trail: false },
  contact: { warp: 5,  speed: 1,   light: 1,   trail: false },
  trip:    { warp: 14, speed: 2.6, light: 2.2, trail: true },
};
