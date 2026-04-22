import { createHash } from 'crypto';

const TOKEN_URL =
  'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
const SEARCH_URL =
  'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.FT_CLIENT_ID!,
      client_secret: process.env.FT_CLIENT_SECRET!,
      scope: 'api_offresdemploiv2 o2dsoffre',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`France Travail token error ${res.status}: ${body}`);
  }

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  };
  return cachedToken.value;
}

export interface FTSearchParams {
  motsCles?: string;
  commune?: string;
  departement?: string;
  range: string;
}

export interface FTOffer {
  id: string;
  intitule: string;
  entreprise?: { nom?: string };
  lieuTravail?: { libelle?: string };
  description?: string;
  competences?: Array<{ libelle: string }>;
  salaire?: { libelleSalaire?: string };
  typeContrat?: string;
  experienceLibelle?: string;
  qualificationLibelle?: string;
  origineOffre?: { urlOrigine?: string };
  dateCreation?: string;
}

interface FTSearchResponse {
  resultats?: FTOffer[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function searchOffers(params: FTSearchParams): Promise<FTOffer[]> {
  const token = await getToken();

  const qs = new URLSearchParams();
  if (params.motsCles) qs.set('motsCles', params.motsCles);
  if (params.commune) qs.set('commune', params.commune);
  if (params.departement) qs.set('departement', params.departement);
  qs.set('range', params.range);
  qs.set('sort', '1');

  const res = await fetch(`${SEARCH_URL}?${qs}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 204) return [];

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`France Travail search error ${res.status}: ${body}`);
  }

  const data: FTSearchResponse = await res.json();
  return data.resultats ?? [];
}

export async function searchAllOffers(
  params: Omit<FTSearchParams, 'range'>,
  maxOffers = 3000,
): Promise<FTOffer[]> {
  const all: FTOffer[] = [];
  let offset = 0;

  while (offset < maxOffers) {
    const end = Math.min(offset + 49, maxOffers - 1);
    const batch = await searchOffers({ ...params, range: `${offset}-${end}` });
    all.push(...batch);

    if (batch.length < 50) break;

    offset += 50;
    await sleep(1100);
  }

  return all;
}

export function buildExternalKey(offer: FTOffer): string {
  const raw = `${offer.origineOffre?.urlOrigine ?? offer.id}|${offer.intitule}|${offer.entreprise?.nom ?? ''}`;
  return createHash('md5').update(raw).digest('hex');
}

export function mapFTOfferToJobOffer(offer: FTOffer) {
  return {
    externalKey: buildExternalKey(offer),
    title: offer.intitule,
    company: offer.entreprise?.nom ?? 'Entreprise non précisée',
    location: offer.lieuTravail?.libelle ?? null,
    description: offer.description ?? '',
    requirements: offer.competences?.map((c) => c.libelle).join(', ') ?? null,
    salaryRange: offer.salaire?.libelleSalaire ?? null,
    contractType: offer.typeContrat ?? null,
    experience: offer.experienceLibelle ?? null,
    qualification: offer.qualificationLibelle ?? null,
    jobUrl: offer.origineOffre?.urlOrigine ?? `https://francetravail.fr/offres/${offer.id}`,
    source: 'france_travail',
    scrapedAt: offer.dateCreation ? new Date(offer.dateCreation) : new Date(),
    isActive: true,
  };
}
