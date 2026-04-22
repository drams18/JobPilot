import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const [statusGroups, matchScores, recentApplications] = await Promise.all([
    prisma.application.groupBy({
      by: ['status'],
      where: { userId: user.userId },
      _count: { status: true },
    }),
    prisma.jobMatchScore.findMany({
      where: { userId: user.userId },
      select: { score: true },
    }),
    prisma.application.findMany({
      where: { userId: user.userId },
      take: 5,
      orderBy: { appliedAt: 'desc' },
      include: {
        jobOffer: { select: { title: true, company: true } },
      },
    }),
  ]);

  const total = statusGroups.reduce((sum, g) => sum + g._count.status, 0);

  const activeStatuses = ['APPLIED', 'IN_REVIEW', 'INTERVIEW_SCHEDULED'];
  const active = statusGroups
    .filter((g) => activeStatuses.includes(g.status))
    .reduce((sum, g) => sum + g._count.status, 0);

  const respondedStatuses = ['IN_REVIEW', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'REJECTED'];
  const responded = statusGroups
    .filter((g) => respondedStatuses.includes(g.status))
    .reduce((sum, g) => sum + g._count.status, 0);

  const applied = statusGroups
    .filter((g) => g.status !== 'DRAFT')
    .reduce((sum, g) => sum + g._count.status, 0);

  const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : 0;

  const averageMatchScore =
    matchScores.length > 0
      ? Math.round(matchScores.reduce((s, m) => s + m.score, 0) / matchScores.length)
      : 0;

  return NextResponse.json({
    totalApplications: total,
    activeApplications: active,
    responseRate,
    averageMatchScore,
    recentApplications,
  });
}
