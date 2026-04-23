import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const { id } = await params;

  const resume = await prisma.resume.findFirst({
    where: { id, userId: user.userId },
  });

  if (!resume) {
    return NextResponse.json({ message: 'CV introuvable' }, { status: 404 });
  }

  const versions = await prisma.resumeVersion.findMany({
    where: { resumeId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true, jobText: true, optimizedJson: true },
  });

  return NextResponse.json(versions);
}
