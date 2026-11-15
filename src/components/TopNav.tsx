import { useState } from 'react';
import { Building2, ChevronDown, Landmark, RotateCcw, Scale, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { PRESETS } from '../data/presets';
import type { WorkflowStage } from '../types/strategy';
import { Badge } from './ui';

const STAGES: { id: WorkflowStage; label: string }[] = [
  { id: 1, label: '1. אבחון ארגוני' },
  { id: 2, label: '2. מפת הזדמנויות' },
  { id: 3, label: '3. סימולטור ROI' },
  { id: 4, label: '4. מדדים ותוכנית' },
];

const ICONS = { university: Building2, government: Landmark, law: Scale };

export function TopNav() {
  const { stage, setStage, analysis, loadPreset, resetAll } = useAppStore();
  const [open, setOpen] = useState(false);
  const hasAnalysis = !!analysis;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-300" />
          <span className="text-lg font-extrabold tracking-tight">AI Strategy & ROI Simulator</span>
        </div>
        <nav className="flex flex-wrap items-center gap-1 sm:ms-6">
          {STAGES.map((s) => {
            const disabled = s.id > 1 && !hasAnalysis;
            const active = stage === s.id;
            return (
              <button
                key={s.id}
                disabled={disabled}
                onClick={() => setStage(s.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          {analysis && (
            <Badge tone={analysis.origin === 'llm' ? 'emerald' : analysis.origin === 'fallback' ? 'amber' : 'blue'}>
              {analysis.origin === 'llm' ? 'ניתוח AI' : analysis.origin === 'fallback' ? 'תרחיש חלופי' : 'תרחיש לדוגמה'}
            </Badge>
          )}
          <div className="relative">
            <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-medium hover:bg-slate-700">
              טען תרחיש לדוגמה <ChevronDown className="h-4 w-4" />
            </button>
            {open && (
              <div className="absolute end-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl">
                {PRESETS.map((p) => {
                  const Icon = ICONS[p.icon];
                  return (
                    <button key={p.id} onClick={() => { loadPreset(p.id); setOpen(false); }} className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-start hover:bg-slate-50">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                      <span>
                        <span className="block text-sm font-bold">{p.title}</span>
                        <span className="block text-xs text-slate-500">{p.subtitle}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button onClick={() => { if (confirm('לאפס את כל הנתונים ולהתחיל מחדש?')) resetAll(); }} title="התחל מחדש" className="rounded-lg p-2 text-slate-300 hover:bg-slate-800">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
