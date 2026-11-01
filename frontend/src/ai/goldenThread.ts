/**
 * My Inner — Golden Thread renderer.
 *
 * A framework-free canvas renderer for the ambient AI presence.
 * The thread is drawn with a sin² envelope so it fades out at both ends
 * and never looks like a "widget". All motion is driven by:
 *   - `state`  (idle | listening | thinking | speaking | muted | unavailable)
 *   - `level`  (0..1 live audio amplitude: mic while listening, AI output while speaking)
 *
 * Rule from the brief: the thread only moves "like speech" when there is real
 * audio. Speaking amplitude comes exclusively from `level`, never from a loop.
 */

export type EntityState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'muted'
  | 'unavailable';

export interface ThreadPalette {
  gold: string; // matches the gold line-work already in the hero
  plum: string; // brand purple #765c8d
  lilac: string;
  core: string;
}

export const DEFAULT_PALETTE: ThreadPalette = {
  gold: '201,173,120',
  plum: '118,92,141',
  lilac: '156,130,181',
  core: '255,255,255',
};

interface StrandSpec {
  color: keyof ThreadPalette;
  amp: number; // relative amplitude
  freq: number; // spatial frequency
  speed: number; // phase speed
  phase: number;
  alpha: number;
  width: number;
}

const STRANDS: StrandSpec[] = [
  { color: 'gold', amp: 1.0, freq: 1 / 22, speed: 1.6, phase: 0, alpha: 0.9, width: 1.6 },
  { color: 'lilac', amp: 0.7, freq: 1 / 17, speed: -1.2, phase: 1.3, alpha: 0.55, width: 1.4 },
  { color: 'gold', amp: 0.4, freq: 1 / 29, speed: 2.1, phase: 2.6, alpha: 0.4, width: 1.2 },
];

/** Per-state targets the renderer eases toward (no hard jumps between states). */
const STATE_TARGETS: Record<EntityState, { base: number; react: number; alpha: number; core: number }> = {
  idle: { base: 0.05, react: 0, alpha: 0.55, core: 0.55 },
  listening: { base: 0.06, react: 0.55, alpha: 0.85, core: 0.9 },
  thinking: { base: 0.08, react: 0, alpha: 0.75, core: 0.75 },
  speaking: { base: 0.02, react: 1.0, alpha: 1, core: 1 },
  muted: { base: 0, react: 0, alpha: 0.35, core: 0.25 },
  unavailable: { base: 0, react: 0, alpha: 0.2, core: 0 },
};

export interface GoldenThreadOptions {
  palette?: ThreadPalette;
  /** Max vertical swing in CSS px when level = 1. */
  maxAmplitude?: number;
  reducedMotion?: boolean;
}

export class GoldenThread {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private t = 0;
  private last = 0;
  private state: EntityState = 'idle';
  private level = 0; // raw
  private smooth = 0; // smoothed level
  private cur = { ...STATE_TARGETS.idle };
  private palette: ThreadPalette;
  private maxAmp: number;
  private reduced: boolean;
  private ro?: ResizeObserver;
  private w = 0;
  private h = 0;

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, opts: GoldenThreadOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D not supported');
    this.ctx = ctx;
    this.palette = opts.palette ?? DEFAULT_PALETTE;
    this.maxAmp = opts.maxAmplitude ?? 30;
    this.reduced =
      opts.reducedMotion ??
      (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.resize();
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(canvas);
    }
  }

  setState(s: EntityState) {
    this.state = s;
    if (this.reduced) this.drawOnce();
  }

  /** 0..1 audio amplitude. Call every frame from an AnalyserNode. */
  setLevel(v: number) {
    this.level = Math.max(0, Math.min(1, v));
  }

  start() {
    if (this.reduced) {
      this.drawOnce();
      return;
    }
    const loop = (now: number) => {
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
      this.last = now;
      this.step(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', this.onVis);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.last = 0;
    document.removeEventListener('visibilitychange', this.onVis);
  }

  destroy() {
    this.stop();
    this.ro?.disconnect();
  }

  // Pause rendering while the tab is hidden (performance requirement).
  private onVis = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    } else if (!this.raf) {
      this.last = 0;
      this.start();
    }
  };

  private resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = this.canvas.getBoundingClientRect();
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.reduced) this.drawOnce();
  }

  private step(dt: number) {
    this.t += dt;
    // Fast attack, slow release => speech-like, settles naturally in pauses.
    const k = this.level > this.smooth ? 18 : 5;
    this.smooth += (this.level - this.smooth) * Math.min(1, k * dt);
    const tgt = STATE_TARGETS[this.state];
    const e = Math.min(1, 4 * dt);
    this.cur.base += (tgt.base - this.cur.base) * e;
    this.cur.react += (tgt.react - this.cur.react) * e;
    this.cur.alpha += (tgt.alpha - this.cur.alpha) * e;
    this.cur.core += (tgt.core - this.cur.core) * e;
  }

  private drawOnce() {
    this.cur = { ...STATE_TARGETS[this.state] };
    this.smooth = 0;
    this.draw();
  }

  private draw() {
    const { ctx, w, h, palette: p } = this;
    ctx.clearRect(0, 0, w, h);
    if (w === 0 || h === 0) return;
    const mid = h / 2;
    const cx = w / 2;
    const idleBreath = this.reduced ? 0 : 0.5 + 0.5 * Math.sin(this.t * 0.9); // ~7s breath
    const amp = this.maxAmp * (this.cur.base * (0.6 + 0.4 * idleBreath) + this.cur.react * this.smooth);
    const muted = this.state === 'muted' || this.state === 'unavailable';

    STRANDS.forEach((s, i) => {
      // Listening emphasises the lilac strand; speaking emphasises gold.
      let a = s.alpha * this.cur.alpha;
      if (this.state === 'listening' && s.color === 'gold') a *= 0.6;
      if (this.state === 'listening' && s.color === 'lilac') a = Math.min(1, a * 1.5);
      if (muted && i > 0) return; // muted = a single, flat, quiet thread

      ctx.beginPath();
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      // Horizontal alpha gradient so the thread dissolves into the page at both ends.
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, `rgba(${p[s.color]},0)`);
      grad.addColorStop(0.25, `rgba(${p[s.color]},${a})`);
      grad.addColorStop(0.75, `rgba(${p[s.color]},${a})`);
      grad.addColorStop(1, `rgba(${p[s.color]},0)`);
      ctx.strokeStyle = grad;
      if (muted) ctx.setLineDash([2, 6]);
      else ctx.setLineDash([]);
      for (let x = 0; x <= w; x += 3) {
        const u = x / w;
        const env = Math.sin(Math.PI * u) ** 2; // taper both ends
        const y = muted
          ? mid
          : mid + Math.sin(x * s.freq + this.t * s.speed + s.phase) * amp * s.amp * env;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Thinking: a soft bead of light travels slowly along the thread.
    if (this.state === 'thinking' && !this.reduced) {
      const u = (Math.sin(this.t * 0.8) + 1) / 2;
      const x = w * (0.2 + 0.6 * u);
      this.glow(x, mid, 10, `rgba(${p.gold},0.45)`);
      this.dot(x, mid, 2.5, `rgba(${p.core},0.95)`);
    }

    // Core point of light — the "presence". Brighter while active.
    const coreR = 3 + (this.state === 'speaking' ? 2.5 * this.smooth : 0);
    const coreGlow = 10 + (this.state === 'listening' ? 6 : 0) + 10 * this.smooth * this.cur.react;
    this.glow(cx, mid, coreGlow, `rgba(${this.state === 'listening' ? p.plum : p.gold},${0.22 * this.cur.core})`);
    this.dot(cx, mid, coreR, `rgba(${p.core},${this.cur.core})`);

    // Listening: a thin focus ring (shape cue, so state isn't colour-only).
    if (this.state === 'listening') {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${p.plum},${0.35 + 0.4 * this.smooth})`;
      ctx.lineWidth = 1.2;
      ctx.arc(cx, mid, 11 + 4 * this.smooth, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Muted: a small diagonal slash through the core (shape cue).
    if (this.state === 'muted') {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${p.plum},0.55)`;
      ctx.lineWidth = 1.4;
      ctx.moveTo(cx - 7, mid + 7);
      ctx.lineTo(cx + 7, mid - 7);
      ctx.stroke();
    }
  }

  private dot(x: number, y: number, r: number, c: string) {
    this.ctx.beginPath();
    this.ctx.fillStyle = c;
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private glow(x: number, y: number, r: number, c: string) {
    const g = this.ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.fillStyle = g;
    this.ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

/** Helper: RMS level (0..1) from an AnalyserNode, tuned for speech. */
export function readLevel(analyser: AnalyserNode, buf: Uint8Array): number {
  analyser.getByteTimeDomainData(buf as any);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = (buf[i] - 128) / 128;
    sum += v * v;
  }
  const rms = Math.sqrt(sum / buf.length);
  return Math.min(1, rms * 4); // speech RMS ~0.05–0.25 → 0.2–1
}
