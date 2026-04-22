import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const resume = await prisma.resume.findFirst({ where: { id, userId: user.userId } });
  if (!resume) return NextResponse.json({ message: 'Introuvable' }, { status: 404 });

  await prisma.$transaction([
    prisma.resume.updateMany({
      where: { userId: user.userId },
      data: { isDefault: false },
    }),
    prisma.resume.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);

  return NextResponse.json({ success: true });
}
