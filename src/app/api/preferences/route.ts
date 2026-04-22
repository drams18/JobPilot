import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { PreferredTone, WorkType } from '@prisma/client';

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: user.userId },
  });

  if (!prefs) {
    return NextResponse.json({
      targetRoles: [],
      targetLocations: [],
      minSalary: null,
      maxSalary: null,
      workType: null,
      preferredTone: 'CONFIDENT',
    });
  }

  return NextResponse.json(prefs);
}

export async function PUT(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const { targetRoles, targetLocations, minSalary, maxSalary, workType, preferredTone } =
    await request.json();

  const prefs = await prisma.userPreferences.upsert({
    where: { userId: user.userId },
    update: {
      targetRoles: targetRoles ?? [],
      targetLocations: targetLocations ?? [],
      minSalary: minSalary ?? null,
      maxSalary: maxSalary ?? null,
      workType: (workType as WorkType) || null,
      preferredTone: (preferredTone as PreferredTone) ?? 'CONFIDENT',
    },
    create: {
      userId: user.userId,
      targetRoles: targetRoles ?? [],
      targetLocations: targetLocations ?? [],
      minSalary: minSalary ?? null,
      maxSalary: maxSalary ?? null,
      workType: (workType as WorkType) || null,
      preferredTone: (preferredTone as PreferredTone) ?? 'CONFIDENT',
    },
  });

  return NextResponse.json(prefs);
}
