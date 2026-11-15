import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { ParamSource } from '../types/strategy';

/* ---------- motion helpers ---------- */

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Animates a number toward `target` (ease-out). Returns the current displayed value. */
export function useCountUp(target: number, duration = 700) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (reduced || !Number.isFinite(target)) { setValue(target); from.current = target; return; }
    const start = performance.now();
    const begin = from.current;
    cancelAnimationFrame(raf.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      const v = begin + (target - begin) * e;
      setValue(v);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, reduced]);
  return value;
}

/* ---------- layout primitives ---------- */

export function Card({ children, className = '', style, id, tone = 'paper' }: { children: ReactNode; className?: string; style?: CSSProperties; id?: string; tone?: 'paper' | 'ink' | 'flat' }) {
  const tones = {
    paper: 'border border-line bg-white/80 shadow-[0_1px_0_rgba(20,22,26,0.04),0_12px_32px_-20px_rgba(20,22,26,0.25)]',
    ink: 'border border-ink bg-ink text-paper',
    flat: 'border border-line bg-paper-2/60',
  }[tone];
  return <section id={id} style={style} className={`rounded-[var(--radius-card)] p-5 md:p-6 ${tones} ${className}`}>{children}</section>;
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute ${className}`}><span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />{children}</div>;
}

export function StageHeader({ eyebrow, title, sub, actions }: { eyebrow: string; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-3xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-2 text-3xl font-black leading-[1.1] text-ink md:text-[2.6rem]">{title}</h2>
        {sub && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-xl font-bold text-ink">{title}</h3>
        {sub && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-mute">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- badges ---------- */

const TONES = {
  slate: 'bg-paper-2 text-ink-2 border-line',
  blue: 'bg-signal-soft text-signal-2 border-signal/20',
  emerald: 'bg-up-soft text-up border-up/20',
  rose: 'bg-down-soft text-down border-down/20',
  amber: 'bg-warn-soft text-warn border-warn/25',
  violet: 'bg-lilac/25 text-[#5b43b8] border-lilac/60',
  ink: 'bg-ink text-paper border-ink',
} as const;
export type Tone = keyof typeof TONES;

export function Badge({ children, tone = 'slate', className = '', title }: { children: ReactNode; tone?: Tone; className?: string; title?: string }) {
  return <span title={title} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5 ${TONES[tone]} ${className}`}>{children}</span>;
}

const SOURCE_META: Record<ParamSource, { label: string; tone: Tone; title: string }> = {
  user: { label: 'מהקלט שלך', tone: 'blue', title: 'ערך שהזנת או שינית בעצמך' },
  default: { label: 'ברירת מחדל', tone: 'slate', title: 'ברירת מחדל של המודל, לא מבוססת על הארגון שלך' },
  market: { label: 'הערכת שוק', tone: 'amber', title: 'הערכה שהניתוח הציע לפי המגזר וגודל הארגון' },
};

export function SourceTag({ source }: { source: ParamSource }) {
  const m = SOURCE_META[source];
  return <Badge tone={m.tone} className="cursor-help" title={m.title}>{m.label}</Badge>;
}

/* ---------- controls ---------- */

export function Button({ children, onClick, variant = 'primary', disabled, className = '', type = 'button', title, size = 'md' }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'signal'; disabled?: boolean; className?: string; type?: 'button' | 'submit'; title?: string; size?: 'sm' | 'md' | 'lg';
}) {
  const base = 'group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }[size];
  const styles = {
    primary: 'bg-ink text-paper hover:bg-ink-2 hover:shadow-[0_8px_24px_-10px_rgba(20,22,26,0.6)]',
    signal: 'bg-signal text-white hover:bg-signal-2 hover:shadow-[0_8px_24px_-8px_rgba(43,60,255,0.6)]',
    secondary: 'border border-line bg-white text-ink hover:border-ink hover:bg-paper',
    ghost: 'text-ink-2 hover:bg-paper-2',
    danger: 'border border-down/30 bg-down-soft text-down hover:bg-down/15',
  }[variant];
  return <button type={type} onClick={onClick} disabled={disabled} title={title} className={`${base} ${sizes} ${styles} ${className}`}>{children}</button>;
}

export function Segmented<T extends string>({ value, onChange, options, size = 'sm' }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; size?: 'sm' | 'md' }) {
  return (
    <div className={`inline-flex gap-0.5 rounded-full border border-line bg-paper-2/70 p-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)} className={`rounded-full px-3 py-1 font-semibold transition-all ${value === o.value ? 'bg-ink text-paper shadow-sm' : 'text-ink-2 hover:bg-white/70'}`}>{o.label}</button>
      ))}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

export const inputCls = 'w-full rounded-2xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 transition focus:border-ink focus:outline-none focus:ring-4 focus:ring-signal/10';

export function Slider({ label, hint, value, min, max, step, fmt, source, onChange }: {
  label: string; hint?: string; value: number; min: number; max: number; step: number; fmt: (v: number) => string; source?: ParamSource; onChange: (v: number) => void;
}) {
  const fill = `${((value - min) / (max - min)) * 100}%`;
  return (
    <div className="group/slider">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-ink">{label}</span>
        <span className="flex items-center gap-2">
          {source && <SourceTag source={source} />}
          <b className="num rounded-md bg-paper-2 px-1.5 py-0.5 text-[13px] text-ink transition-colors group-hover/slider:bg-signal-soft group-hover/slider:text-signal-2">{fmt(value)}</b>
        </span>
      </div>
      <input type="range" aria-label={label} min={min} max={max} step={step} value={value} style={{ '--fill': fill } as CSSProperties} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <div className="-mt-1 text-xs text-mute">{hint}</div>}
    </div>
  );
}

/* ---------- data display ---------- */

function Sparkline({ data, tone }: { data: number[]; tone: string }) {
  if (data.length < 2) return null;
  const w = 120, h = 32;
  const min = Math.min(...data, 0), max = Math.max(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / range) * h] as const);
  const zero = h - ((0 - min) / range) * h;
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-[120px]" aria-hidden>
      <line x1={0} x2={w} y1={zero} y2={zero} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="2 3" />
      <path d={`${d} L${w},${zero} L0,${zero} Z`} fill={tone} fillOpacity={0.12} />
      <path d={d} fill="none" stroke={tone} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

const STAT_TONE = {
  slate: { text: 'text-ink', bar: 'bg-ink', hex: '#14161a' },
  emerald: { text: 'text-up', bar: 'bg-up', hex: '#0f9d6e' },
  rose: { text: 'text-down', bar: 'bg-down', hex: '#e0395f' },
  blue: { text: 'text-signal-2', bar: 'bg-signal', hex: '#2b3cff' },
} as const;

export function Stat({ label, value, format, sub, tone = 'slate', spark, style }: {
  label: string; value: number | string; format?: (n: number) => string; sub?: string; tone?: keyof typeof STAT_TONE; spark?: number[]; style?: CSSProperties;
}) {
  const numeric = typeof value === 'number' ? value : NaN;
  const shown = useCountUp(Number.isFinite(numeric) ? numeric : 0);
  const t = STAT_TONE[tone];
  const text = typeof value === 'number' ? (format ? format(shown) : Math.round(shown).toLocaleString('he-IL')) : value;
  return (
    <div style={style} className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-white/80 p-4 pt-5 transition-shadow hover:shadow-[0_12px_32px_-20px_rgba(20,22,26,0.35)]">
      <span className={`absolute inset-x-5 top-0 h-[3px] rounded-b-full ${t.bar}`} />
      <div className="text-xs font-medium text-mute">{label}</div>
      {typeof value === 'number'
        ? <div className={`num mt-1.5 text-[26px] font-semibold leading-none ${t.text}`} dir="ltr">{text}</div>
        : <div className={`display mt-1.5 text-[26px] font-bold leading-none ${t.text}`}>{text}</div>}
      {spark && <div className={`mt-2 ${t.text}`}><Sparkline data={spark} tone={t.hex} /></div>}
      {sub && <div className="mt-2 text-[11px] leading-snug text-mute">{sub}</div>}
    </div>
  );
}

export function Note({ children, tone = 'blue', icon }: { children: ReactNode; tone?: 'blue' | 'amber' | 'rose' | 'ink'; icon?: ReactNode }) {
  const t = {
    blue: 'border-signal/20 bg-signal-soft/70 text-signal-2',
    amber: 'border-warn/30 bg-warn-soft text-[#7a4a02]',
    rose: 'border-down/30 bg-down-soft text-[#8b1a35]',
    ink: 'border-ink bg-ink text-paper',
  }[tone];
  return (
    <div className={`flex items-start gap-2.5 rounded-2xl border p-3.5 text-sm leading-relaxed ${t}`}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={title} className="animate-rise max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[var(--radius-card)] bg-paper shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-full px-2.5 py-1 text-mute transition hover:bg-paper-2 hover:text-ink" aria-label="סגור">✕</button>
        </div>
        <div className="scroll-thin max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
