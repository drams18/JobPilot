import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const location = searchParams.get('location');
  const source = searchParams.get('source');
  const resumeId = searchParams.get('resumeId');
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 20);

  const where: Record<string, unknown> = { isActive: true };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { company: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (location) where.location = { contains: location };
  if (source) where.source = source;

  const [total, jobs] = await Promise.all([
    prisma.jobOffer.count({ where }),
    prisma.jobOffer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { scrapedAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        salaryRange: true,
        source: true,
        scrapedAt: true,
        isActive: true,
        ...(resumeId
          ? {
              matchScores: {
                where: { userId: user.userId, resumeId },
                select: { score: true },
                take: 1,
              },
            }
          : {}),
      },
    }),
  ]);

  const data = jobs.map((job: any) => ({
    ...job,
    matchScore: job.matchScores?.[0]?.score ?? null,
    matchScores: undefined,
  }));

  return NextResponse.json({
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
