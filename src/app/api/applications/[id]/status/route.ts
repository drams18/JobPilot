import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { ApplicationStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const { status, note } = await request.json();

  const app = await prisma.application.findFirst({ where: { id, userId: user.userId } });
  if (!app) return NextResponse.json({ message: 'Introuvable' }, { status: 404 });

  const [updated] = await Promise.all([
    prisma.application.update({
      where: { id },
      data: {
        status: status as ApplicationStatus,
        appliedAt: status === 'APPLIED' && !app.appliedAt ? new Date() : undefined,
      },
    }),
    prisma.applicationEvent.create({
      data: {
        applicationId: id,
        eventType: 'STATUS_CHANGED',
        detailsJson: { from: app.status, to: status, note },
      },
    }),
  ]);

  return NextResponse.json(updated);
}
