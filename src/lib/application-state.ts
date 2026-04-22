// Pure state machine — no side effects, no external deps

export type ApplicationFolder =
  | 'TO_APPLY'
  | 'IN_PROGRESS'
  | 'SENT'
  | 'INTERVIEW'
  | 'REJECTED'
  | 'ARCHIVED';

// Fix 1: folder is 100% derived from status — no override
export function getFolder(status: string): ApplicationFolder {
  switch (status) {
    case 'DRAFT':
      return 'TO_APPLY';
    case 'AUTOMATING':
      return 'IN_PROGRESS';
    case 'APPLIED':
      return 'SENT';
    case 'IN_REVIEW':
    case 'INTERVIEW_SCHEDULED':
    case 'OFFER_RECEIVED':
      return 'INTERVIEW';
    case 'REJECTED':
      return 'REJECTED';
    case 'WITHDRAWN':
      return 'ARCHIVED';
    default:
      return 'TO_APPLY';
  }
}

export function getFolderCounts(
  applications: { status: string }[],
): Record<ApplicationFolder, number> {
  const counts: Record<ApplicationFolder, number> = {
    TO_APPLY: 0,
    IN_PROGRESS: 0,
    SENT: 0,
    INTERVIEW: 0,
    REJECTED: 0,
    ARCHIVED: 0,
  };
  for (const app of applications) {
    counts[getFolder(app.status)]++;
  }
  return counts;
}

// Fix 2: ordered step sequence — index = resume boundary
export const STEP_SEQUENCE = [
  'starting_automation',
  'navigating_to_url',
  'page_loaded',
  'name_filled',
  'email_filled',
  'phone_filled',
  'cover_letter_inserted',
  'upload_done',
  'ready_for_review',
  'submitting',
  'submitted',
] as const;

export function getStepIndex(step: string): number {
  return STEP_SEQUENCE.indexOf(step as (typeof STEP_SEQUENCE)[number]);
}

export function getStepProgress(step: string): number {
  const idx = getStepIndex(step);
  if (idx === -1) return 0;
  return Math.round((idx / (STEP_SEQUENCE.length - 1)) * 100);
}

// Fix 4: explicit FR labels — never "automatisation en cours" alone
const STEP_LABELS: Record<string, string> = {
  starting_automation: 'Démarrage…',
  navigating_to_url: 'Chargement de la page',
  page_loaded: 'Page chargée',
  filling_name: 'Saisie du nom',
  name_filled: 'Nom saisi',
  filling_email: "Saisie de l'email",
  email_filled: 'Email saisi',
  filling_phone: 'Saisie du téléphone',
  phone_filled: 'Téléphone saisi',
  filling_message: 'Insertion de la lettre',
  cover_letter_inserted: 'Lettre insérée',
  selecting_cv: 'Sélection du CV',
  uploading_cv: 'Envoi du CV…',
  upload_done: 'CV envoyé',
  ready_for_review: 'En attente de soumission manuelle',
  submitting: 'Soumission en cours…',
  submitted: 'Candidature envoyée',
  heartbeat: 'En attente…',
  cancelled: 'Annulé',
  error: 'Erreur',
};

export function getStepLabel(step: string): string {
  return STEP_LABELS[step] ?? step;
}

const STEP_COLORS: Record<string, string> = {
  starting_automation: 'text-blue-500',
  navigating_to_url: 'text-blue-500',
  page_loaded: 'text-blue-500',
  filling_name: 'text-amber-500',
  name_filled: 'text-amber-600',
  filling_email: 'text-amber-500',
  email_filled: 'text-amber-600',
  filling_phone: 'text-amber-500',
  phone_filled: 'text-amber-600',
  filling_message: 'text-violet-500',
  cover_letter_inserted: 'text-violet-600',
  selecting_cv: 'text-orange-500',
  uploading_cv: 'text-orange-500',
  upload_done: 'text-orange-600',
  ready_for_review: 'text-indigo-600',
  submitting: 'text-emerald-500',
  submitted: 'text-emerald-600',
  heartbeat: 'text-gray-400',
  cancelled: 'text-red-500',
  error: 'text-red-600',
};

export function getStepColor(step: string): string {
  return STEP_COLORS[step] ?? 'text-gray-500';
}

// Fix 5: D&D guards — system status vs UI folder
export function canDrop(sourceStatus: string, targetFolder: ApplicationFolder): boolean {
  if (sourceStatus === 'AUTOMATING') return false;
  if (targetFolder === 'IN_PROGRESS') return false;
  return true;
}

// Fix 5: folder → DB status (null if folder cannot be set manually)
export function folderToStatus(folder: ApplicationFolder): string | null {
  switch (folder) {
    case 'TO_APPLY':
      return 'DRAFT';
    case 'SENT':
      return 'APPLIED';
    case 'INTERVIEW':
      return 'IN_REVIEW';
    case 'REJECTED':
      return 'REJECTED';
    case 'ARCHIVED':
      return 'WITHDRAWN';
    case 'IN_PROGRESS':
      return null;
  }
}

export function getValidTransitions(status: string): string[] {
  switch (status) {
    case 'DRAFT':
      return ['APPLIED', 'REJECTED', 'WITHDRAWN'];
    case 'APPLIED':
      return ['IN_REVIEW', 'INTERVIEW_SCHEDULED', 'REJECTED', 'WITHDRAWN'];
    case 'IN_REVIEW':
      return ['INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'REJECTED', 'WITHDRAWN'];
    case 'INTERVIEW_SCHEDULED':
      return ['OFFER_RECEIVED', 'REJECTED', 'WITHDRAWN'];
    case 'OFFER_RECEIVED':
      return ['REJECTED', 'WITHDRAWN'];
    case 'REJECTED':
      return ['DRAFT', 'WITHDRAWN'];
    case 'WITHDRAWN':
      return ['DRAFT'];
    default:
      return [];
  }
}

export const FOLDER_META: Record<
  ApplicationFolder,
  { label: string; icon: string; description: string }
> = {
  TO_APPLY: { label: 'À postuler', icon: 'inbox', description: 'Offres non traitées' },
  IN_PROGRESS: { label: 'En cours', icon: 'loader', description: 'Automatisation active' },
  SENT: { label: 'Envoyées', icon: 'send', description: 'Candidatures soumises' },
  INTERVIEW: { label: 'Entretien', icon: 'calendar', description: 'Réponses positives' },
  REJECTED: { label: 'Refusées', icon: 'x-circle', description: 'Candidatures refusées' },
  ARCHIVED: { label: 'Archivées', icon: 'archive', description: 'Candidatures archivées' },
};
