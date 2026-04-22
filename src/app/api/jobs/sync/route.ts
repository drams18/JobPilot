import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchAllOffers, mapFTOfferToJobOffer } from '@/lib/france-travail';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const DEFAULT_KEYWORDS = ['développeur', 'developer', 'React', 'TypeScript', 'Node.js', 'web'];
const DEFAULT_DEPARTMENTS = ['75', '69', '13', '31', '44', '59', '33'];

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-sync-secret');
  if (secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  if (!process.env.FT_CLIENT_ID || !process.env.FT_CLIENT_SECRET) {
    return NextResponse.json(
      { message: 'FT_CLIENT_ID / FT_CLIENT_SECRET manquants dans .env.local' },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const keywords: string[] = body.keywords ?? DEFAULT_KEYWORDS;
  const departments: string[] = body.departments ?? DEFAULT_DEPARTMENTS;

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const motsCles of keywords) {
    for (const departement of departments) {
      try {
        const offers = await searchAllOffers({ motsCles, departement }, 3000);

        for (const offer of offers) {
          const mapped = mapFTOfferToJobOffer(offer);
          try {
            const existing = await prisma.jobOffer.findUnique({
              where: { externalKey: mapped.externalKey },
              select: { id: true },
            });

            if (existing) {
              await prisma.jobOffer.update({
                where: { externalKey: mapped.externalKey },
                data: { isActive: true, scrapedAt: mapped.scrapedAt },
              });
              updated++;
            } else {
              await prisma.jobOffer.create({ data: mapped });
              inserted++;
            }
          } catch (e) {
            skipped++;
            if (errors.length < 10) {
              errors.push(`${mapped.title} @ ${mapped.company}: ${(e as Error).message}`);
            }
          }
        }
      } catch (e) {
        const msg = `Sync error [${motsCles}/${departement}]: ${(e as Error).message}`;
        errors.push(msg);
        console.error(msg);
      }
    }
  }

  return NextResponse.json({ inserted, updated, skipped, errors });
}
