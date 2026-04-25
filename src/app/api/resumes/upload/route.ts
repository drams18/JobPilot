import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { parseResumeLocal } from '@/lib/cv-parser';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { id: true } });
  if (!dbUser) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: 'Format invalide — utilisez multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;

  if (!file || typeof file === 'string') {
    return NextResponse.json({ message: 'Fichier requis' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ message: 'Fichier trop volumineux (max 10MB)' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.split('.').pop() ?? 'bin';
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(join(uploadsDir, filename), buffer);

  const fileUrl = `/uploads/${filename}`;

  let rawText: string | undefined;
  let parsedJson: object | undefined;

  if (file.name.toLowerCase().endsWith('.pdf')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (await import('pdf-parse') as any).default ?? (await import('pdf-parse') as any);
      const pdfResult = await pdfParse(buffer);
      rawText = pdfResult.text;
      parsedJson = parseResumeLocal(rawText);
    } catch {
      // PDF extraction failed — resume saved without parsed data
    }
  }

  try {
    const existingCount = await prisma.resume.count({ where: { userId: user.userId } });
    const isDefault = existingCount === 0;

    const resume = await prisma.resume.create({
      data: {
        userId: user.userId,
        fileName: file.name,
        fileUrl,
        rawText,
        parsedJson: parsedJson as unknown as import('@prisma/client').Prisma.InputJsonValue | undefined,
        isDefault,
      },
    });

    return NextResponse.json(resume, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Erreur lors de la sauvegarde du CV' }, { status: 500 });
  }
}
