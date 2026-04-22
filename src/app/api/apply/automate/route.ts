import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { existsSync, unlinkSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Steps that confirm a stage completed successfully — update lastSuccessfulStep only on these
const SUCCESS_STEPS = new Set([
  'name_filled',
  'email_filled',
  'phone_filled',
  'cover_letter_inserted',
  'upload_done',
  'ready_for_review',
  'submitted',
]);

async function downloadToTemp(url: string): Promise<string> {
  const tmpPath = resolve(tmpdir(), `${randomUUID()}.pdf`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download CV: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const { writeFileSync } = await import('fs');
  writeFileSync(tmpPath, Buffer.from(buffer));
  return tmpPath;
}

export async function POST(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.applicationId) {
    return NextResponse.json({ message: 'applicationId requis' }, { status: 400 });
  }

  const { applicationId } = body as { applicationId: string };

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: user.userId },
    include: {
      jobOffer: true,
      resume: true,
      documents: {
        where: { type: 'COVER_LETTER' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!application) {
    return NextResponse.json({ message: 'Candidature introuvable' }, { status: 404 });
  }

  if (application.status === 'AUTOMATING') {
    return NextResponse.json(
      { message: 'Automatisation déjà en cours pour cette candidature' },
      { status: 409 },
    );
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { name: true, email: true, phone: true },
  });

  const isRetry = application.retryCount > 0 || application.lastSuccessfulStep !== null;
  const resumeFrom = isRetry ? application.lastSuccessfulStep : null;

  // Lock and increment retryCount
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: 'AUTOMATING',
      retryCount: { increment: 1 },
    },
  });

  // Log automation start as a business event
  await prisma.applicationEvent.create({
    data: {
      applicationId,
      eventType: 'STATUS_CHANGED',
      detailsJson: {
        from: application.status,
        to: 'AUTOMATING',
        via: 'playwright',
        retryCount: application.retryCount + 1,
        resumeFrom,
      },
    },
  }).catch(() => {});

  const job = application.jobOffer;
  const resume = application.resume;
  const coverLetter = application.documents[0]?.content ?? '';

  let cvPath: string;
  let tempFile: string | null = null;

  if (resume.fileUrl.startsWith('http')) {
    tempFile = await downloadToTemp(resume.fileUrl).catch(() => null);
    if (!tempFile) {
      await prisma.application.update({ where: { id: applicationId }, data: { status: 'DRAFT' } });
      return NextResponse.json({ message: 'Impossible de télécharger le CV' }, { status: 500 });
    }
    cvPath = tempFile;
  } else {
    cvPath = resolve(process.cwd(), 'public', resume.fileUrl.replace(/^\//, ''));
  }

  const sessionPath = resolve(
    process.cwd(),
    'apps/automation/sessions',
    `${user.userId}.json`,
  );

  const automateScript = resolve(process.cwd(), 'apps/automation/src/automate.ts');

  const spawnArgs = [
    automateScript,
    '--url', job.jobUrl,
    '--name', userRecord?.name ?? '',
    '--email', userRecord?.email ?? user.email,
    '--cvPath', cvPath,
    '--message', coverLetter,
    '--session', sessionPath,
  ];
  if (userRecord?.phone) spawnArgs.push('--phone', userRecord.phone);
  if (resumeFrom) spawnArgs.push('--resumeFrom', resumeFrom);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Fix 3: in-memory seq counter for deterministic timeline ordering
      let seq = 0;

      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));

      const handleEvent = async (line: string) => {
        try {
          const parsed = JSON.parse(line) as { event: string; data?: Record<string, unknown> };
          send(parsed);

          seq++;

          // Fix 3: persist seq in payload for stable frontend ordering
          await prisma.automationLog.create({
            data: {
              applicationId,
              event: parsed.event,
              payload: { ...(parsed.data ?? {}), seq },
            },
          }).catch(() => {});

          // Fix 2: only update lastSuccessfulStep on confirmed success steps (not skipped ones)
          if (
            SUCCESS_STEPS.has(parsed.event) &&
            parsed.data?.skipped !== true &&
            parsed.data?.success !== false
          ) {
            await prisma.application.update({
              where: { id: applicationId },
              data: { lastSuccessfulStep: parsed.event },
            }).catch(() => {});
          }

          if (parsed.event === 'submitted') {
            await prisma.application.update({
              where: { id: applicationId },
              data: { status: 'APPLIED', appliedAt: new Date() },
            }).catch(() => {});
            await prisma.applicationEvent.create({
              data: {
                applicationId,
                eventType: 'STATUS_CHANGED',
                detailsJson: { from: 'AUTOMATING', to: 'APPLIED', via: 'playwright' },
              },
            }).catch(() => {});
          }

          if (parsed.event === 'cancelled' || parsed.event === 'error') {
            await prisma.application.update({
              where: { id: applicationId },
              data: { status: 'DRAFT' },
            }).catch(() => {});
          }
        } catch {
          send({ event: 'raw', data: { line } });
        }
      };

      const child = spawn('npx', ['ts-node', ...spawnArgs], {
        cwd: resolve(process.cwd(), 'apps/automation'),
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let buffer = '';
      child.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        lines.filter(Boolean).forEach((line) => handleEvent(line));
      });

      child.stderr.on('data', (chunk: Buffer) => {
        const msg = chunk.toString().trim();
        if (msg) send({ event: 'stderr', data: { message: msg } });
      });

      child.on('close', async (code) => {
        if (buffer.trim()) await handleEvent(buffer.trim());
        send({ event: 'process_exit', data: { code } });
        if (tempFile && existsSync(tempFile)) {
          try { unlinkSync(tempFile); } catch { /* best-effort */ }
        }
        controller.close();
      });

      child.on('error', async (err) => {
        send({ event: 'error', data: { message: err.message } });
        await prisma.application.update({
          where: { id: applicationId },
          data: { status: 'DRAFT' },
        }).catch(() => {});
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
