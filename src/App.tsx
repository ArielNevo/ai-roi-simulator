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
      <main key={effective} className="animate-rise mx-auto max-w-7xl px-4 py-6 md:py-8">
        {effective === 1 && <Stage1Profiler />}
        {effective === 2 && <Stage2Opportunities />}
        {effective === 3 && <Stage3Simulator />}
        {effective === 4 && <Stage4Plan />}
      </main>
      <footer className="no-print mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-6 text-xs text-mute">
        <span>המספרים הם סימולציה על בסיס ההנחות שהוצגו, לא הצעת מחיר ולא ייעוץ פיננסי.</span>
        <span className="num">finance model: src/finance/model.ts · open source</span>
      </footer>
    </div>
  );
}
