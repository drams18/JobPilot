import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { ApplicationStatus } from '@prisma/client';
import { getFolder } from '@/lib/application-state';

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as ApplicationStatus | null;
  const page = Number(searchParams.get('page') || 1);
  const limit = Math.min(Number(searchParams.get('limit') || 200), 500);

  const where: Record<string, unknown> = { userId: user.userId };
  if (status) where.status = status;

  const applications = await prisma.application.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
    include: {
      jobOffer: { select: { id: true, title: true, company: true, location: true, jobUrl: true } },
      resume: { select: { id: true, fileName: true } },
    },
  });

  // Attach match scores if available
  const matchScores = await prisma.jobMatchScore.findMany({
    where: {
      userId: user.userId,
      jobOfferId: { in: applications.map((a) => a.jobOfferId) },
    },
    select: { jobOfferId: true, resumeId: true, score: true },
  });
  const scoreMap = new Map(matchScores.map((s) => [`${s.jobOfferId}:${s.resumeId}`, s.score]));

  const result = applications.map((app) => ({
    ...app,
    folder: getFolder(app.status),
    matchScore: scoreMap.get(`${app.jobOfferId}:${app.resumeId}`) ?? null,
  }));

  return NextResponse.json(result);
}
