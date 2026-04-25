import type { ParsedResumeJson } from './cv-parser';

const TECH_KEYWORDS = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Express', 'NestJS',
  'Next.js', 'Python', 'Django', 'FastAPI', 'Java', 'Spring', 'PHP', 'Laravel', 'Symfony',
  'Go', 'Rust', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'CI/CD', 'Linux', 'Tailwind',
  'React Native', 'Flutter', 'HTML', 'CSS', 'Sass', 'Webpack', 'Vite', 'Jest', 'Cypress',
  'Prisma', 'Sequelize', 'TypeORM', 'Firebase', 'Supabase', 'Vercel', 'Netlify',
];

export function optimizeResumeLocal(parsed: ParsedResumeJson, jobText: string): ParsedResumeJson {
  const jobKeywords = TECH_KEYWORDS.filter((k) =>
    new RegExp(`(?:^|[^a-zA-Z])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^a-zA-Z]|$)`, 'i').test(jobText)
  );

  const existingLower = (parsed.skills ?? []).map((s) => s.toLowerCase());
  const jobMatching = jobKeywords.filter((k) =>
    existingLower.includes(k.toLowerCase())
  );
  const missing = jobKeywords.filter((k) => !existingLower.includes(k.toLowerCase()));
  const rest = (parsed.skills ?? []).filter(
    (s) => !jobKeywords.some((k) => k.toLowerCase() === s.toLowerCase())
  );

  // Reorder: job-matching skills first, then rest, then missing (implied by experience)
  const skills = [...jobMatching, ...rest, ...missing];

  return { ...parsed, skills };
}
