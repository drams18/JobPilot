import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ message: 'Fichier requis' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ message: 'Fichier trop volumineux (max 10MB)' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.split('.').pop() ?? 'bin';
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(join(uploadsDir, filename), buffer);

  const fileUrl = `/uploads/${filename}`;

  let rawText: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedJson: any;

  if (file.name.endsWith('.pdf')) {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const parsed = await pdfParse(buffer);
      rawText = parsed.text;
      parsedJson = extractResumeInfo(parsed.text) as any;
    } catch {
      // continue without parsed content
    }
  }

  const existingCount = await prisma.resume.count({ where: { userId: user.userId } });
  const isDefault = existingCount === 0;

  const resume = await prisma.resume.create({
    data: {
      userId: user.userId,
      fileName: file.name,
      fileUrl,
      rawText,
      parsedJson: parsedJson ?? undefined,
      isDefault,
    },
  });

  return NextResponse.json(resume, { status: 201 });
}

function extractResumeInfo(text: string): Record<string, unknown> {
  const SKILLS = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
    'Java', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
    'Docker', 'Kubernetes', 'AWS', 'Git', 'GraphQL', 'REST',
    'Vue.js', 'Angular', 'Express', 'NestJS', 'Django', 'Spring',
    'CSS', 'HTML', 'Tailwind', 'Figma', 'Agile', 'Scrum',
  ];

  const skills = SKILLS.filter((s) => text.toLowerCase().includes(s.toLowerCase()));
  return { skills };
}
