import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { optimizeResume } from '@/lib/cv-optimizer';
import type { ParsedResumeJson } from '@/lib/cv-parser';

export async function POST(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { resumeId, jobText } = body as { resumeId?: string; jobText?: string };

  if (!resumeId || !jobText) {
    return NextResponse.json({ message: 'resumeId et jobText requis' }, { status: 400 });
  }

  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId: user.userId },
  });

  if (!resume) {
    return NextResponse.json({ message: 'CV introuvable' }, { status: 404 });
  }

  if (!resume.parsedJson) {
    return NextResponse.json(
      { message: 'CV non analysé — veuillez re-uploader votre CV' },
      { status: 400 }
    );
  }

  const optimizedJson = optimizeResume(resume.parsedJson as unknown as ParsedResumeJson, jobText);

  const version = await prisma.resumeVersion.create({
    data: {
      resumeId,
      jobText: jobText.slice(0, 5000),
      optimizedJson: optimizedJson as unknown as import('@prisma/client').Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ optimizedJson, versionId: version.id });
}
