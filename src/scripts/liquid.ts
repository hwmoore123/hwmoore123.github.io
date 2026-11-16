import { getDose, onDose, PARAMS } from './dose';

const canvas = document.getElementById('liquid') as HTMLCanvasElement | null;

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
// Domain-warped fbm noise, quantised into soft oily bands of the poster palette.
const FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform float uWarp; uniform vec2 uMouse;
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<5;i++){ v += a*noise(p); p = p*2.03 + 17.1; a *= 0.5; } return v; }
vec3 palette(float t){
  vec3 violet = vec3(0.482,0.173,1.0), magenta = vec3(1.0,0.18,0.592), orange = vec3(1.0,0.541,0.118);
  vec3 lime = vec3(0.714,1.0,0.231), teal = vec3(0.0,0.761,0.722);
  t = fract(t);
  float s = 0.12; // soft edge between blobs
  vec3 c = violet;
  c = mix(c, magenta, smoothstep(0.20-s, 0.20+s, t));
  c = mix(c, orange,  smoothstep(0.42-s, 0.42+s, t));
  c = mix(c, lime,    smoothstep(0.60-s*.4, 0.60+s*.4, t));
  c = mix(c, teal,    smoothstep(0.67-s*.4, 0.67+s*.4, t));
  c = mix(c, violet,  smoothstep(0.80-s, 0.80+s, t));
  return c;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes.y;
  vec2 p = uv * 1.6;
  float t = uTime * 0.1;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t*0.8));
  vec2 r = vec2(fbm(p + uWarp*q + vec2(1.7, 9.2) + 0.15*t + uMouse*0.6),
                fbm(p + uWarp*q + vec2(8.3, 2.8) - 0.12*t));
  float f = fbm(p + uWarp*r);
  vec3 col = palette(f*1.35 + 0.25*length(q) + t*0.35);
  // oil-lamp shading: darker in the folds, glow where it thins
  col *= 0.72 + 0.5*smoothstep(0.2, 0.9, f);
  col += 0.08*vec3(1.0,0.9,0.7)*pow(length(r), 3.0);
  gl_FragColor = vec4(col, 1.0);
}`;

function init() {
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) return; // static gradient stays

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  } catch { return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uWarp = gl.getUniformLocation(prog, 'uWarp');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');

  const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  let scale = mobile ? 0.5 : 0.75; // render below native res; it's blurry oil anyway
  let failed = false;

  function resize() {
    const w = Math.max(1, Math.floor(canvas!.clientWidth * scale));
    const h = Math.max(1, Math.floor(canvas!.clientHeight * scale));
    if (canvas!.width !== w || canvas!.height !== h) { canvas!.width = w; canvas!.height = h; }
    gl!.viewport(0, 0, w, h);
    gl!.uniform2f(uRes, w, h);
  }

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / innerWidth - 0.5);
    mouse.ty = -(e.clientY / innerHeight - 0.5);
  }, { passive: true });

  let raf = 0, last = 0, clock = 20, frames = 0, acc = 0;
  function frame(now: number) {
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0.016;
    last = now;
    const p = PARAMS[getDose()];
    clock += dt * p.speed;
    mouse.x += (mouse.tx - mouse.x) * 0.02; // slow, syrupy follow
    mouse.y += (mouse.ty - mouse.y) * 0.02;
    resize();
    gl!.uniform1f(uTime, clock);
    gl!.uniform1f(uWarp, 2.4 + p.light * 1.2);
    gl!.uniform2f(uMouse, mouse.x, mouse.y);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    // performance guard: <30fps → half res → static gradient
    frames++; acc += dt;
    if (frames === 90) {
      const fps = frames / acc; frames = 0; acc = 0;
      if (fps < 30) {
        if (scale > 0.4) { scale = 0.35; }
        else { failed = true; stop(); canvas!.classList.remove('on'); return; }
      }
    }
    raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; last = 0; }
  function sync() {
    stop();
    const sober = getDose() === 'sober';
    if (failed || sober || document.hidden) { if (sober || failed) canvas!.classList.remove('on'); return; }
    canvas!.classList.add('on');
    raf = requestAnimationFrame(frame);
  }
  // Only run while the hero is on screen
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? sync() : stop(); }).observe(canvas);
  onDose(sync);
  document.addEventListener('visibilitychange', () => (visible ? sync() : stop()));
  sync();
}
init();
