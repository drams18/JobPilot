import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const resume = await prisma.resume.findFirst({ where: { id, userId: user.userId } });
  if (!resume) return NextResponse.json({ message: 'Introuvable' }, { status: 404 });

  try {
    await unlink(join(process.cwd(), 'public', resume.fileUrl));
  } catch {
    // file may not exist on disk
  }

  await prisma.resume.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
