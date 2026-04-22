import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { ApplicationStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as ApplicationStatus | null;
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 20);

  const where: Record<string, unknown> = { userId: user.userId };
  if (status) where.status = status;

  const applications = await prisma.application.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { appliedAt: 'desc' },
    include: {
      jobOffer: { select: { id: true, title: true, company: true, location: true } },
      resume: { select: { id: true, fileName: true } },
    },
  });

  return NextResponse.json(applications);
}
