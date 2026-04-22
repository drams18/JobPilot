import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const app = await prisma.application.findFirst({
    where: { id, userId: user.userId },
    include: {
      jobOffer: true,
      resume: true,
      documents: { orderBy: { createdAt: 'desc' } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!app) return NextResponse.json({ message: 'Introuvable' }, { status: 404 });

  return NextResponse.json(app);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const app = await prisma.application.findFirst({ where: { id, userId: user.userId } });
  if (!app) return NextResponse.json({ message: 'Introuvable' }, { status: 404 });

  await prisma.application.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
