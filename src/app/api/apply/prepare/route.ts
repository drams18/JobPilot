import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { PreferredTone } from '@prisma/client';

const SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
  'Java', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'Docker', 'Kubernetes', 'AWS', 'Git', 'GraphQL', 'REST',
  'Vue.js', 'Angular', 'Express', 'NestJS', 'Django', 'Spring',
  'CSS', 'HTML', 'Tailwind', 'Figma', 'Agile', 'Scrum',
];

export async function POST(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const { jobOfferId, resumeId } = await request.json();

  if (!jobOfferId || !resumeId) {
    return NextResponse.json({ message: 'jobOfferId et resumeId requis' }, { status: 400 });
  }

  const [job, resume, userRecord, prefs] = await Promise.all([
    prisma.jobOffer.findUnique({ where: { id: jobOfferId } }),
    prisma.resume.findFirst({ where: { id: resumeId, userId: user.userId } }),
    prisma.user.findUnique({ where: { id: user.userId }, select: { name: true, email: true } }),
    prisma.userPreferences.findUnique({ where: { userId: user.userId } }),
  ]);

  if (!job) return NextResponse.json({ message: 'Offre introuvable' }, { status: 404 });
  if (!resume) return NextResponse.json({ message: 'CV introuvable' }, { status: 404 });

  const { matchScore, suggestions } = computeMatch(job, resume);
  const tone = (prefs?.preferredTone as PreferredTone) ?? 'CONFIDENT';
  const coverLetter = generateCoverLetter(job, userRecord!, tone);

  const existing = await prisma.application.findFirst({
    where: { userId: user.userId, jobOfferId, resumeId },
  });

  const application =
    existing ??
    (await prisma.application.create({
      data: { userId: user.userId, jobOfferId, resumeId, status: 'DRAFT' },
    }));

  await prisma.jobMatchScore.upsert({
    where: { userId_jobOfferId_resumeId: { userId: user.userId, jobOfferId, resumeId } },
    update: {
      score: matchScore.score,
      matchDetailsJson: {
        matchedSkills: matchScore.matchedSkills,
        missingSkills: matchScore.missingSkills,
        locationMatch: matchScore.locationMatch,
      },
      suggestions: { priority: suggestions.priority, items: suggestions.items },
    },
    create: {
      userId: user.userId,
      jobOfferId,
      resumeId,
      score: matchScore.score,
      matchDetailsJson: {
        matchedSkills: matchScore.matchedSkills,
        missingSkills: matchScore.missingSkills,
        locationMatch: matchScore.locationMatch,
      },
      suggestions: { priority: suggestions.priority, items: suggestions.items },
    },
  });

  await prisma.generatedDocument.create({
    data: {
      applicationId: application.id,
      resumeId,
      type: 'COVER_LETTER',
      content: coverLetter,
    },
  });

  return NextResponse.json({
    applicationId: application.id,
    matchScore,
    suggestions,
    coverLetter,
    formFill: {
      name: userRecord?.name ?? '',
      email: user.email,
      position: job.title,
      company: job.company,
    },
  });
}

function computeMatch(job: { title: string; description: string; requirements?: string | null; location?: string | null }, resume: { rawText?: string | null; parsedJson?: unknown }) {
  const jobText = `${job.title} ${job.description} ${job.requirements ?? ''}`.toLowerCase();
  const resumeText = `${resume.rawText ?? ''} ${JSON.stringify(resume.parsedJson ?? '')}`.toLowerCase();

  const jobSkills = SKILLS.filter((s) => jobText.includes(s.toLowerCase()));
  const matchedSkills = jobSkills.filter((s) => resumeText.includes(s.toLowerCase()));
  const missingSkills = jobSkills.filter((s) => !resumeText.includes(s.toLowerCase()));

  const skillScore = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) * 80 : 40;

  const locationMatch =
    !job.location ||
    resumeText.includes((job.location ?? '').toLowerCase()) ||
    resumeText.includes('remote') ||
    (job.location ?? '').toLowerCase().includes('remote');

  const score = Math.min(100, Math.round(skillScore + (locationMatch ? 20 : 0)));
  const priority = score >= 70 ? 'LOW' : score >= 45 ? 'MEDIUM' : 'HIGH';

  const items: string[] = [];
  if (missingSkills.length > 0)
    items.push(`Ajoutez ces compétences à votre CV : ${missingSkills.slice(0, 3).join(', ')}`);
  if (!locationMatch)
    items.push(`Précisez votre disponibilité pour ${job.location}`);
  if (score < 70)
    items.push('Personnalisez votre CV pour mettre en avant les expériences pertinentes');
  if (items.length === 0)
    items.push('Votre profil correspond bien à cette offre !');

  return {
    matchScore: {
      score,
      matchedSkills: matchedSkills.slice(0, 8),
      missingSkills: missingSkills.slice(0, 6),
      locationMatch,
    },
    suggestions: { priority: priority as 'HIGH' | 'MEDIUM' | 'LOW', items },
  };
}

function generateCoverLetter(
  job: { title: string; company: string },
  user: { name: string; email: string },
  tone: PreferredTone,
) {
  const date = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const openings: Record<PreferredTone, string> = {
    FORMAL: `Je me permets de vous adresser ma candidature pour le poste de ${job.title} au sein de ${job.company}.`,
    FRIENDLY: `Votre offre pour le poste de ${job.title} a immédiatement retenu mon attention, et c'est avec enthousiasme que je vous soumets ma candidature.`,
    CONFIDENT: `Fort(e) de mon expérience et de mes compétences, je souhaite rejoindre ${job.company} en tant que ${job.title}.`,
    CONCISE: `Je postule au poste de ${job.title} chez ${job.company}.`,
  };

  return `${date}

Madame, Monsieur,

${openings[tone]}

${job.company} est une entreprise qui m'attire particulièrement, et ce poste correspond parfaitement à mes aspirations professionnelles ainsi qu'à mon parcours.

Au cours de mes expériences passées, j'ai développé des compétences solides qui me permettront de contribuer efficacement à vos projets dès mon intégration. Je suis convaincu(e) que ma motivation et mon adaptabilité seront des atouts précieux pour votre équipe.

Je reste disponible pour un entretien à votre convenance et vous adresse, Madame, Monsieur, mes salutations distinguées.

${user.name}
${user.email}`;
}
