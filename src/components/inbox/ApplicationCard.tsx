'use client';

import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Zap } from 'lucide-react';
import { getStepLabel, getStepProgress } from '@/lib/application-state';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  AUTOMATING: 'bg-blue-100 text-blue-700',
  APPLIED: 'bg-emerald-100 text-emerald-700',
  IN_REVIEW: 'bg-amber-100 text-amber-700',
  INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-700',
  OFFER_RECEIVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  AUTOMATING: 'Automatisation',
  APPLIED: 'Envoyée',
  IN_REVIEW: 'En examen',
  INTERVIEW_SCHEDULED: 'Entretien',
  OFFER_RECEIVED: 'Offre reçue',
  REJECTED: 'Refusée',
  WITHDRAWN: 'Archivée',
};

interface ApplicationCardProps {
  app: {
    id: string;
    status: string;
    lastSuccessfulStep?: string | null;
    appliedAt?: string | null;
    jobOffer?: { title?: string; company?: string; location?: string } | null;
    matchScore?: number | null;
  };
  selected: boolean;
  onClick: () => void;
}

export function ApplicationCard({ app, selected, onClick }: ApplicationCardProps) {
  const isAutomating = app.status === 'AUTOMATING';

  // Fix 5: drag disabled if AUTOMATING
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `app-${app.id}`,
    data: { applicationId: app.id, status: app.status },
    disabled: isAutomating,
  });

  const progress = app.lastSuccessfulStep ? getStepProgress(app.lastSuccessfulStep) : 0;
  // Fix 4: always show exact step, never "automatisation en cours"
  const stepLabel = app.lastSuccessfulStep ? getStepLabel(app.lastSuccessfulStep) : null;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className={[
        'relative flex flex-col gap-2 p-4 rounded-xl border cursor-pointer transition-all select-none',
        selected
          ? 'border-indigo-400 bg-indigo-50/40 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
      ].join(' ')}
    >
      {/* Drag handle — hidden when AUTOMATING */}
      {!isAutomating && (
        <div
          {...listeners}
          {...attributes}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>
      )}

      <div className="pl-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {app.jobOffer?.title ?? '—'}
            </p>
            <p className="text-xs text-gray-500 truncate">{app.jobOffer?.company}</p>
          </div>
          <span
            className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {STATUS_LABELS[app.status] ?? app.status}
          </span>
        </div>

        {/* Fix 4: show exact step when AUTOMATING */}
        {isAutomating && (
          <div className="mt-2">
            <div className="flex items-center gap-1.5 text-xs text-blue-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <Zap size={11} className="text-blue-500" />
              <span className="font-medium">
                {stepLabel ?? 'Démarrage…'}
              </span>
            </div>
            {progress > 0 && (
              <div className="mt-1.5 h-1 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{app.jobOffer?.location ?? ''}</span>
          <div className="flex items-center gap-2">
            {app.matchScore != null && (
              <span
                className={`font-semibold ${app.matchScore >= 70 ? 'text-emerald-600' : app.matchScore >= 45 ? 'text-amber-500' : 'text-red-500'}`}
              >
                {Math.round(app.matchScore)}%
              </span>
            )}
            {app.appliedAt && (
              <span>{new Date(app.appliedAt).toLocaleDateString('fr-FR')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
