export interface ParsedResumeJson {
  summary: string;
  skills: string[];
  experiences: Array<{
    role: string;
    company: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
}

export const SKILL_KEYWORDS = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Svelte',
  'Node.js', 'Express', 'NestJS', 'Next.js', 'Nuxt',
  'Python', 'Django', 'FastAPI', 'Flask',
  'Java', 'Spring', 'Kotlin',
  'PHP', 'Laravel', 'Symfony',
  'Ruby', 'Rails',
  'C#', '.NET', 'C++', 'Go', 'Rust', 'Swift',
  'SQL', 'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Elasticsearch',
  'GraphQL', 'REST', 'gRPC',
  'Docker', 'Kubernetes', 'Terraform', 'Ansible',
  'AWS', 'GCP', 'Azure', 'Vercel', 'Heroku',
  'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins', 'GitHub Actions',
  'Linux', 'Bash', 'Shell',
  'Tailwind', 'CSS', 'SASS', 'HTML',
  'Figma', 'Sketch', 'Adobe XD',
  'Agile', 'Scrum', 'Kanban', 'Jira',
  'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
  'React Native', 'Flutter', 'iOS', 'Android',
  'Prisma', 'Sequelize', 'TypeORM',
  'Jest', 'Cypress', 'Playwright', 'Vitest',
  'Webpack', 'Vite', 'Rollup',
  'Microservices', 'Serverless', 'WebSockets',
];

const DATE_PATTERN = /\b(jan(?:vier)?|fév(?:rier)?|mar(?:s)?|avr(?:il)?|mai|juin|juil(?:let)?|ao(?:û|u)t|sep(?:tembre)?|oct(?:obre)?|nov(?:embre)?|déc(?:embre)?|january|february|march|april|may|june|july|august|september|october|november|december|20\d{2}|19\d{2})\b/i;

const EDUCATION_PATTERN = /\b(universit[eé]|licence|master|bac(?:helor)?|[eé]cole|diplôme|degree|mba|bts|dut|iut|formation|grande [eé]cole|ing[eé]nieur|doctorat|phd)\b/i;

const BULLET_PATTERN = /^[\s]*[-•*▪▸→]\s+/;

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);
}

function extractSkills(text: string): string[] {
  return SKILL_KEYWORDS.filter((skill) =>
    new RegExp(`(?:^|[^a-zA-Z])${escapeRegex(skill)}(?:[^a-zA-Z]|$)`, 'i').test(text)
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSummary(lines: string[]): string {
  const sentences: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 20) continue;
    if (DATE_PATTERN.test(trimmed)) continue;
    if (/^[\d]/.test(trimmed)) continue;
    sentences.push(trimmed);
    if (sentences.length >= 3) break;
  }
  return sentences.join(' ');
}

function extractExperiences(lines: string[]): ParsedResumeJson['experiences'] {
  const experiences: ParsedResumeJson['experiences'] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (DATE_PATTERN.test(line)) {
      const dateMatch = line.match(/(\d{4}|\w+\s+\d{4})\s*[-–—à]\s*(\d{4}|présent|present|aujourd'hui|current|now|\w+\s+\d{4})/i);
      const startDate = dateMatch?.[1] ?? '';
      const endDate = dateMatch?.[2] ?? '';

      const role = lines[i + 1]?.trim() ?? '';
      const company = lines[i + 2]?.trim() ?? '';

      const bullets: string[] = [];
      let j = i + 3;
      while (j < lines.length && !DATE_PATTERN.test(lines[j].trim())) {
        const bl = lines[j].trim();
        if (BULLET_PATTERN.test(lines[j]) || (bl.length > 20 && !EDUCATION_PATTERN.test(bl))) {
          bullets.push(bl.replace(BULLET_PATTERN, '').trim());
        }
        j++;
        if (bullets.length >= 6 || j - (i + 3) > 10) break;
      }

      if (role.length > 2) {
        experiences.push({ role, company, startDate, endDate, bullets });
        i = j;
        continue;
      }
    }
    i++;
  }

  return experiences;
}

function extractEducation(lines: string[]): ParsedResumeJson['education'] {
  const education: ParsedResumeJson['education'] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (EDUCATION_PATTERN.test(line)) {
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch?.[0] ?? (lines[i + 1]?.match(/\b(19|20)\d{2}\b/)?.[0] ?? '');

      const institution = line;
      const degree = lines[i + 1]?.trim() ?? '';

      education.push({ institution, degree, year });
      i += 1;
    }
  }

  return education;
}

export function parseResume(rawText: string): ParsedResumeJson {
  const lines = splitLines(rawText);
  const skills = extractSkills(rawText);
  const summary = extractSummary(lines);
  const experiences = extractExperiences(lines);
  const education = extractEducation(lines);

  return { summary, skills, experiences, education };
}
