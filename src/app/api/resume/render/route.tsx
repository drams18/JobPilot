import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { CVPdfDocument } from '@/lib/cv-pdf-document';
import type { ParsedResumeJson } from '@/hooks/useResumes';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: { parsedJson: ParsedResumeJson };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { parsedJson } = body;
  if (!parsedJson) {
    return NextResponse.json({ error: 'parsedJson requis' }, { status: 400 });
  }

  try {
    const buffer = await renderToBuffer(
      <CVPdfDocument data={parsedJson} />
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="cv-genere.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[resume/render]', err);
    return NextResponse.json({ error: 'Erreur génération PDF' }, { status: 500 });
  }
}
