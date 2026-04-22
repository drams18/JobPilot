'use client';

import { X, RefreshCw, ExternalLink } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useApplicationTimeline } from '@/hooks/useApplications';
import { TimelineView } from './TimelineView';
import { getFolder, getValidTransitions, getStepLabel, getStepProgress } from '@/lib/application-state';
import { apiClient } from '@/lib/api-client';

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

const FOLDER_LABELS = {
  TO_APPLY: 'À postuler',
  IN_PROGRESS: 'En cours',
  SENT: 'Envoyées',
  INTERVIEW: 'Entretien',
  REJECTED: 'Refusées',
  ARCHIVED: 'Archivées',
};

export function ApplicationDetail({
  applicationId,
  onClose,
  onStartAutomation,
}: {
  applicationId: string;
  onClose: () => void;
  onStartAutomation: (applicationId: string) => void;
}) {
  const qc = useQueryClient();
  const { data, timeline, isLoading } = useApplicationTimeline(applicationId);

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      apiClient.patch(`/applications/${applicationId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['application', applicationId] });
      toast.success('Statut mis à jour');
    },
  });

  if (isLoading) {
    return (
      <div className="w-[420px] border-l border-gray-200 flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  const isAutomating = data.status === 'AUTOMATING';
  const canResume =
    data.status === 'DRAFT' && data.lastSuccessfulStep !== null && data.lastSuccessfulStep !== undefined;
  const folder = getFolder(data.status);
  const validNext = getValidTransitions(data.status);
  const progress = data.lastSuccessfulStep ? getStepProgress(data.lastSuccessfulStep) : 0;

  return (
    <aside className="w-[420px] shrink-0 flex flex-col border-l border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-100">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{data.jobOffer?.title ?? '—'}</p>
          <p className="text-sm text-gray-500">{data.jobOffer?.company}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {FOLDER_LABELS[folder]}
            </span>
            <span className="text-xs text-gray-400">{STATUS_LABELS[data.status]}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition ml-2"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar (automation) */}
      {(isAutomating || canResume) && progress > 0 && (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>
              {isAutomating
                ? getStepLabel(data.lastSuccessfulStep ?? 'starting_automation')
                : `Arrêté à : ${getStepLabel(data.lastSuccessfulStep!)}`}
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isAutomating ? 'bg-blue-500' : 'bg-amber-400'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2">
        {/* Resume / Start automation */}
        {canResume && (
          <button
            onClick={() => onStartAutomation(applicationId)}
            className="flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition"
          >
            <RefreshCw size={12} />
            Reprendre (depuis {getStepLabel(data.lastSuccessfulStep!)})
          </button>
        )}

        {data.status === 'DRAFT' && !canResume && (
          <button
            onClick={() => onStartAutomation(applicationId)}
            className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
          >
            Lancer l'automatisation
          </button>
        )}

        {data.jobOffer?.jobUrl && (
          <a
            href={data.jobOffer.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition"
          >
            <ExternalLink size={11} />
            Voir l'offre
          </a>
        )}

        {/* Status dropdown (respects valid transitions) */}
        {validNext.length > 0 && !isAutomating && (
          <select
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white"
            value=""
            onChange={(e) => {
              if (e.target.value) statusMutation.mutate({ status: e.target.value });
            }}
          >
            <option value="">Changer le statut…</option>
            {validNext.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Historique
        </p>
        <TimelineView items={timeline} isLive={isAutomating} />
      </div>
    </aside>
  );
}
