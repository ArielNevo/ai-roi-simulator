import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { TopNav } from './components/TopNav';
import { Stage1Profiler } from './components/Stage1Profiler';
import { Stage2Opportunities } from './components/Stage2Opportunities';
import { Stage3Simulator } from './components/Stage3Simulator';
import { Stage4Plan } from './components/Stage4Plan';

export default function App() {
  const stage = useAppStore((s) => s.stage);
  const analysis = useAppStore((s) => s.analysis);
  const effective = analysis ? stage : 1;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [effective]);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-6">
        {effective === 1 && <Stage1Profiler />}
        {effective === 2 && <Stage2Opportunities />}
        {effective === 3 && <Stage3Simulator />}
        {effective === 4 && <Stage4Plan />}
      </main>
      <footer className="no-print mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-400">
        המספרים הם סימולציה על בסיס ההנחות שהוצגו, לא הצעת מחיר ולא ייעוץ פיננסי. הקוד הפיננסי פתוח ב-src/finance/model.ts.
      </footer>
    </div>
  );
}
