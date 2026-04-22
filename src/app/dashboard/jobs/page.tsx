'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Zap, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useJobs } from '@/hooks/useJobs';
import { useResumes } from '@/hooks/useResumes';
import { useJobStore } from '@/store/useJobStore';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';
import { apiClient } from '@/lib/api-client';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function JobsPage() {
  const { filters, selectedJobIds, clearSelection } = useJobStore();
  const { data: resumes } = useResumes();
  const { accessToken } = useAuthStore();
  const { openApplyModal } = useApplicationStore();
  const qc = useQueryClient();

  const defaultResume = resumes?.find((r) => r.isDefault) ?? resumes?.[0];

  const { data, isLoading } = useJobs({
    ...filters,
    resumeId: defaultResume?.id,
  });

  const [syncing, setSyncing] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/jobs/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sync-secret': process.env.NEXT_PUBLIC_SYNC_SECRET ?? 'dev-secret',
        },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`${result.inserted} nouvelles offres ajoutées`);
        qc.invalidateQueries({ queryKey: ['jobs'] });
      } else {
        toast.error(result.message ?? 'Erreur de synchronisation');
      }
    } catch {
      toast.error('Impossible de contacter le serveur');
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkApply = async () => {
    setShowBulkConfirm(false);
    const ids = Array.from(selectedJobIds);
    setBulkProgress({ current: 0, total: ids.length });

    // Prepare each application sequentially then open modal for first
    for (let i = 0; i < ids.length; i++) {
      setBulkProgress({ current: i + 1, total: ids.length });
      try {
        await apiClient.post('/apply/prepare', {
          jobOfferId: ids[i],
          resumeId: defaultResume?.id,
        });
      } catch {
        toast.error(`Erreur pour l'offre ${i + 1}`);
      }
      if (i < ids.length - 1) {
        await sleep(2000 + Math.random() * 3000);
      }
    }

    setBulkProgress(null);
    clearSelection();
    qc.invalidateQueries({ queryKey: ['jobs'] });
    qc.invalidateQueries({ queryKey: ['applications'] });
    toast.success(`${ids.length} candidatures préparées. Ouvrez chacune pour postuler automatiquement.`);
  };

  const selectionCount = selectedJobIds.size;

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Offres d&apos;emploi</h1>
        <div className="flex items-center gap-3">
          {data?.meta && (
            <p className="text-sm text-gray-500">{data.meta.total} offres disponibles</p>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Synchronisation…' : 'Sync France Travail'}
          </button>
        </div>
      </div>

      <JobFilters />

      {/* Job grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 h-40 animate-pulse" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Aucune offre trouvée</p>
          <p className="text-sm mt-1">Cliquez sur &quot;Sync France Travail&quot; pour importer des offres</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Bulk apply progress overlay */}
      {bulkProgress && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center gap-4 min-w-64">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            <p className="text-sm font-medium text-gray-700">
              Préparation {bulkProgress.current} / {bulkProgress.total}
            </p>
          </div>
        </div>
      )}

      {/* Bulk confirm dialog */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBulkConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full flex flex-col gap-5">
            <h3 className="text-base font-semibold text-gray-900">Confirmer les candidatures groupées</h3>
            <p className="text-sm text-gray-600">
              Vous allez lancer la préparation de{' '}
              <strong>{selectionCount} candidature{selectionCount > 1 ? 's' : ''}</strong>{' '}
              automatisées. Elles seront traitées séquentiellement.
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Vous devrez valider chaque formulaire manuellement avant soumission.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={handleBulkApply}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky bulk apply bar */}
      {selectionCount > 0 && !bulkProgress && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white border border-gray-200 rounded-2xl shadow-lg px-6 py-3 z-40">
          <span className="text-sm text-gray-600 font-medium">
            {selectionCount} offre{selectionCount > 1 ? 's' : ''} sélectionnée{selectionCount > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setShowBulkConfirm(true)}
            disabled={!defaultResume}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            <Zap size={13} />
            Postuler à toutes
          </button>
          <button
            onClick={clearSelection}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Annuler la sélection"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
