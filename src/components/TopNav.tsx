import { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Landmark, RotateCcw, Scale } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { PRESETS } from '../data/presets';
import type { WorkflowStage } from '../types/strategy';
import { Badge } from './ui';

const STAGES: { id: WorkflowStage; label: string; short: string }[] = [
  { id: 1, label: 'אבחון', short: 'אבחון' },
  { id: 2, label: 'מפת הזדמנויות', short: 'הזדמנויות' },
  { id: 3, label: 'סימולטור ROI', short: 'ROI' },
  { id: 4, label: 'מדדים ותוכנית', short: 'תוכנית' },
];

const ICONS = { university: Building2, government: Landmark, law: Scale };

export function TopNav() {
  const { stage, setStage, analysis, loadPreset, resetAll } = useAppStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasAnalysis = !!analysis;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button onClick={() => setStage(1)} className="flex items-center gap-2.5" title="לדף הפתיחה">
          <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-xl bg-ink">
            <span className="animate-spin-slow absolute -inset-2 bg-[conic-gradient(from_0deg,#ff7a59,#f4c542,#8fcf7a,#9fd0ff,#b7a4f0,#2b3cff,#ff7a59)] opacity-90" />
            <span className="relative h-3.5 w-3.5 rounded-full bg-ink ring-2 ring-paper/90" />
          </span>
          <span className="leading-none">
            <span className="display block text-[17px] font-black tracking-tight text-ink">ROI Simulator</span>
            <span className="block text-[10px] font-semibold tracking-[0.16em] text-mute">אסטרטגיית AI</span>
          </span>
        </button>

        <nav aria-label="שלבים" className="mx-auto hidden items-center md:flex">
          {STAGES.map((s, idx) => {
            const disabled = s.id > 1 && !hasAnalysis;
            const active = stage === s.id;
            const done = hasAnalysis && s.id < stage;
            return (
              <div key={s.id} className="flex items-center">
                {idx > 0 && <span className={`mx-1 h-px w-6 lg:w-10 ${done || active ? 'bg-ink' : 'bg-line'}`} />}
                <button
                  disabled={disabled}
                  onClick={() => setStage(s.id)}
                  aria-current={active ? 'step' : undefined}
                  className={`group flex items-center gap-2 rounded-full py-1.5 pe-3.5 ps-1.5 text-[13px] font-semibold transition-all ${active ? 'bg-ink text-paper shadow-[0_6px_18px_-8px_rgba(20,22,26,0.7)]' : disabled ? 'cursor-not-allowed text-mute/60' : 'text-ink-2 hover:bg-paper-2'}`}
                >
                  <span className={`num grid h-6 w-6 place-items-center rounded-full text-[11px] ${active ? 'bg-paper text-ink' : done ? 'bg-signal text-white' : 'border border-line bg-white text-ink-2'}`}>
                    {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </span>
                  <span className="hidden lg:inline">{s.label}</span>
                  <span className="lg:hidden">{s.short}</span>
                </button>
              </div>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {analysis && (
            <Badge tone={analysis.origin === 'llm' ? 'emerald' : analysis.origin === 'fallback' ? 'amber' : 'blue'} className="hidden sm:inline-flex">
              {analysis.origin === 'llm' ? 'ניתוח AI' : analysis.origin === 'fallback' ? 'תרחיש חלופי' : 'תרחיש לדוגמה'}
            </Badge>
          )}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink transition hover:border-ink">
              תרחישים <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="animate-rise absolute end-0 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-paper p-1.5 shadow-[0_24px_48px_-20px_rgba(20,22,26,0.4)]">
                {PRESETS.map((p) => {
                  const Icon = ICONS[p.icon];
                  return (
                    <button key={p.id} onClick={() => { loadPreset(p.id); setOpen(false); }} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-start transition hover:bg-white">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink text-paper"><Icon className="h-4 w-4" /></span>
                      <span>
                        <span className="block text-sm font-bold leading-snug">{p.title}</span>
                        <span className="block text-xs text-mute">{p.subtitle}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button onClick={() => { if (confirm('לאפס את כל הנתונים ולהתחיל מחדש?')) resetAll(); }} title="התחל מחדש" aria-label="התחל מחדש" className="rounded-full p-2 text-mute transition hover:bg-paper-2 hover:text-ink">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <nav aria-label="שלבים" className="flex items-center justify-center gap-1 border-t border-line/60 px-4 py-2 md:hidden">
        {STAGES.map((s) => {
          const disabled = s.id > 1 && !hasAnalysis;
          const active = stage === s.id;
          return <button key={s.id} disabled={disabled} onClick={() => setStage(s.id)} className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? 'bg-ink text-paper' : disabled ? 'text-mute/50' : 'text-ink-2'}`}>{s.id}. {s.short}</button>;
        })}
      </nav>
    </header>
  );
}
