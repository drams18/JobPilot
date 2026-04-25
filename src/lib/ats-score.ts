import type { ParsedResumeJson } from './cv-parser';

export interface ATSScoreResult {
  score: number;
  missingKeywords: string[];
}

// Words to ignore when computing ATS score (stop words)
const STOP_WORDS = new Set([
  'the', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'of', 'a', 'an',
  'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'not',
  'we', 'you', 'your', 'our', 'their', 'its', 'this', 'that', 'these', 'those',
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'en', 'et', 'ou', 'est',
  'sont', 'par', 'sur', 'dans', 'avec', 'pour', 'qui', 'que', 'vous', 'nous',
]);

export function computeATSScore(resume: ParsedResumeJson, jobText: string): ATSScoreResult {
  const words = jobText
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  if (words.length === 0) return { score: 0, missingKeywords: [] };

  const resumeText = JSON.stringify(resume).toLowerCase();

  let match = 0;
  const missing: string[] = [];

  for (const w of words) {
    if (resumeText.includes(w)) {
      match++;
    } else {
      missing.push(w);
    }
  }

  const score = Math.round((match / words.length) * 100);
  const missingKeywords = [...new Set(missing)]
    .filter((w) => w.length > 3)
    .slice(0, 20);

  return { score, missingKeywords };
}
