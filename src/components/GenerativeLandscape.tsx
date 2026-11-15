import { useEffect, useRef } from 'react';

/**
 * A procedural, pointillist landscape: layered hills made of thousands of
 * drifting dots, with an adoption S-curve that draws itself across the sky.
 * No image assets, resolution independent, pauses when off-screen, and
 * renders a single still frame when the user prefers reduced motion.
 */

type Band = { color: [number, number, number]; base: number; amp: number; freq: number; speed: number; phase: number };

const BANDS: Band[] = [
  { color: [159, 208, 255], base: 0.50, amp: 0.045, freq: 1.1, speed: 0.10, phase: 0.0 }, // sky-blue ridge
  { color: [255, 122, 89],  base: 0.58, amp: 0.055, freq: 1.4, speed: 0.13, phase: 1.3 }, // coral
  { color: [244, 197, 66],  base: 0.67, amp: 0.060, freq: 0.9, speed: 0.09, phase: 2.1 }, // mustard
  { color: [143, 207, 122], base: 0.76, amp: 0.050, freq: 1.7, speed: 0.07, phase: 0.7 }, // sage
  { color: [183, 164, 240], base: 0.85, amp: 0.040, freq: 1.2, speed: 0.05, phase: 2.9 }, // lilac
  { color: [43, 60, 255],   base: 0.94, amp: 0.030, freq: 2.0, speed: 0.04, phase: 1.9 }, // signal
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function profile(b: Band, u: number, t: number) {
  return b.base
    + b.amp * Math.sin(u * Math.PI * 2 * b.freq + b.phase + t * b.speed)
    + b.amp * 0.5 * Math.sin(u * Math.PI * 2 * b.freq * 2.3 + b.phase * 1.7 - t * b.speed * 1.6);
}

const smoothstep = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };

interface Dot { u: number; d: number; band: number; size: number; jitter: number; mix: number; drift: number }

export function GenerativeLandscape({ className = '', density = 1, overlay = false }: { className?: string; density?: number; overlay?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rand = mulberry32(20261115);
    const N = Math.round(3600 * density);
    const dots: Dot[] = Array.from({ length: N }, () => {
      const band = Math.min(BANDS.length - 1, Math.floor(rand() * (BANDS.length - 1)));
      return { u: rand(), d: rand(), band, size: 1.4 + rand() * 1.8, jitter: rand() * Math.PI * 2, mix: rand(), drift: rand() };
    });
    const skyDots = Array.from({ length: Math.round(500 * density) }, () => ({ u: rand(), v: rand(), s: 0.8 + rand() * 1.2, a: 0.15 + rand() * 0.25, p: rand() * Math.PI * 2 }));

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let visible = true;
    let W = 0, H = 0, dpr = 1;
    const t0 = performance.now();

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const t = reduced ? 40 : (now - t0) / 1000;
      if (overlay) {
        ctx.clearRect(0, 0, W, H);
      } else {
      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#f6f3ec');
      sky.addColorStop(0.45, '#dcecfb');
      sky.addColorStop(1, '#c7def5');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // sky stipple
      for (const s of skyDots) {
        const a = s.a * (0.7 + 0.3 * Math.sin(t * 0.8 + s.p));
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        ctx.fillRect(s.u * W, s.v * H * 0.6, s.s, s.s);
      }

      // hills: solid soft base under the stipple so bands read at distance
      for (let i = 0; i < BANDS.length; i++) {
        const b = BANDS[i];
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 8) ctx.lineTo(x, profile(b, x / W, t) * H);
        ctx.lineTo(W, H);
        ctx.closePath();
        const [r, g, bl] = b.color;
        ctx.fillStyle = `rgba(${r},${g},${bl},0.42)`;
        ctx.fill();
      }

      // pointillist dots between consecutive ridges
      for (const d of dots) {
        const b0 = BANDS[d.band], b1 = BANDS[d.band + 1];
        const u = (d.u + t * 0.004 * (0.5 + d.drift)) % 1;
        const y0 = profile(b0, u, t) * H, y1 = profile(b1, u, t) * H;
        const y = y0 + d.d * (y1 - y0) + Math.sin(t * 1.5 + d.jitter) * 0.6;
        const x = u * W + Math.cos(t * 1.1 + d.jitter) * 0.6;
        const k = d.mix < 0.18 ? 1 : d.mix > 0.9 ? Math.max(0, d.band - 1) / Math.max(1, d.band) : 0;
        const c0 = b0.color, c1 = (d.mix < 0.18 ? b1 : d.mix > 0.9 ? BANDS[Math.max(0, d.band - 1)] : b0).color;
        const r = Math.round(c0[0] + (c1[0] - c0[0]) * k), g = Math.round(c0[1] + (c1[1] - c0[1]) * k), bl = Math.round(c0[2] + (c1[2] - c0[2]) * k);
        const light = 0.9 + d.d * 0.22;
        ctx.fillStyle = `rgba(${Math.min(255, r * light) | 0},${Math.min(255, g * light) | 0},${Math.min(255, bl * light) | 0},0.9)`;
        ctx.fillRect(x, y, d.size, d.size);
      }
      }

      // adoption S-curve drawing itself across the sky (LTR, like the charts); on phones the text fills the sky, so skip it
      if (W < 640) { if (!reduced && visible) raf = requestAnimationFrame(draw); return; }
      const prog = reduced ? 1 : smoothstep((t - 0.6) / 4.5);
      const x0 = W * 0.06, x1 = W * 0.62;
      const yBottom = H * 0.46, yTop = H * 0.12;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(20,22,26,0.18)';
      ctx.setLineDash([3, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, yBottom); ctx.lineTo(x1, yBottom); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#14161a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      const steps = 120;
      let tipX = x0, tipY = yBottom;
      for (let i = 0; i <= steps * prog; i++) {
        const f = i / steps;
        const x = x0 + (x1 - x0) * f;
        const y = yBottom - (yBottom - yTop) * smoothstep((f - 0.1) / 0.75);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        tipX = x; tipY = y;
      }
      ctx.stroke();
      // glowing tip
      const pulse = 0.6 + 0.4 * Math.sin(t * 3);
      ctx.fillStyle = `rgba(43,60,255,${(0.25 * pulse).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(tipX, tipY, 10 + 4 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b3cff';
      ctx.beginPath(); ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      if (!reduced && visible) raf = requestAnimationFrame(draw);
    };

    resize();
    const ro = new ResizeObserver(() => { resize(); if (reduced) draw(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      const was = visible; visible = e.isIntersecting;
      if (visible && !was && !reduced) raf = requestAnimationFrame(draw);
    });
    io.observe(canvas);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [density, overlay]);

  return <canvas ref={ref} aria-hidden className={`block h-full w-full ${className}`} />;
}
