import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { extractJobKeywords } from '@/lib/cv-optimizer';

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseJobText(text: string): { title: string; company: string; description: string; requirements: string } {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 3);

  const title = lines[0] ?? "Offre d'emploi";

  const company =
    lines.find((l) => /\b(SA|SAS|SARL|Inc|Ltd|Group|Studio|Agency|Corp|Technologies|Solutions|Consulting)\b/i.test(l)) ?? '';

  const description = lines.slice(0, 15).join(' ');

  const requirements = extractJobKeywords(text).join(', ');

  return { title, company, description, requirements };
}

export async function POST(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { url, text } = body as { url?: string; text?: string };

  if (!url && !text) {
    return NextResponse.json({ message: 'url ou text requis' }, { status: 400 });
  }

  let rawText = '';

  if (url) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CVOptimizer/1.0)' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      rawText = stripHtml(html).slice(0, 3000);
    } catch (err) {
      return NextResponse.json(
        { message: `Impossible de récupérer l'URL : ${err instanceof Error ? err.message : 'erreur réseau'}` },
        { status: 400 }
      );
    }
  } else {
    rawText = (text as string).slice(0, 3000);
  }

  const parsed = parseJobText(rawText);
  return NextResponse.json({ ...parsed, rawText });
}
