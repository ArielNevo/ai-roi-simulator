/**
 * Three complete Israeli scenarios. They make the app fully usable with no
 * API key, and they are the fallback when the LLM fails.
 *
 * Numbers are market-style defaults (realization rates, licence costs,
 * implementation costs) and are labelled as such in the UI. They are starting
 * points for a conversation, not a quote.
 */
import type { LlmAnalysisOutput, OrganizationProfile } from '../types/strategy';

export interface Preset {
  id: string;
  title: string;
  subtitle: string;
  icon: 'university' | 'government' | 'law';
  profile: OrganizationProfile;
  analysis: LlmAnalysisOutput & { sources: { title: string; uri: string }[] };
}

const HUJI: Preset = {
  id: 'huji-business-school',
  title: 'בית הספר למנהל עסקים, האוניברסיטה העברית',
  subtitle: 'אקדמיה · הוראה, מחקר ומינהל סטודנטים · ~140 אנשי סגל ומינהל',
  icon: 'university',
  profile: {
    orgName: 'בית הספר למנהל עסקים, האוניברסיטה העברית',
    orgType: 'academic',
    sector: 'השכלה גבוהה: הוראה, מחקר ומינהל אקדמי',
    relevantEmployees: 140,
    avgHourlyCostIls: 190,
    sensitivity: 'medium',
    cloudConstraint: 'none',
    dataMaturity: 3,
    bottlenecks: ['מחקר, כתיבה אקדמית והוראה', 'שירות לקוחות ופניות ציבור', 'ניהול ידע, הדרכה ותפעול', 'שיווק, מכירות וגיוס'],
    freeTextContext:
      'כ-60 חברי סגל אקדמי וכ-80 עובדי מינהל. מאות קורסים בשנה ב-Moodle, תוכניות MBA, EMBA ותואר ראשון, אלפי פניות סטודנטים בסמסטר על תקנונים, מועדים ומלגות. לאוניברסיטה הסכמי Google Workspace ו-Microsoft. מידע סטודנטים ומחקר כפופים לחוק הגנת הפרטיות ולכללי אתיקה מחקרית. הסגל חצוי: חלק מאמץ AI בהתלהבות, חלק חושש מהשפעה על יושרה אקדמית.',
  },
  analysis: {
    executiveSummary:
      'בית הספר יכול להשיג ערך מהיר משלושה כיוונים: עוזר ידע לסטודנטים על התקנונים (מפחית עומס פניות), כלי מחקר וכתיבה לסגל (מקצר סקירות ספרות), ועוזרי הוראה על חומרי הקורס. ההמלצה היא לרכוש כלי מדף ברישוי מוסדי לרוב השימושים ולפתח בעצמנו רק את מה שנשען על דאטה פנימי: צ\'אט תקנונים ואנליטיקת למידה. התנאי להצלחה אינו טכנולוגי אלא מדיניות אקדמית ברורה על שימוש מותר ב-AI והכשרת סגל.',
    initiatives: [
      {
        id: 'huji-1',
        title: 'עוזר ידע לסטודנטים: תקנונים, מועדים ומלגות (RAG)',
        problemAndSolution:
          'מזכירות הסטודנטים עונה על אלפי פניות חוזרות בכל סמסטר. צ\'אט על מאגר התקנונים, לוח השנה האקדמי ונהלי המלגות עונה 24/7 בעברית ובאנגלית, עם ציטוט למקור, ומפנה למזכירות רק מקרים חריגים.',
        strategicRecommendation: 'build',
        recommendationRationale:
          'הערך כולו בדאטה הפנימי (תקנונים שמשתנים כל שנה). מנוע RAG על Vertex AI או Bedrock עם ממשק פשוט, או שימוש ב-NotebookLM Enterprise כגרסת ביניים.',
        dataDependency: 'high',
        effortScore: 5,
        impactScore: 8,
        estimatedWeeks: 10,
        recommendedTools: [
          { category: 'פלטפורמת RAG', tools: ['Gemini on Vertex AI', 'Claude on Amazon Bedrock', 'NotebookLM Enterprise'], deployment: 'ענן של האוניברסיטה (Google Cloud / AWS) עם הפרדת נתונים', privacyFitNote: 'התקנונים ציבוריים; יש לוודא שהצ\'אט אינו ניגש לנתוני סטודנט אישיים ללא הזדהות.' },
        ],
        risks: [
          { area: 'דיוק', risk: 'תשובה שגויה על מועד או זכאות עלולה לפגוע בסטודנט.', mitigation: 'חובת ציטוט למסמך המקור, ביקורת שבועית על 50 תשובות אקראיות.' },
          { area: 'תחזוקה', risk: 'תקנונים מתעדכנים והבוט נשאר מאחור.', mitigation: 'אינדוקס אוטומטי מתיקיית התקנונים הרשמית, בעלות של מזכירות הסטודנטים.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.3, processTimeShare: 0.3, adoptionRate: 70, efficiencyGain: 35, hitlOverhead: 15, realizationRate: 45, monthlyLicensePerUserIls: 40, oneTimeImplementationCostIls: 180000, trainingCostPerUserIls: 600, annualMaintenancePct: 20 },
      },
      {
        id: 'huji-2',
        title: 'סיוע מחקר וסקירת ספרות לסגל',
        problemAndSolution:
          'חוקרים מבלים שבועות בסקירות ספרות ובכתיבת הצעות מחקר. כלים כמו Elicit, Consensus ו-Scite מחלצים ממצאים ממאמרים עם ציטוטים מאומתים, ועוזר כתיבה ארגוני מסייע בניסוח, תרגום ועריכה.',
        strategicRecommendation: 'buy',
        recommendationRationale: 'כלי מדף בוגרים עם רישוי מוסדי. אין יתרון בפיתוח עצמי; הערך הוא בהכשרה ובמדיניות ציטוט.',
        dataDependency: 'low',
        effortScore: 2,
        impactScore: 7,
        estimatedWeeks: 4,
        recommendedTools: [
          { category: 'מחקר אקדמי וסקירת ספרות', tools: ['Elicit / Consensus / Scite', 'NotebookLM'], deployment: 'SaaS עם רישוי מוסדי', privacyFitNote: 'מאמרים מפורסמים בלבד; טיוטות לא מפורסמות רק בכלי עם Zero Data Retention.' },
          { category: 'עוזר כתיבה', tools: ['Gemini for Google Workspace', 'ChatGPT Enterprise / Claude for Enterprise'], deployment: 'SaaS ארגוני עם Zero Data Retention', privacyFitNote: 'נדרש הסכם אי-אימון על נתוני המוסד.' },
        ],
        risks: [
          { area: 'יושרה אקדמית', risk: 'ציטוטים מומצאים או טקסט שנוצר ללא גילוי.', mitigation: 'מדיניות גילוי AI במאמרים, הכשרה חובה לפני קבלת רישיון.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.45, processTimeShare: 0.25, adoptionRate: 55, efficiencyGain: 30, hitlOverhead: 20, realizationRate: 30, monthlyLicensePerUserIls: 130, oneTimeImplementationCostIls: 40000, trainingCostPerUserIls: 900, annualMaintenancePct: 5 },
      },
      {
        id: 'huji-3',
        title: 'עוזרי הוראה על חומרי הקורס ומשוב על מטלות',
        problemAndSolution:
          'מרצים ומתרגלים מתקשים לתת משוב אישי במאות מטלות. עוזר הוראה המוגבל לחומרי הקורס עונה לסטודנטים על החומר, מייצר שאלות תרגול ומציע טיוטת משוב שהמתרגל מאשר.',
        strategicRecommendation: 'hybrid',
        recommendationRationale: 'עוזרי LMS מוכנים (Moodle AI, Gemini for Education) לרוב הקורסים; פיתוח נקודתי בקורסי ליבה שבהם יש חומרים ייחודיים ומבחנים מורכבים.',
        dataDependency: 'medium',
        effortScore: 6,
        impactScore: 8,
        estimatedWeeks: 14,
        recommendedTools: [
          { category: 'הוראה ולמידה', tools: ['עוזרי הוראה ב-LMS (Moodle AI / Canvas / Gemini for Education)'], deployment: 'SaaS ארגוני בתוך ה-LMS', privacyFitNote: 'נתוני ציונים הם מידע אישי; המשוב האוטומטי הוא טיוטה בלבד ואינו נשמר כציון.' },
        ],
        risks: [
          { area: 'פדגוגיה', risk: 'סטודנטים נשענים על הבוט במקום ללמוד.', mitigation: 'מצב "הנחיה" במקום "תשובה", מעקב שימוש, הכוונה של הסגל.' },
          { area: 'התנגדות סגל', risk: 'סגל שאינו מאמץ, הכלי נשאר על המדף.', mitigation: 'פיילוט עם 8 מרצים מובילים, הצגת תוצאות בישיבת סגל.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.4, processTimeShare: 0.35, adoptionRate: 50, efficiencyGain: 25, hitlOverhead: 25, realizationRate: 25, monthlyLicensePerUserIls: 45, oneTimeImplementationCostIls: 220000, trainingCostPerUserIls: 1200, annualMaintenancePct: 15 },
      },
      {
        id: 'huji-4',
        title: 'אוטומציה מנהלית: סיכומי ישיבות, מסמכי ועדות ותרגום',
        problemAndSolution:
          'ועדות הוראה, ועדות מינויים ומינהל התוכניות מייצרים פרוטוקולים, מכתבים ותרגומים בכמויות. Copilot או Gemini בתוך Office/Workspace מסכמים ישיבות, מנסחים מכתבים ומתרגמים בלחיצה.',
        strategicRecommendation: 'buy',
        recommendationRationale: 'האוניברסיטה כבר משלמת על החבילות; התוספת היא רישיון AI למשתמשים כבדים בלבד.',
        dataDependency: 'low',
        effortScore: 2,
        impactScore: 6,
        estimatedWeeks: 4,
        recommendedTools: [
          { category: 'עוזר פרודוקטיביות רוחבי', tools: ['Microsoft 365 Copilot', 'Gemini for Google Workspace'], deployment: 'SaaS ארגוני בתוך ההסכם הקיים', privacyFitNote: 'פרוטוקולי ועדות מינויים מסווגים; להפעיל רק בקבוצות משתמשים מוגדרות.' },
        ],
        risks: [
          { area: 'אימוץ', risk: 'רישיונות נרכשים ולא בשימוש.', mitigation: 'הקצאה לפי שימוש בפועל אחרי 60 יום, הדרכות של שעה בכל יחידה.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.5, processTimeShare: 0.2, adoptionRate: 60, efficiencyGain: 25, hitlOverhead: 15, realizationRate: 35, monthlyLicensePerUserIls: 110, oneTimeImplementationCostIls: 30000, trainingCostPerUserIls: 500, annualMaintenancePct: 5 },
      },
      {
        id: 'huji-5',
        title: 'אנליטיקת למידה וזיהוי מוקדם של סטודנטים בסיכון נשירה',
        problemAndSolution:
          'נשירה והתמשכות לימודים מזוהות מאוחר מדי. מודל על נתוני ה-LMS, הנוכחות והציונים מסמן סטודנטים בסיכון בשבועות הראשונים ומפנה ליועצים.',
        strategicRecommendation: 'build',
        recommendationRationale: 'דאטה פנימי ורגיש, שאלה ייחודית למוסד. בניית מודל על BigQuery ML או SageMaker עם צוות הדאטה של האוניברסיטה.',
        dataDependency: 'high',
        effortScore: 8,
        impactScore: 7,
        estimatedWeeks: 24,
        recommendedTools: [
          { category: 'אנליטיקה וזיהוי אנומליות', tools: ['BigQuery ML / SageMaker / SAS Viya'], deployment: 'ענן של האוניברסיטה עם בקרת גישה', privacyFitNote: 'נדרש אישור ועדת אתיקה ושקיפות מול הסטודנטים על עצם קיום המודל.' },
        ],
        risks: [
          { area: 'הוגנות', risk: 'הטיה נגד אוכלוסיות מסוימות.', mitigation: 'בדיקת הוגנות לפני הפעלה, אדם מחליט על כל התערבות.' },
          { area: 'דאטה', risk: 'נתונים מפוזרים בין מערכות ואיכותם נמוכה.', mitigation: 'שלב הכנה של 8 שבועות לאיחוד מקורות לפני כל מודל.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.1, processTimeShare: 0.3, adoptionRate: 80, efficiencyGain: 20, hitlOverhead: 30, realizationRate: 50, monthlyLicensePerUserIls: 0, oneTimeImplementationCostIls: 350000, trainingCostPerUserIls: 2000, annualMaintenancePct: 20 },
      },
    ],
    kpis: [
      { id: 'k1', category: 'אימוץ', metricName: 'סגל ומינהל פעילים שבועית בכלי AI מורשה', q1Target: '30%', q2Target: '50%', year1Target: '70%', owner: 'סגן הדיקן לדיגיטל' },
      { id: 'k2', category: 'אימוץ', metricName: 'שיעור פניות סטודנטים שנענו בצ\'אט ללא מזכירות', q1Target: '20%', q2Target: '40%', year1Target: '55%', owner: 'ראש מינהל סטודנטים' },
      { id: 'k3', category: 'איכות ודיוק', metricName: 'דיוק תשובות הצ\'אט בביקורת מדגמית', q1Target: '85%', q2Target: '92%', year1Target: '95%', owner: 'מזכירות הסטודנטים' },
      { id: 'k4', category: 'איכות ודיוק', metricName: 'אירועי יושרה אקדמית הקשורים ל-AI ללא גילוי', q1Target: 'קו בסיס', q2Target: 'ירידה 20%', year1Target: 'ירידה 40%', owner: 'ועדת ההוראה' },
      { id: 'k5', category: 'עסקי ופיננסי', metricName: 'זמן ממוצע לסקירת ספרות (דיווח סגל)', q1Target: 'קו בסיס', q2Target: 'קיצור 25%', year1Target: 'קיצור 40%', owner: 'סגן הדיקן למחקר' },
      { id: 'k6', category: 'עסקי ופיננסי', metricName: 'שביעות רצון סטודנטים משירות המינהל (סקר)', q1Target: 'קו בסיס', q2Target: '+0.3', year1Target: '+0.5', owner: 'ראש מינהל סטודנטים' },
    ],
    governanceChecklist: [
      { id: 'g1', category: 'ממשל תאגידי ורגולציה', title: 'מדיניות שימוש ב-AI בהוראה, במחקר ובהערכה', description: 'מה מותר לסטודנטים ולסגל, חובת גילוי, ומי מאשר חריגים.', priority: 'חובה', completed: false },
      { id: 'g2', category: 'אבטחת מידע ופרטיות', title: 'הסכמי Zero Data Retention עם ספקי הכלים', description: 'אי-אימון על נתוני המוסד, מחיקה, ומיקום שרתים.', priority: 'חובה', completed: false },
      { id: 'g3', category: 'אבטחת מידע ופרטיות', title: 'אישור ועדת אתיקה למודל סיכון נשירה', description: 'שקיפות לסטודנטים, זכות ערעור, בדיקת הוגנות.', priority: 'חובה', completed: false },
      { id: 'g4', category: 'הכשרת עובדים ושינוי ארגוני', title: 'סדנת AI literacy לכל הסגל והמינהל', description: 'שעתיים חובה לפני קבלת רישיון, עם דוגמאות מהתחום.', priority: 'חובה', completed: false },
      { id: 'g5', category: 'הכשרת עובדים ושינוי ארגוני', title: 'קהילת "שגרירי AI" בבית הספר', description: '8 אנשי סגל ומינהל שמלווים עמיתים ומדווחים לוועדת ההיגוי.', priority: 'מומלץ', completed: false },
    ],
    sources: [
      { title: 'האוניברסיטה העברית: מדיניות שימוש בבינה מלאכותית בהוראה', uri: 'https://www.huji.ac.il' },
      { title: 'JISC / EDUCAUSE: AI in higher education 2025', uri: 'https://www.educause.edu' },
    ],
  },
};

const CORP_AUTHORITY: Preset = {
  id: 'corporations-authority',
  title: 'רשות התאגידים, משרד המשפטים',
  subtitle: 'ממשלה · רישום ופיקוח על חברות, עמותות ושותפויות · ענן נימבוס · ~450 עובדים',
  icon: 'government',
  profile: {
    orgName: 'רשות התאגידים, משרד המשפטים',
    orgType: 'government',
    sector: 'ממשלה: רישום, פיקוח ואכיפה על תאגידים',
    relevantEmployees: 450,
    avgHourlyCostIls: 165,
    sensitivity: 'high',
    cloudConstraint: 'nimbus',
    dataMaturity: 3,
    bottlenecks: ['שירות לקוחות ופניות ציבור', 'ניתוח מסמכים, חוזים ותיקים', 'אכיפה, רגולציה וציות', 'ניהול ידע, הדרכה ותפעול'],
    freeTextContext:
      'הרשות מנהלת את רשם החברות, רשם העמותות, רשם השותפויות ורשם המשכונות. מאות אלפי דוחות שנתיים, בקשות רישום ושינויי פרטים בשנה, מיליוני פניות ציבור ומוקד טלפוני עמוס. דיונים בעררים ושימועים לפני מחיקה. המידע כולל פרטים אישיים ומידע עסקי רגיש. כל פתרון ענן חייב להיות בנימבוס (רובד 1 או שירות מאושר ברובד 5) או מקומי. יש צוות דאטה קטן ומערכת ליבה ותיקה.',
  },
  analysis: {
    executiveSummary:
      'הרשות היא מקרה קלאסי של ארגון רגולטורי עתיר מסמכים ופניות: שני השלישים הראשונים של הערך נמצאים בעיבוד אוטומטי של דוחות ומסמכי רישום ובמענה אוטומטי לפניות ציבור על בסיס הידע הרשותי. מגבלת נימבוס אינה חסם: Document AI, Vertex AI ו-Bedrock זמינים ברובד 1, וכלים ישראליים כמו Kal-Docs, Kal-Chat ו-MUST מאושרים ברובד 5. ההמלצה: לרכוש ברובד 5 לכל מה שרוחבי, ולבנות ברובד 1 את מה שנשען על דאטה של הרשות (זיהוי חריגות בדיווחים). ממשל AI ושקיפות כלפי הציבור הם תנאי מקדים.',
    initiatives: [
      {
        id: 'corp-1',
        title: 'עיבוד אוטומטי של דוחות שנתיים ומסמכי רישום',
        problemAndSolution:
          'עובדי הרשות מקלידים ובודקים ידנית דוחות שנתיים, פרוטוקולים ותצהירים סרוקים. OCR וחילוץ שדות מבוסס AI מזהים את סוג המסמך, מחלצים את השדות למערכת הליבה ומסמנים חוסרים וסתירות לבדיקת פקיד.',
        strategicRecommendation: 'buy',
        recommendationRationale: 'קיימים פתרונות מאושרים בנימבוס: Kal-Docs ברובד 5 או Document AI/Textract ברובד 1. פיתוח עצמי נדרש רק בחיבור למערכת הליבה.',
        dataDependency: 'medium',
        effortScore: 5,
        impactScore: 9,
        estimatedWeeks: 16,
        recommendedTools: [
          { category: 'עיבוד מסמכים ו-OCR', tools: ['Kal-Docs', 'Document AI / Amazon Textract'], deployment: 'נימבוס רובד 5 (Kal-Docs, GCP) או רובד 1 (Document AI)', privacyFitNote: 'המידע נשאר בפרויקט הנימבוס של המשרד; אין יציאה לספק חיצוני.', nimbusSkus: [] },
          { category: 'התממה וסיווג מידע לפני AI', tools: ['SecuPi / Minereye DataTracker'], deployment: 'נימבוס רובד 5 (AWS)', privacyFitNote: 'התממת פרטים אישיים לפני שליחה למודלים כלליים.' },
        ],
        risks: [
          { area: 'דיוק', risk: 'שדה שחולץ שגוי נרשם במרשם רשמי.', mitigation: 'סף ביטחון: מתחתיו אישור פקיד חובה; מדידת דיוק שבועית.' },
          { area: 'אינטגרציה', risk: 'מערכת הליבה הוותיקה ללא API.', mitigation: 'שלב ביניים של קובץ ייצוא מובנה, ובמקביל OpenLegacy (מאושר ברובד 5).' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.35, processTimeShare: 0.45, adoptionRate: 80, efficiencyGain: 40, hitlOverhead: 20, realizationRate: 50, monthlyLicensePerUserIls: 90, oneTimeImplementationCostIls: 900000, trainingCostPerUserIls: 1500, annualMaintenancePct: 18 },
      },
      {
        id: 'corp-2',
        title: 'עוזר פניות ציבור על מאגר הידע הרשותי (צ\'אט RAG)',
        problemAndSolution:
          'המוקד והדוא"ל מוצפים בשאלות חוזרות: איך מגישים דוח, מהי עלות אגרה, מה סטטוס הבקשה. צ\'אט על הנהלים, השאלות הנפוצות וההנחיות עונה בעברית, בערבית ובאנגלית, ומעביר לנציג רק פניות מורכבות.',
        strategicRecommendation: 'hybrid',
        recommendationRationale: 'Kal-Chat או Wonderful מאושרים ברובד 5 ומספקים את הצ\'אט; חיבור לסטטוס בקשה אישי דורש פיתוח קטן עם הזדהות ממשלתית.',
        dataDependency: 'high',
        effortScore: 4,
        impactScore: 8,
        estimatedWeeks: 12,
        recommendedTools: [
          { category: 'צ\'אט ארגוני על מאגרי ידע (RAG)', tools: ['Kal-Chat', 'Progress Agentic RAG (Nuclia)', 'Wonderful'], deployment: 'נימבוס רובד 5', privacyFitNote: 'שלב א\' על ידע ציבורי בלבד; שלב ב\' עם הזדהות ממשלתית לסטטוס אישי.' },
          { category: 'פלטפורמת מודלים (Build)', tools: ['Gemini on Vertex AI', 'Claude / Nova on Amazon Bedrock'], deployment: 'נימבוס רובד 1', privacyFitNote: 'לחלק המפותח בלבד.' },
        ],
        risks: [
          { area: 'רגולציה', risk: 'מתן "ייעוץ משפטי" בטעות.', mitigation: 'גדרות תוכן, ניסוח שמפנה לנוהל, מעקב על שאלות שנדחו.' },
          { area: 'אמון ציבור', risk: 'תשובה שגויה מתפרסמת ברשתות.', mitigation: 'ציטוט למקור בכל תשובה, כפתור "דווח על טעות", סקירת לוגים יומית.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.25, processTimeShare: 0.5, adoptionRate: 85, efficiencyGain: 35, hitlOverhead: 15, realizationRate: 55, monthlyLicensePerUserIls: 60, oneTimeImplementationCostIls: 450000, trainingCostPerUserIls: 800, annualMaintenancePct: 15 },
      },
      {
        id: 'corp-3',
        title: 'זיהוי חריגות בדיווחי תאגידים לתעדוף אכיפה',
        problemAndSolution:
          'צוות האכיפה בוחר תיקים לבדיקה באופן ידני. מודל על נתוני הדיווחים ההיסטוריים מסמן תאגידים עם דפוסי דיווח חריגים (עמותות ללא פעילות, שינויי בעלות תכופים, סתירות בין דוחות) ומייצר רשימת תעדוף מנומקת.',
        strategicRecommendation: 'build',
        recommendationRationale: 'הדאטה ייחודי לרשות והלוגיקה היא לב הסמכות הרגולטורית. פיתוח על BigQuery ML או SageMaker ברובד 1 עם צוות הדאטה, או SAS Viya ברובד 5.',
        dataDependency: 'high',
        effortScore: 8,
        impactScore: 8,
        estimatedWeeks: 28,
        recommendedTools: [
          { category: 'אנליטיקה וזיהוי אנומליות', tools: ['BigQuery ML / SageMaker / SAS Viya', 'IBM watsonx (ai / Orchestrate / governance)'], deployment: 'נימבוס רובד 1 או רובד 5', privacyFitNote: 'מודל סטטיסטי על נתונים מנהליים; הפלט הוא תעדוף לבדיקה אנושית, לא החלטה.' },
        ],
        risks: [
          { area: 'הוגנות ומשפט מנהלי', risk: 'תעדוף שנתפס כאפליה או כהחלטה אוטומטית.', mitigation: 'אדם מחליט על כל פתיחת הליך; תיעוד נימוקי המודל; ביקורת פנימית שנתית.' },
          { area: 'דאטה', risk: 'איכות נתונים היסטוריים נמוכה.', mitigation: 'שלב ניקוי של 10 שבועות לפני אימון.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.08, processTimeShare: 0.4, adoptionRate: 90, efficiencyGain: 30, hitlOverhead: 35, realizationRate: 60, monthlyLicensePerUserIls: 0, oneTimeImplementationCostIls: 1200000, trainingCostPerUserIls: 3000, annualMaintenancePct: 20 },
      },
      {
        id: 'corp-4',
        title: 'תמלול וסיכום דיונים, שימועים ושיחות מוקד',
        problemAndSolution:
          'דיוני עררים ושימועים מתומללים ידנית או לא מתועדים. שיחות המוקד אינן מנותחות. תמלול אוטומטי בעברית, סיכום מובנה לתיק, וניתוח נושאים חוזרים במוקד.',
        strategicRecommendation: 'buy',
        recommendationRationale: 'MUST (Sumit-AI) ו-Koldan מאושרים ברובד 5 ומיועדים לעברית; Speech-to-Text של GCP זמין ברובד 1.',
        dataDependency: 'low',
        effortScore: 3,
        impactScore: 6,
        estimatedWeeks: 8,
        recommendedTools: [
          { category: 'תמלול וסיכום שיחות', tools: ['MUST (Sumit-AI)', 'Koldan (Dixilang) / Meeting Insights'], deployment: 'נימבוס רובד 5 (GCP / AWS)', privacyFitNote: 'הקלטות שימועים מכילות מידע אישי; נדרש יידוע הנוכחים ומדיניות שמירה.' },
        ],
        risks: [
          { area: 'משפטי', risk: 'תמלול שגוי בהליך מנהלי.', mitigation: 'התמלול הוא עזר; הפרוטוקול הרשמי מאושר על ידי היו"ר.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.2, processTimeShare: 0.2, adoptionRate: 75, efficiencyGain: 45, hitlOverhead: 15, realizationRate: 40, monthlyLicensePerUserIls: 120, oneTimeImplementationCostIls: 120000, trainingCostPerUserIls: 500, annualMaintenancePct: 8 },
      },
      {
        id: 'corp-5',
        title: 'עוזר ניסוח וידע לעובדי הרשות (מכתבים, החלטות, נהלים)',
        problemAndSolution:
          'פקידים ועורכי דין ברשות מנסחים אלפי מכתבי דרישה, החלטות ותשובות לפניות. עוזר כתיבה המחובר לתבניות ולנהלים מייצר טיוטה בהתאם לנוהל, והעובד עורך ומאשר.',
        strategicRecommendation: 'buy',
        recommendationRationale: 'Gemini Enterprise זמין דרך נימבוס GCP; לחלופין Enabley לניהול ידע והדרכה ברובד 5. פיתוח אינו מוצדק.',
        dataDependency: 'medium',
        effortScore: 3,
        impactScore: 7,
        estimatedWeeks: 8,
        recommendedTools: [
          { category: 'עוזר פרודוקטיביות רוחבי', tools: ['Gemini for Google Workspace', 'Enabley'], deployment: 'נימבוס רובד 1 (Gemini Enterprise) / רובד 5 (Enabley)', privacyFitNote: 'מסמכים נשארים בסביבת הנימבוס של המשרד.' },
        ],
        risks: [
          { area: 'אימוץ', risk: 'עובדים ותיקים לא משתמשים.', mitigation: 'שגרירי AI בכל רשם, הדרכות קצרות, מדידת שימוש חודשית.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.6, processTimeShare: 0.25, adoptionRate: 60, efficiencyGain: 25, hitlOverhead: 20, realizationRate: 35, monthlyLicensePerUserIls: 95, oneTimeImplementationCostIls: 150000, trainingCostPerUserIls: 700, annualMaintenancePct: 5 },
      },
    ],
    kpis: [
      { id: 'k1', category: 'אימוץ', metricName: 'שיעור הדוחות השנתיים שעוברים חילוץ אוטומטי', q1Target: '10% (פיילוט)', q2Target: '40%', year1Target: '75%', owner: 'מנהל אגף רישום' },
      { id: 'k2', category: 'אימוץ', metricName: 'שיעור פניות ציבור שנסגרות בצ\'אט ללא נציג', q1Target: '15%', q2Target: '35%', year1Target: '50%', owner: 'מנהל המוקד' },
      { id: 'k3', category: 'איכות ודיוק', metricName: 'דיוק חילוץ שדות (מול בדיקת פקיד)', q1Target: '90%', q2Target: '95%', year1Target: '98%', owner: 'מנהל איכות' },
      { id: 'k4', category: 'איכות ודיוק', metricName: 'אירועי זליגת מידע אישי לכלי AI לא מאושר', q1Target: '0', q2Target: '0', year1Target: '0', owner: 'ממונה אבטחת מידע' },
      { id: 'k5', category: 'עסקי ופיננסי', metricName: 'זמן טיפול ממוצע בבקשת רישום (ימים)', q1Target: 'קו בסיס', q2Target: 'קיצור 20%', year1Target: 'קיצור 40%', owner: 'מנכ"לית הרשות' },
      { id: 'k6', category: 'עסקי ופיננסי', metricName: 'תיקי אכיפה שנפתחו מתעדוף מודל והסתיימו בממצא', q1Target: 'קו בסיס', q2Target: '+15%', year1Target: '+30%', owner: 'מנהל אגף אכיפה' },
      { id: 'k7', category: 'עסקי ופיננסי', metricName: 'זמן המתנה ממוצע במוקד (דקות)', q1Target: 'קו בסיס', q2Target: '-25%', year1Target: '-45%', owner: 'מנהל המוקד' },
    ],
    governanceChecklist: [
      { id: 'g1', category: 'אבטחת מידע ופרטיות', title: 'אישור יחידת הסייבר הממשלתית ו-DPO לכל כלי', description: 'תיעוד זרימת המידע, מיקום בנימבוס, והתממה לפני מודלים כלליים.', priority: 'חובה', completed: false },
      { id: 'g2', category: 'ממשל תאגידי ורגולציה', title: 'מדיניות "אדם מחליט" להחלטות מנהליות', description: 'אף החלטה בעלת תוקף משפטי אינה מתקבלת אוטומטית; תיעוד נימוקים.', priority: 'חובה', completed: false },
      { id: 'g3', category: 'ממשל תאגידי ורגולציה', title: 'שקיפות לציבור על שימוש ב-AI', description: 'הודעה באתר ובצ\'אט, ערוץ דיווח על טעויות, דוח שנתי.', priority: 'חובה', completed: false },
      { id: 'g4', category: 'ממשל תאגידי ורגולציה', title: 'רכש דרך נימבוס רובד 1 / רובד 5 בלבד', description: 'בדיקת הקטלוג המאושר לפני כל התקשרות; אין SaaS מחוץ לנימבוס.', priority: 'חובה', completed: false },
      { id: 'g5', category: 'הכשרת עובדים ושינוי ארגוני', title: 'הכשרת AI לכל העובדים ושגרירי AI בכל רשם', description: 'מודול חובה של 3 שעות ו-12 שגרירים.', priority: 'חובה', completed: false },
      { id: 'g6', category: 'הכשרת עובדים ושינוי ארגוני', title: 'תוכנית ניהול שינוי עם ועד העובדים', description: 'הצגת היוזמות, התחייבות שאין פיטורים כתוצאה ישירה, ניתוב זמן שהתפנה.', priority: 'מומלץ', completed: false },
    ],
    sources: [
      { title: 'רשימת השירותים המאושרים לרכישה ברובד 5 בנימבוס (04.08.2026)', uri: 'https://www.gov.il/he/departments/topics/nimbus' },
      { title: 'מערך הדיגיטל הלאומי: מדיניות בינה מלאכותית בממשלה', uri: 'https://www.gov.il/he/departments/digital_israel' },
    ],
  },
};

const LAW_FIRM: Preset = {
  id: 'ariel-nevo-law',
  title: 'משרד עורכי דין אריאל נבו',
  subtitle: 'משרד מקצועי קטן · משפט מסחרי, רגולציה וטכנולוגיה · 12 אנשי צוות',
  icon: 'law',
  profile: {
    orgName: 'משרד עורכי דין אריאל נבו',
    orgType: 'private',
    sector: 'שירותים משפטיים: משפט מסחרי, רגולציה, טכנולוגיה ופרטיות',
    relevantEmployees: 12,
    avgHourlyCostIls: 380,
    sensitivity: 'high',
    cloudConstraint: 'private-cloud',
    dataMaturity: 2,
    bottlenecks: ['ניתוח מסמכים, חוזים ותיקים', 'ניהול ידע, הדרכה ותפעול', 'שירות לקוחות ופניות ציבור', 'שיווק, מכירות וגיוס'],
    freeTextContext:
      '7 עורכי דין, 2 מתמחים, 3 אנשי מינהל. העבודה: ניסוח ובדיקת חוזים, חוות דעת רגולטוריות, ליווי חברות טכנולוגיה, ייצוג בהליכים. חיסיון עורך דין-לקוח וחוק הגנת הפרטיות מחייבים שהמידע לא יישמר ולא ישמש לאימון. אין צוות IT; המשרד עובד עם Microsoft 365 ומאגרי נבו ותקדין. שעות עבודה יקרות ושעות שמתפנות ניתנות לחיוב או למכירה.',
  },
  analysis: {
    executiveSummary:
      'במשרד קטן הערך ישיר: כל שעה שמתפנה היא שעת חיוב, ולכן שיעור המימוש גבוה מהרגיל. שלוש ההזדמנויות המובילות הן סקירת חוזים ומסמכים, מחקר משפטי בעברית, וניסוח טיוטות. כולן נרכשות ככלי מדף עם חוזה Zero Data Retention. פיתוח עצמי מוצדק במקום אחד בלבד: ניהול ידע על ארכיון התיקים של המשרד, וגם אותו כדאי לבנות על פלטפורמה מנוהלת. האתגר הוא משמעת: מדיניות שימוש, בדיקת ציטוטים, ושקיפות מול לקוחות.',
    initiatives: [
      {
        id: 'law-1',
        title: 'סקירת חוזים ומסמכים: סיכונים, סטיות מתקן והשוואת גרסאות',
        problemAndSolution:
          'עורכי הדין קוראים מאות עמודי חוזים ומסמכי גילוי. כלי AI משפטי מסמן סעיפים חריגים מול הפלייבוק של המשרד, משווה גרסאות ומייצר טבלת סיכונים, ועורך הדין מאשר.',
        strategicRecommendation: 'buy',
        recommendationRationale: 'Harvey, Spellbook ו-Copilot עם ZDR בוגרים ומיועדים למשרדים. אין טעם לפתח.',
        dataDependency: 'low',
        effortScore: 2,
        impactScore: 9,
        estimatedWeeks: 4,
        recommendedTools: [
          { category: 'AI משפטי: חוזים וסקירת מסמכים', tools: ['Harvey / Spellbook', 'Microsoft 365 Copilot'], deployment: 'SaaS ארגוני עם Zero Data Retention', privacyFitNote: 'נדרש הסכם סודיות ו-ZDR חתום; יידוע הלקוח בהסכם ההתקשרות.' },
        ],
        risks: [
          { area: 'חיסיון', risk: 'העלאת מסמך לקוח לכלי ללא הסכם מתאים.', mitigation: 'רשימת כלים מאושרים, חסימת כלים אחרים, סעיף בהסכם שכר הטרחה.' },
          { area: 'דיוק', risk: 'סעיף מסוכן שלא סומן.', mitigation: 'הכלי משלים קריאה ואינו מחליף; צ\'קליסט אנושי לכל חוזה.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.75, processTimeShare: 0.4, adoptionRate: 80, efficiencyGain: 35, hitlOverhead: 20, realizationRate: 70, monthlyLicensePerUserIls: 450, oneTimeImplementationCostIls: 15000, trainingCostPerUserIls: 1500, annualMaintenancePct: 0 },
      },
      {
        id: 'law-2',
        title: 'מחקר משפטי בעברית: פסיקה, חקיקה ורגולציה',
        problemAndSolution:
          'מחקר משפטי אורך שעות והשאלות הרגולטוריות (פרטיות, AI, פינטק) משתנות מהר. מאגרים ישראליים עם שכבת AI מסכמים פסיקה עם ציטוטים מאומתים; עוזר כללי משמש לניתוח רגולציה זרה.',
        strategicRecommendation: 'buy',
        recommendationRationale: 'המשרד כבר מנוי על המאגרים; שדרוג לשכבת AI זול יחסית לערך.',
        dataDependency: 'low',
        effortScore: 1,
        impactScore: 7,
        estimatedWeeks: 2,
        recommendedTools: [
          { category: 'AI משפטי: מחקר ופסיקה', tools: ['נבו AI / תקדין AI / דינים', 'ChatGPT Enterprise / Claude for Enterprise'], deployment: 'SaaS; העוזר הכללי רק עם ZDR', privacyFitNote: 'שאילתות מחקר אינן כוללות פרטי לקוח מזהים.' },
        ],
        risks: [
          { area: 'דיוק', risk: 'ציטוט פסק דין שאינו קיים.', mitigation: 'בדיקת כל ציטוט במאגר המקורי לפני הגשה; חובה גם למתמחים.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.75, processTimeShare: 0.2, adoptionRate: 85, efficiencyGain: 40, hitlOverhead: 15, realizationRate: 65, monthlyLicensePerUserIls: 320, oneTimeImplementationCostIls: 5000, trainingCostPerUserIls: 800, annualMaintenancePct: 0 },
      },
      {
        id: 'law-3',
        title: 'ניסוח טיוטות: כתבי טענות, חוות דעת ומכתבים',
        problemAndSolution:
          'טיוטה ראשונה של מכתב התראה, חוות דעת או הסכם סטנדרטי לוקחת שעות. עוזר כתיבה עם תבניות המשרד מייצר טיוטה בסגנון המשרד ועורך הדין משכתב.',
        strategicRecommendation: 'buy',
        recommendationRationale: 'Copilot בתוך Word שבו המשרד כבר עובד, או Claude for Enterprise עם Projects לתבניות.',
        dataDependency: 'medium',
        effortScore: 2,
        impactScore: 8,
        estimatedWeeks: 3,
        recommendedTools: [
          { category: 'עוזר כללי ארגוני', tools: ['Microsoft 365 Copilot', 'ChatGPT Enterprise / Claude for Enterprise'], deployment: 'SaaS ארגוני עם Zero Data Retention', privacyFitNote: 'תבניות אנונימיות; פרטי לקוח מוזנים רק בכלי עם ZDR חתום.' },
        ],
        risks: [
          { area: 'איכות', risk: 'טיוטה גנרית בסגנון לא מתאים.', mitigation: 'ספריית 20 תבניות משרדיות מאושרות, סגנון אחיד בפרומפט.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.9, processTimeShare: 0.3, adoptionRate: 75, efficiencyGain: 35, hitlOverhead: 25, realizationRate: 60, monthlyLicensePerUserIls: 115, oneTimeImplementationCostIls: 8000, trainingCostPerUserIls: 600, annualMaintenancePct: 0 },
      },
      {
        id: 'law-4',
        title: 'ניהול ידע משרדי: חיפוש וסיכום על ארכיון התיקים',
        problemAndSolution:
          'הידע של המשרד יושב בתיקיות ובזיכרון של השותפים. מנוע RAG על ארכיון המסמכים (בהרשאות) מאפשר לשאול "איך ניסחנו סעיף אי-תחרות בעסקת SaaS ב-2024" ולקבל תשובה עם קישור למסמך.',
        strategicRecommendation: 'build',
        recommendationRationale: 'הערך כולו בדאטה של המשרד. לבנות על פלטפורמה מנוהלת (Azure OpenAI או Bedrock בתוך המנוי של המשרד) עם ספק אינטגרציה, לא לפתח מאפס.',
        dataDependency: 'high',
        effortScore: 6,
        impactScore: 7,
        estimatedWeeks: 12,
        recommendedTools: [
          { category: 'פלטפורמת מודלים (Build)', tools: ['Azure OpenAI (Private Endpoint)', 'Claude / Nova on Amazon Bedrock'], deployment: 'ענן פרטי במנוי של המשרד', privacyFitNote: 'המסמכים לא יוצאים מהמנוי; הרשאות לפי תיק; לוג גישה.' },
        ],
        risks: [
          { area: 'הרשאות', risk: 'עובד רואה תיק שאינו שלו (חומות סיניות).', mitigation: 'הרשאות בירושה מהתיקיות, בדיקה לפני הפעלה.' },
          { area: 'תחזוקה', risk: 'אין IT פנימי.', mitigation: 'חוזה תחזוקה שנתי עם הספק, 15% מעלות ההקמה.' },
        ],
        financialDefaults: { affectedEmployeesShare: 0.9, processTimeShare: 0.15, adoptionRate: 70, efficiencyGain: 30, hitlOverhead: 15, realizationRate: 55, monthlyLicensePerUserIls: 60, oneTimeImplementationCostIls: 120000, trainingCostPerUserIls: 500, annualMaintenancePct: 15 },
      },
      {
        id: 'law-5',
        title: 'אינטייק לקוחות, סיכומי פגישות ומעקב משימות',
        problemAndSolution:
          'פגישות ייעוץ מסתכמות ידנית ומשימות נופלות בין הכיסאות. תמלול וסיכום פגישות (בהסכמת הלקוח) עם רשימת משימות אוטומטית, וטופס אינטייק חכם שמכין את התיק לפני הפגישה הראשונה.',
        strategicRecommendation: 'buy',
        recommendationRationale: 'Copilot ב-Teams או כלי תמלול עברי עם ZDR; אוטומציה פשוטה ב-Power Automate.',
        dataDependency: 'low',
        effortScore: 3,
        impactScore: 5,
        estimatedWeeks: 4,
        recommendedTools: [
          { category: 'תמלול וסיכום שיחות', tools: ['Microsoft 365 Copilot', 'Koldan (Dixilang) / Meeting Insights'], deployment: 'SaaS ארגוני עם ZDR', privacyFitNote: 'הקלטה רק בהסכמה מפורשת של הלקוח; מחיקה אחרי הפקת הסיכום.' },
        ],
        risks: [
          { area: 'אתיקה', risk: 'הקלטת לקוח ללא הסכמה.', mitigation: 'הסכמה כתובה בטופס האינטייק; ברירת מחדל ללא הקלטה.' },
        ],
        financialDefaults: { affectedEmployeesShare: 1, processTimeShare: 0.12, adoptionRate: 70, efficiencyGain: 40, hitlOverhead: 15, realizationRate: 45, monthlyLicensePerUserIls: 115, oneTimeImplementationCostIls: 10000, trainingCostPerUserIls: 400, annualMaintenancePct: 0 },
      },
    ],
    kpis: [
      { id: 'k1', category: 'אימוץ', metricName: 'עורכי דין שמשתמשים בכלי מאושר בכל תיק חדש', q1Target: '50%', q2Target: '80%', year1Target: '100%', owner: 'השותף המנהל' },
      { id: 'k2', category: 'איכות ודיוק', metricName: 'ציטוטים שנבדקו במקור לפני הגשה', q1Target: '100%', q2Target: '100%', year1Target: '100%', owner: 'כל עורך דין' },
      { id: 'k3', category: 'איכות ודיוק', metricName: 'אירועי העלאת מידע לקוח לכלי לא מאושר', q1Target: '0', q2Target: '0', year1Target: '0', owner: 'השותף המנהל' },
      { id: 'k4', category: 'עסקי ופיננסי', metricName: 'שעות חיוב לעורך דין לחודש', q1Target: 'קו בסיס', q2Target: '+8%', year1Target: '+15%', owner: 'מנהלת המשרד' },
      { id: 'k5', category: 'עסקי ופיננסי', metricName: 'זמן ממוצע לסקירת חוזה (שעות)', q1Target: 'קו בסיס', q2Target: '-30%', year1Target: '-45%', owner: 'השותף המנהל' },
      { id: 'k6', category: 'עסקי ופיננסי', metricName: 'שביעות רצון לקוחות ממהירות מענה', q1Target: 'קו בסיס', q2Target: '+0.3', year1Target: '+0.5', owner: 'מנהלת המשרד' },
    ],
    governanceChecklist: [
      { id: 'g1', category: 'אבטחת מידע ופרטיות', title: 'הסכמי Zero Data Retention וסודיות עם כל ספק', description: 'אי-אימון, מחיקה, מיקום שרתים, והתאמה לחוק הגנת הפרטיות ותיקון 13.', priority: 'חובה', completed: false },
      { id: 'g2', category: 'ממשל תאגידי ורגולציה', title: 'מדיניות שימוש ב-AI במשרד לפי כללי לשכת עורכי הדין', description: 'כלים מאושרים, בדיקת ציטוטים, אחריות עורך הדין על כל תוצר.', priority: 'חובה', completed: false },
      { id: 'g3', category: 'ממשל תאגידי ורגולציה', title: 'יידוע לקוחות בהסכם שכר הטרחה', description: 'סעיף שקיפות על שימוש בכלי AI והגנת המידע.', priority: 'חובה', completed: false },
      { id: 'g4', category: 'הכשרת עובדים ושינוי ארגוני', title: 'הכשרה של חצי יום לכל הצוות ומתמחים', description: 'כולל תרגול על חוזה אמיתי מותמם.', priority: 'חובה', completed: false },
      { id: 'g5', category: 'הכשרת עובדים ושינוי ארגוני', title: 'סקירה רבעונית של מה עובד ומה לא', description: 'שעה בישיבת שותפים עם נתוני שימוש וחיוב.', priority: 'מומלץ', completed: false },
    ],
    sources: [
      { title: 'לשכת עורכי הדין: הנחיות לשימוש בבינה מלאכותית', uri: 'https://www.israelbar.org.il' },
      { title: 'הרשות להגנת הפרטיות: שימוש במערכות AI וחוק הגנת הפרטיות', uri: 'https://www.gov.il/he/departments/the_privacy_protection_authority' },
    ],
  },
};

export const PRESETS: Preset[] = [HUJI, CORP_AUTHORITY, LAW_FIRM];

/** Pick the preset closest to a profile (used as the LLM fallback). */
export function closestPreset(profile: Pick<OrganizationProfile, 'orgType' | 'cloudConstraint' | 'relevantEmployees'>): Preset {
  if (profile.orgType === 'government' || profile.cloudConstraint === 'nimbus') return CORP_AUTHORITY;
  if (profile.orgType === 'academic') return HUJI;
  if (profile.relevantEmployees <= 60) return LAW_FIRM;
  return HUJI;
}
