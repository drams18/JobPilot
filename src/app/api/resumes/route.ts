import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const resumes = await prisma.resume.findMany({
    where: { userId: user.userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      isDefault: true,
      parsedJson: true,
      thumbnail: true,
      createdAt: true,
    },
  });

  return NextResponse.json(resumes);
}
