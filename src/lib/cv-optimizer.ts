import { type ParsedResumeJson, SKILL_KEYWORDS } from './cv-parser';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractJobKeywords(jobText: string): string[] {
  return SKILL_KEYWORDS.filter((skill) =>
    new RegExp(`(?:^|[^a-zA-Z])${escapeRegex(skill)}(?:[^a-zA-Z]|$)`, 'i').test(jobText)
  );
}

function optimizeSkills(existing: string[], jobKeywords: string[]): string[] {
  const existingLower = existing.map((s) => s.toLowerCase());
  const missing = jobKeywords.filter((k) => !existingLower.includes(k.toLowerCase()));
  const rest = existing.filter((s) => !jobKeywords.some((k) => k.toLowerCase() === s.toLowerCase()));
  return [...jobKeywords, ...missing, ...rest];
}

function bulletContainsKeyword(bullet: string, keywords: string[]): boolean {
  return keywords.some((k) =>
    new RegExp(`(?:^|[^a-zA-Z])${escapeRegex(k)}(?:[^a-zA-Z]|$)`, 'i').test(bullet)
  );
}

function optimizeExperiences(
  experiences: ParsedResumeJson['experiences'],
  jobKeywords: string[],
  existingSkills: string[]
): ParsedResumeJson['experiences'] {
  if (jobKeywords.length === 0) return experiences;

  const missingKeywords = jobKeywords.filter(
    (k) => !existingSkills.some((s) => s.toLowerCase() === k.toLowerCase())
  );

  return experiences.map((exp) => {
    const coveredByBullets = new Set(
      exp.bullets.flatMap((b) => jobKeywords.filter((k) => new RegExp(`(?:^|[^a-zA-Z])${escapeRegex(k)}(?:[^a-zA-Z]|$)`, 'i').test(b)))
    );

    const uncoveredKeywords = missingKeywords
      .filter((k) => !coveredByBullets.has(k))
      .slice(0, 3);

    const enrichedBullets = exp.bullets.map((bullet) => {
      if (!bulletContainsKeyword(bullet, jobKeywords)) return bullet;
      return bullet;
    });

    if (uncoveredKeywords.length > 0) {
      enrichedBullets.push(`Environnement technique : ${uncoveredKeywords.join(', ')}`);
    }

    return { ...exp, bullets: enrichedBullets };
  });
}

const ROLE_PATTERN = /\b(développeur|ingénieur|engineer|developer|manager|lead|architect|designer|devops|data scientist|analyste|analyst|consultant|fullstack|full-stack|backend|frontend|mobile)\b/i;

function optimizeSummary(summary: string, jobText: string): string {
  const roleMatch = jobText.match(ROLE_PATTERN);
  if (!roleMatch) return summary;
  const role = roleMatch[0];
  if (summary.toLowerCase().includes(role.toLowerCase())) return summary;
  return `${summary} Expérience orientée ${role}.`.trim();
}

export function optimizeResume(parsed: ParsedResumeJson, jobText: string): ParsedResumeJson {
  const jobKeywords = extractJobKeywords(jobText);
  const existingSkills = parsed.skills ?? [];

  const skills = optimizeSkills(existingSkills, jobKeywords);
  const experiences = optimizeExperiences(parsed.experiences ?? [], jobKeywords, existingSkills);
  const summary = optimizeSummary(parsed.summary ?? '', jobText);

  return {
    summary,
    skills,
    experiences,
    education: parsed.education ?? [],
  };
}
