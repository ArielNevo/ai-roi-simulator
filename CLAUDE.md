# AI Strategy & ROI Simulator

Executive web app in Hebrew. Full RTL (`dir="rtl"`, `lang="he"`). Built as a
reference project for a lecture on vibe coding: the point is that it stays
trustworthy after the demo, not just impressive during it.

## Architecture rules
- All financial math lives in `src/finance/model.ts` as pure functions with
  Vitest tests in `src/finance/model.test.ts`. UI never computes money.
  The LLM never computes money.
- Every LLM call goes through `server/llm/` behind one interface
  (`analyzeOrganization(input) -> StrategyAnalysisResult`). Providers:
  `gemini.ts`, `claude.ts`. Output is validated with Zod against
  `src/types/strategy.ts`. Never trust raw model JSON.
- On any LLM failure: retry 3x with exponential backoff, then fall back to the
  closest preset and tell the user it is a preset. The app must be fully usable
  with `LLM_PROVIDER=none` and no API key.
- State persists to localStorage via the Zustand store in `src/store/`.
  Refresh never loses work.
- Reference data lives in `src/data/`: presets (3 Israeli scenarios), the
  Nimbus tier-5 approved-services catalog (`src/data/nimbus/`), and the tool
  catalog with deployment options. The original spreadsheet is in `data/`.

## Finance model rules
- Separate hard savings from soft savings with a realization rate.
- 12-month S-curve adoption ramp. Include training, change management and
  ongoing maintenance for Build initiatives. Show NPV with a discount-rate
  slider alongside ROI and payback.
- The sensitivity matrix ranges must always include at least one losing cell.
- Every displayed number has a source label: user input / model default /
  market finding.

## UI rules
- Tailwind v4, executive palette (slate-900, blue-700, emerald-600, rose-600).
- Recharts for charts; RTL-safe labels and tooltips.
- No English-only labels; Buy/Build/Hybrid get a Hebrew legend.

## Workflow
- `npm run dev` runs client (5173) and server (3001) together.
- Run `npm test` and `npm run typecheck` before declaring any task done.
- Commit per feature with a Hebrew-or-English message; keep commits small.
