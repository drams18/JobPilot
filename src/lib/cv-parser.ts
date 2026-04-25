export interface ParsedResumeJson {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  skills?: string[];
  experiences?: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
}

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d[\d\s.\-()]{7,14}\d)/;
const LINKEDIN_RE = /linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i;

const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Express', 'NestJS',
  'Next.js', 'Python', 'Django', 'FastAPI', 'Java', 'Spring', 'PHP', 'Laravel', 'Symfony',
  'Go', 'Rust', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'CI/CD', 'Linux', 'Tailwind',
  'React Native', 'Flutter', 'HTML', 'CSS', 'Sass', 'Webpack', 'Vite', 'Jest', 'Cypress',
  'Prisma', 'Sequelize', 'TypeORM', 'Firebase', 'Supabase', 'Vercel', 'Netlify',
];

const SECTION_PATTERNS = {
  skills: /compétences|skills|technologies|outils|tools|expertise/i,
  experience: /expérience|experience|emploi|work history|parcours professionnel/i,
  education: /formation|education|études|diplôme|cursus|scolarité/i,
  summary: /profil|résumé|summary|à propos|about|objectif|introduction/i,
};

function detectSkills(text: string): string[] {
  return KNOWN_SKILLS.filter((skill) =>
    new RegExp(`(?:^|[^a-zA-Z])${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^a-zA-Z]|$)`, 'i').test(text)
  );
}

function extractSection(
  lines: string[],
  sectionKey: keyof typeof SECTION_PATTERNS,
  stopPatterns: RegExp[],
): string[] {
  const sectionPat = SECTION_PATTERNS[sectionKey];
  let inSection = false;
  const result: string[] = [];

  for (const line of lines) {
    if (!inSection && sectionPat.test(line) && line.length < 60) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (stopPatterns.some((p) => p.test(line) && line.length < 60)) break;
      if (line.trim()) result.push(line.trim());
    }
  }
  return result;
}

function parseExperiences(lines: string[]): ParsedResumeJson['experiences'] {
  const DATE_RE = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|jan|fév|mar|avr|mai|jun|juil|aoû|sep|oct|nov|déc)\.?\s*\d{4}|\d{4}/i;
  const RANGE_RE = /(\w+\.?\s*\d{4})\s*[-–—]\s*(\w+\.?\s*\d{4}|présent|present|aujourd'hui|current)/i;
  const BULLET_RE = /^[•\-\*•]\s+|^\d+\.\s+/;

  const sectionPat = SECTION_PATTERNS.experience;
  const stopPats = [SECTION_PATTERNS.education, SECTION_PATTERNS.skills];

  let inSection = false;
  const expLines: string[] = [];

  for (const line of lines) {
    if (sectionPat.test(line) && line.length < 60) { inSection = true; continue; }
    if (inSection) {
      if (stopPats.some((p) => p.test(line) && line.length < 60)) break;
      expLines.push(line);
    }
  }

  const experiences: NonNullable<ParsedResumeJson['experiences']> = [];
  let current: typeof experiences[0] | null = null;

  for (const line of expLines) {
    const rangeMatch = line.match(RANGE_RE);
    if (rangeMatch || (DATE_RE.test(line) && line.length < 100 && !BULLET_RE.test(line))) {
      if (current) experiences.push(current);
      const datelessParts = line
        .replace(RANGE_RE, '')
        .replace(DATE_RE, '')
        .split(/\s{2,}|\|/)
        .map((p) => p.trim())
        .filter(Boolean);
      current = {
        company: datelessParts[0] ?? '',
        role: datelessParts[1] ?? '',
        startDate: rangeMatch?.[1] ?? '',
        endDate: rangeMatch?.[2] ?? '',
        bullets: [],
      };
    } else if (current) {
      if (BULLET_RE.test(line)) {
        current.bullets.push(line.replace(BULLET_RE, '').trim());
      } else if (!current.role && line.length < 80) {
        current.role = line.trim();
      }
    }
  }
  if (current) experiences.push(current);
  return experiences;
}

function parseEducation(lines: string[]): ParsedResumeJson['education'] {
  const eduLines = extractSection(lines, 'education', [
    SECTION_PATTERNS.experience,
    SECTION_PATTERNS.skills,
  ]);
  const YEAR_RE = /\b(19|20)\d{2}\b/;
  const education: NonNullable<ParsedResumeJson['education']> = [];
  let current: typeof education[0] | null = null;

  for (const line of eduLines) {
    if (YEAR_RE.test(line)) {
      if (current) education.push(current);
      current = {
        institution: '',
        degree: line.replace(YEAR_RE, '').trim(),
        year: line.match(YEAR_RE)?.[0] ?? '',
      };
    } else if (current) {
      if (!current.institution) current.institution = line;
      else if (!current.degree) current.degree = line;
    } else {
      current = { institution: line, degree: '', year: '' };
    }
  }
  if (current) education.push(current);
  return education;
}

export function parseResumeLocal(rawText: string): ParsedResumeJson {
  const text = rawText.replace(/\s+/g, ' ').trim();
  const lines = rawText.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);

  const email = text.match(EMAIL_RE)?.[0];
  const phone = text.match(PHONE_RE)?.[0]?.trim();
  const linkedin = text.match(LINKEDIN_RE)?.[0];

  const name = lines.slice(0, 6).find((l) => {
    const t = l.trim();
    return (
      t.length >= 3 &&
      t.length <= 60 &&
      !/\d/.test(t) &&
      !EMAIL_RE.test(t) &&
      !PHONE_RE.test(t) &&
      !LINKEDIN_RE.test(t)
    );
  });

  const nameIdx = name ? lines.findIndex((l) => l.trim() === name.trim()) : -1;
  const title =
    nameIdx >= 0
      ? lines.slice(nameIdx + 1, nameIdx + 4).find((l) => {
          const t = l.trim();
          return t.length >= 3 && t.length <= 80 && !EMAIL_RE.test(t) && !PHONE_RE.test(t);
        })
      : undefined;

  const summaryLines = extractSection(lines, 'summary', [
    SECTION_PATTERNS.experience,
    SECTION_PATTERNS.education,
    SECTION_PATTERNS.skills,
  ]);
  const summary = summaryLines.join(' ').slice(0, 500);

  const skills = detectSkills(text);
  const experiences = parseExperiences(lines);
  const education = parseEducation(lines);

  return { name, title, email, phone, linkedin, summary, skills, experiences, education };
}
