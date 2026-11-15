import type { OrganizationProfile } from '../../src/types/strategy';
import { CLOUD_CONSTRAINT_LABELS, ORG_TYPE_LABELS, SENSITIVITY_LABELS } from '../../src/types/strategy';
import { catalogForPrompt } from '../../src/data/toolCatalog';
import { NIMBUS_AI_SERVICES, NIMBUS_CATEGORY_LABELS, NIMBUS_TIER1_AI } from '../../src/data/nimbus';

/**
 * The model gets three things: the organisation, the curated tool catalog
 * (with deployment/privacy fit already computed), and, for Nimbus-bound
 * organisations, the approved tier-1/tier-5 services. It is asked for
 * judgement, not for arithmetic: all money is computed client-side.
 */
export function buildPrompt(profile: OrganizationProfile): { system: string; user: string } {
  const sens = SENSITIVITY_LABELS[profile.sensitivity];
  const nimbusBound = profile.cloudConstraint === 'nimbus' || profile.orgType === 'government';

  const nimbusBlock = nimbusBound
    ? `
## נימבוס (הענן הממשלתי): מה מותר לרכוש
רובד 1 (שירותי ענן נייטיב):
${NIMBUS_TIER1_AI.map((s) => `- ${s.platform}: ${s.name} — ${s.useFor}`).join('\n')}

רובד 5 (שירותי צד ג' מאושרים, מתוך הרשימה הרשמית מ-04.08.2026; רלוונטיים ל-AI ולדאטה):
${NIMBUS_AI_SERVICES.map((s) => `- [${s.platform}] ${s.name} (${s.vendor}) · ${NIMBUS_CATEGORY_LABELS[s.category]} · ${s.description.slice(0, 110)}`).join('\n')}

כלל: לארגון זה מומלץ רק מה שברובד 1, ברובד 5, או מקומי. אל תמליץ על SaaS שאינו ברשימה.`
    : '';

  const system = `אתה יועץ בכיר לאסטרטגיית AI לארגונים בישראל. אתה כותב בעברית תקנית, מנהלית וקצרה, בסגנון מצגת הנהלה.
כללים:
1. אל תחשב כסף. תן רק הנחות פיננסיות התחלתיות (financialDefaults) שהסימולטור יחשב מהן.
2. המלץ רק על כלים מתוך הקטלוג שסופק. אם אף כלי לא מתאים, כתוב זאת במפורש.
3. לכל יוזמה: buy / build / hybrid לפי שלושה קריטריונים: האם התהליך רוחבי או ליבה, כמה מהערך תלוי בדאטה פנימי (dataDependency), ומגבלת הענן ורגישות המידע.
4. פזר את היוזמות על מטריצת מאמץ-אימפקט: לפחות יוזמה אחת Quick Win (מאמץ ≤3, אימפקט ≥7) ולפחות אחת אסטרטגית (מאמץ ≥6).
5. הנחות פיננסיות ריאליות: adoptionRate 40–85, efficiencyGain 15–45, hitlOverhead 10–35, realizationRate 25–70 (גבוה יותר כשהשעות ניתנות לחיוב או כשמוחלפים ספקים), monthlyLicensePerUserIls לפי הקטלוג, oneTimeImplementationCostIls 5,000–1,500,000 לפי גודל הארגון, trainingCostPerUserIls 400–3,000, annualMaintenancePct 0–20 (0 ל-SaaS טהור, 15–20 לפיתוח).
6. מזהים (id) באנגלית קצרים: init-1, kpi-1, gov-1.
7. ענה אך ורק ב-JSON לפי הסכמה.`;

  const user = `## פרופיל הארגון
- שם: ${profile.orgName}
- סוג: ${ORG_TYPE_LABELS[profile.orgType]}
- מגזר ותחום: ${profile.sector}
- עובדים רלוונטיים: ${profile.relevantEmployees}
- עלות שעת עבודה ממוצעת: ₪${profile.avgHourlyCostIls}
- רגישות מידע: ${sens.title} (${sens.sub})
- מגבלת ענן: ${CLOUD_CONSTRAINT_LABELS[profile.cloudConstraint]}
- בשלות דאטה: ${profile.dataMaturity}/5
- צווארי בקבוק: ${profile.bottlenecks.join(', ') || 'לא צוינו'}
- תיאור מהמנהל: ${profile.freeTextContext || 'לא צוין'}
${profile.uploadedTextContent ? `\n## מסמך רקע שהועלה (${profile.uploadedFileName ?? 'קובץ'}), ${profile.uploadedTextContent.length} תווים:\n${profile.uploadedTextContent}` : ''}

## קטלוג כלים (עם התאמה למגבלות הארגון)
${catalogForPrompt(profile.sensitivity, profile.cloudConstraint)}
${nimbusBlock}

## המשימה
הפק: executiveSummary (3–4 משפטים), 4–6 initiatives, 5–7 kpis (קטגוריות: אימוץ / איכות ודיוק / עסקי ופיננסי), 4–6 governanceChecklist (קטגוריות: אבטחת מידע ופרטיות / ממשל תאגידי ורגולציה / הכשרת עובדים ושינוי ארגוני).`;

  return { system, user };
}
