# AI Strategy & ROI Simulator

**דמו חי:** https://arielnevo.github.io/ai-roi-simulator/ (גרסה סטטית: תרחישים מובנים וסימולטור מלא, ללא שרת AI) · **קוד:** https://github.com/ArielNevo/ai-roi-simulator

כלי ניהולי בעברית (RTL מלא) למיפוי הזדמנויות AI, החלטות קנייה מול פיתוח, הגדרת מדדים וסימולציית החזר השקעה.
נבנה ב-Claude Code כפרויקט ייחוס להרצאה על בניית אפליקציות בווייב קודינג: המטרה היא אפליקציה שאפשר לסמוך עליה גם אחרי הדמו.

## מה יש כאן

| שלב | מה המשתמש עושה |
|---|---|
| 1. אבחון ארגוני | פרופיל ארגון, רגישות מידע, מגבלת ענן (כולל נימבוס), צווארי בקבוק, מסמך רקע |
| 2. מפת הזדמנויות | 4–6 יוזמות על מטריצת מאמץ-אימפקט, המלצת Buy / Build / Hybrid, כלים עם התאמה לרגולציה ומק"טי נימבוס |
| 3. סימולטור ROI | 10 מחוונים, תזרים ל-36 חודשים בשלושה תרחישים, NPV, נקודת איזון, מטריצת רגישות, השוואת תרחישים |
| 4. מדדים ותוכנית | יעדי OKR לרבעון 1, רבעון 2 ושנה 1, צ'קליסט ממשל ואבטחה, ייצוא Markdown / CSV / הדפסה |

שלושה תרחישים מובנים: בית הספר למנהל עסקים באוניברסיטה העברית, רשות התאגידים במשרד המשפטים (על נימבוס), ומשרד עורכי דין אריאל נבו.

### מה שונה מגרסת ה-AI Studio

- **המודל הפיננסי** (`src/finance/model.ts`) הוא קוד טהור עם בדיקות יחידה. הוא מפריד בין שעות שמתפנות לכסף ממומש (שיעור מימוש), משתמש בעקומת אימוץ של 12 חודשים, מחשב NPV, וכולל הדרכה ותחזוקה. מטריצת הרגישות תמיד מכילה תא אדום.
- **שכבת ה-LLM** (`server/llm/`) מאחורי ממשק אחד עם שני ספקים (Gemini, Claude), ולידציה ב-Zod, 3 ניסיונות עם backoff, ונפילה לתרחיש מובנה עם הודעה כנה למשתמש. האפליקציה עובדת במלואה בלי מפתח API.
- **נתוני ייחוס**: קטלוג כלים מסונן לפי רגישות ומגבלת ענן, ורשימת השירותים המאושרים ברובד 5 של נימבוס (339 שירותים, 04.08.2026) ששימשה גם לסינון וגם לעיגון הפרומפט.
- **שמירה**: כל המצב נשמר ב-localStorage. רענון לא מוחק עבודה.
- **עיצוב**: שפה עיצובית משלו (נייר חם, Frank Ruhl Libre לכותרות, IBM Plex Mono למספרים), לוגו "Ariel Nevo" כאריחים (Data → Insight → Decision → Impact) שמונפש ב-SVG, ונוף פואנטיליסטי גנרטיבי בקנבס (`src/components/GenerativeLandscape.tsx`) כגיבוי כשהווידאו לא נטען.
- **מדיה, כולה מקומית** (`public/media/`): סרטון הפתיחה נבנה ב-ffmpeg מתמונות שנוצרו ב-ChatGPT וב-Gemini (תנועת מצלמה איטית וקרוספייד, 33 שניות, ללא קול). האווטאר של אריאל נבו: קריינות בשיבוט קול מקומי (Chatterbox) וסנכרון שפתיים מקומי (SadTalker), בלי העלאת פנים או קול לשירות חיצוני. מסומן באתר כ"אווטאר וקול שנוצרו בבינה מלאכותית", עם כתוביות WebVTT.

## הרצה

```bash
npm install
cp .env.example .env     # ברירת מחדל: LLM_PROVIDER=none (תרחישים מובנים)
npm run dev              # לקוח על 5173, שרת API על 3001
```

כדי להפעיל ניתוח אמיתי, ערוך את `.env`:

```
LLM_PROVIDER=claude      # או gemini
ANTHROPIC_API_KEY=...    # או GEMINI_API_KEY=...
```

## בדיקות ואיכות

```bash
npm test                 # Vitest: מודל פיננסי + שכבת LLM (retry/fallback)
npm run typecheck        # tsc על הלקוח והשרת
npm run build            # בניית הלקוח ל-dist/
```

## פריסה

- **Docker**: `docker build -t ai-roi-simulator . && docker run -p 3001:3001 --env-file .env ai-roi-simulator`
- **Vercel / Netlify (לקוח) + Cloud Run / Railway (שרת)**: בנה את הלקוח עם `npm run build` והפנה את ה-proxy של `/api` לשרת.
- GitHub Actions מריץ typecheck, בדיקות ובנייה על כל push.

## מבנה

```
CLAUDE.md                 כללי הפרויקט לסוכן
data/                     קובץ המקור של רשימת נימבוס רובד 5
server/index.ts           Express: /api/health, /api/nimbus, /api/analyze
server/llm/               prompt.ts · gemini.ts · claude.ts · index.ts (retry + fallback) · בדיקות
src/types/                schema.ts (Zod, מקור האמת) · strategy.ts (טיפוסים ותוויות)
src/finance/              model.ts · model.test.ts
src/data/                 presets.ts · toolCatalog.ts · nimbus/ (JSON + עזרי חיפוש)
src/store/                Zustand + localStorage
src/components/           TopNav · Stage1Profiler · Stage2Opportunities · Stage3Simulator · ComparisonView · Stage4Plan · NimbusCatalog
src/utils/export.ts       Markdown / CSV
```

## הנחות ומגבלות

- המספרים הם סימולציה, לא הצעת מחיר. כל פרמטר מסומן לפי מקורו: מהקלט שלך / ברירת מחדל / הערכת שוק.
- מסמכי רקע נתמכים כטקסט (txt, md, csv). PDF יש להדביק כטקסט.
- רשימת נימבוס היא תמונת מצב מתאריך הקובץ; יש לאמת מול הרשימה העדכנית לפני רכש.
