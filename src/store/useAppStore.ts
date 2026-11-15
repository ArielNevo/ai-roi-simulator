import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  OrganizationProfile,
  ParamSource,
  SimulationParams,
  StrategyAnalysisResult,
  WorkflowStage,
} from '../types/strategy';
import { DEFAULT_PARAMS, getDefaultParams } from '../finance/model';
import { PRESETS, closestPreset } from '../data/presets';

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  scopeId: string | 'PORTFOLIO';
  scopeLabel: string;
  params: SimulationParams;
  profile: Pick<OrganizationProfile, 'orgName' | 'relevantEmployees' | 'avgHourlyCostIls'>;
  initiativeIds: string[];
}

export type ParamSources = Record<keyof SimulationParams, ParamSource>;

const allSources = (s: ParamSource): ParamSources => ({
  adoptionRate: s, efficiencyGain: s, hitlOverhead: s, realizationRate: s,
  monthlyLicensePerUserIls: s, oneTimeImplementationCostIls: s, trainingCostPerUserIls: s,
  annualMaintenancePct: s, discountRatePct: 'default', rampMonths: 'default',
});

export const EMPTY_PROFILE: OrganizationProfile = {
  orgName: '',
  orgType: 'private',
  sector: '',
  relevantEmployees: 100,
  avgHourlyCostIls: 180,
  sensitivity: 'medium',
  cloudConstraint: 'none',
  dataMaturity: 3,
  bottlenecks: [],
  freeTextContext: '',
};

interface AppState {
  stage: WorkflowStage;
  profile: OrganizationProfile;
  activePresetId: string | null;
  analysis: StrategyAnalysisResult | null;
  isAnalyzing: boolean;
  analysisStep: string;
  errorMsg: string | null;
  selectedScopeId: string | 'PORTFOLIO';
  params: SimulationParams;
  paramSources: ParamSources;
  savedScenarios: SavedScenario[];
  compareIds: [string | null, string | null];

  setStage: (s: WorkflowStage) => void;
  setProfile: (patch: Partial<OrganizationProfile>) => void;
  loadPreset: (id: string) => void;
  resetAll: () => void;
  startAnalysis: () => Promise<void>;
  setAnalysis: (a: StrategyAnalysisResult | null) => void;
  selectScope: (id: string | 'PORTFOLIO') => void;
  setParam: (key: keyof SimulationParams, value: number) => void;
  resetParams: () => void;
  toggleGovernance: (id: string) => void;
  addGovernanceItem: (item: { category: StrategyAnalysisResult['governanceChecklist'][number]['category']; title: string }) => void;
  saveScenario: (name: string) => void;
  deleteScenario: (id: string) => void;
  setCompare: (slot: 0 | 1, id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      stage: 1,
      profile: EMPTY_PROFILE,
      activePresetId: null,
      analysis: null,
      isAnalyzing: false,
      analysisStep: '',
      errorMsg: null,
      selectedScopeId: 'PORTFOLIO',
      params: { ...DEFAULT_PARAMS },
      paramSources: allSources('default'),
      savedScenarios: [],
      compareIds: [null, null],

      setStage: (stage) => set({ stage }),
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch }, activePresetId: null })),

      loadPreset: (id) => {
        const preset = PRESETS.find((p) => p.id === id);
        if (!preset) return;
        const analysis: StrategyAnalysisResult = { ...preset.analysis, origin: 'preset', presetId: id, generatedAt: new Date().toISOString() };
        set({
          profile: preset.profile,
          activePresetId: id,
          analysis,
          errorMsg: null,
          selectedScopeId: 'PORTFOLIO',
          params: getDefaultParams(analysis.initiatives, 'PORTFOLIO'),
          paramSources: allSources('market'),
          stage: 2,
        });
      },

      resetAll: () => set({
        stage: 1, profile: EMPTY_PROFILE, activePresetId: null, analysis: null, errorMsg: null,
        selectedScopeId: 'PORTFOLIO', params: { ...DEFAULT_PARAMS }, paramSources: allSources('default'),
      }),

      startAnalysis: async () => {
        const { profile } = get();
        set({ isAnalyzing: true, errorMsg: null, analysisStep: 'שולח את פרופיל הארגון לניתוח…' });
        try {
          let analysis: StrategyAnalysisResult;
          try {
            const res = await fetch(`${import.meta.env.BASE_URL}api/analyze`.replace(/\/{2,}/g, '/'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profile }),
            });
            const text = await res.text();
            let body: { error?: string } & Partial<StrategyAnalysisResult> = {};
            try { body = JSON.parse(text); } catch { throw new Error('NO_API'); }
            if (!res.ok) throw new Error(body?.error || 'שגיאה לא ידועה');
            analysis = body as StrategyAnalysisResult;
          } catch (e) {
            // Static hosting (GitHub Pages) or server down: the app still works
            // with the closest built-in scenario, and says so.
            const isNoApi = e instanceof TypeError || (e instanceof Error && e.message === 'NO_API');
            if (!isNoApi) throw e;
            const preset = closestPreset(profile);
            analysis = {
              ...preset.analysis,
              generatedAt: new Date().toISOString(),
              origin: 'fallback',
              presetId: preset.id,
              providerNote: 'גרסה זו רצה ללא שרת ניתוח (אירוח סטטי). מוצג התרחיש המובנה הקרוב ביותר לפרופיל שהזנת; להרצה עם מודל AI יש להריץ את השרת מקומית.',
            };
          }
          set({
            analysis,
            activePresetId: analysis.origin === 'fallback' ? analysis.presetId ?? null : null,
            selectedScopeId: 'PORTFOLIO',
            params: getDefaultParams(analysis.initiatives, 'PORTFOLIO'),
            paramSources: allSources('market'),
            stage: 2,
            isAnalyzing: false,
            analysisStep: '',
          });
        } catch (e) {
          set({ isAnalyzing: false, analysisStep: '', errorMsg: e instanceof Error ? e.message : String(e) });
        }
      },

      setAnalysis: (analysis) => set({ analysis }),

      selectScope: (id) => {
        const { analysis } = get();
        set({
          selectedScopeId: id,
          params: analysis ? getDefaultParams(analysis.initiatives, id) : { ...DEFAULT_PARAMS },
          paramSources: allSources(analysis ? 'market' : 'default'),
        });
      },

      setParam: (key, value) => set((s) => ({
        params: { ...s.params, [key]: value },
        paramSources: { ...s.paramSources, [key]: 'user' },
      })),

      resetParams: () => {
        const { analysis, selectedScopeId } = get();
        set({
          params: analysis ? getDefaultParams(analysis.initiatives, selectedScopeId) : { ...DEFAULT_PARAMS },
          paramSources: allSources(analysis ? 'market' : 'default'),
        });
      },

      toggleGovernance: (id) => set((s) => s.analysis ? ({
        analysis: { ...s.analysis, governanceChecklist: s.analysis.governanceChecklist.map((g) => g.id === id ? { ...g, completed: !g.completed } : g) },
      }) : {}),

      addGovernanceItem: ({ category, title }) => set((s) => s.analysis ? ({
        analysis: {
          ...s.analysis,
          governanceChecklist: [...s.analysis.governanceChecklist, { id: `custom-${Date.now()}`, category, title, description: 'נוסף ידנית', priority: 'מומלץ', completed: false }],
        },
      }) : {}),

      saveScenario: (name) => {
        const { analysis, profile, selectedScopeId, params, savedScenarios } = get();
        if (!analysis) return;
        const scopeLabel = selectedScopeId === 'PORTFOLIO' ? 'כלל הפורטפוליו' : analysis.initiatives.find((i) => i.id === selectedScopeId)?.title ?? selectedScopeId;
        const sc: SavedScenario = {
          id: `sc-${Date.now()}`,
          name,
          createdAt: new Date().toISOString(),
          scopeId: selectedScopeId,
          scopeLabel,
          params: { ...params },
          profile: { orgName: profile.orgName, relevantEmployees: profile.relevantEmployees, avgHourlyCostIls: profile.avgHourlyCostIls },
          initiativeIds: analysis.initiatives.map((i) => i.id),
        };
        const next = [...savedScenarios, sc].slice(-12);
        const compareIds: [string | null, string | null] = [get().compareIds[0] ?? sc.id, get().compareIds[0] ? sc.id : get().compareIds[1]];
        set({ savedScenarios: next, compareIds });
      },

      deleteScenario: (id) => set((s) => ({
        savedScenarios: s.savedScenarios.filter((x) => x.id !== id),
        compareIds: [s.compareIds[0] === id ? null : s.compareIds[0], s.compareIds[1] === id ? null : s.compareIds[1]],
      })),

      setCompare: (slot, id) => set((s) => {
        const next: [string | null, string | null] = [...s.compareIds] as [string | null, string | null];
        next[slot] = id;
        return { compareIds: next };
      }),
    }),
    {
      name: 'ai-roi-simulator-v1',
      partialize: (s) => ({
        stage: s.stage, profile: s.profile, activePresetId: s.activePresetId, analysis: s.analysis,
        selectedScopeId: s.selectedScopeId, params: s.params, paramSources: s.paramSources,
        savedScenarios: s.savedScenarios, compareIds: s.compareIds,
      }),
    },
  ),
);
