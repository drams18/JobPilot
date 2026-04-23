import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { parseResume } from '@/lib/cv-parser';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
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
  let parsedJson: ReturnType<typeof parseResume> | undefined;

  if (file.name.toLowerCase().endsWith('.pdf')) {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfResult = await pdfParse(buffer);
      rawText = pdfResult.text;
      parsedJson = parseResume(rawText);
    } catch {
      // continue without parsed content
    }
  }

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
}
