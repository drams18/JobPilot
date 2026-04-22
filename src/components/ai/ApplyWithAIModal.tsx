'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ScoreGauge } from './ScoreGauge';
import { SuggestionsPanel } from './SuggestionsPanel';
import { apiClient } from '@/lib/api-client';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useResumes } from '@/hooks/useResumes';
import type { PreviewPack } from '@/hooks/useApply';
import { cn } from '@/lib/utils';

type Step = 'idle' | 'loading' | 'preview' | 'confirming' | 'done' | 'error';
type Tab = 'match' | 'letter';

export function ApplyWithAIModal() {
  const { activeJobId, isApplyModalOpen, closeApplyModal } = useApplicationStore();
  const { data: resumes } = useResumes();
  const defaultResume = resumes?.find((r) => r.isDefault) ?? resumes?.[0];
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>('idle');
  const [activeTab, setActiveTab] = useState<Tab>('match');
  const [pack, setPack] = useState<PreviewPack | null>(null);
  const [editedLetter, setEditedLetter] = useState('');

  const prepareMutation = useMutation({
    mutationFn: async () => {
      if (!activeJobId || !defaultResume) throw new Error('Missing data');
      return apiClient
        .post('/apply/prepare', { jobOfferId: activeJobId, resumeId: defaultResume.id })
        .then((r) => r.data as PreviewPack);
    },
    onMutate: () => setStep('loading'),
    onSuccess: (data) => {
      setPack(data);
      setEditedLetter(data.coverLetter);
      setStep('preview');
    },
    onError: () => {
      setStep('error');
      toast.error('Erreur lors de la préparation');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!pack) return;
      await apiClient.patch(`/applications/${pack.applicationId}/status`, { status: 'APPLIED' });
    },
    onMutate: () => setStep('confirming'),
    onSuccess: () => {
      setStep('done');
      qc.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Candidature enregistrée !');
    },
    onError: () => {
      setStep('error');
      toast.error('Erreur lors de la soumission');
    },
  });

  useEffect(() => {
    if (isApplyModalOpen && step === 'idle') {
      prepareMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApplyModalOpen]);

  const handleClose = () => {
    closeApplyModal();
    setTimeout(() => {
      setStep('idle');
      setPack(null);
      setEditedLetter('');
      setActiveTab('match');
    }, 300);
  };

  if (!isApplyModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Apply with AI</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
              <p className="text-sm text-gray-500">Calcul du matching en cours…</p>
            </div>
          )}

          {step === 'preview' && pack && (
            <div className="flex gap-0 h-full overflow-hidden">
              <div className="w-52 shrink-0 border-r border-gray-100 p-5 flex flex-col gap-5 overflow-y-auto">
                <ScoreGauge score={pack.matchScore.score} />

                {pack.matchScore.matchedSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Compétences matchées
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {pack.matchScore.matchedSkills.slice(0, 8).map((s) => (
                        <span key={s} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {pack.matchScore.missingSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Manquantes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {pack.matchScore.missingSkills.slice(0, 6).map((s) => (
                        <span key={s} className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex border-b border-gray-200 shrink-0">
                  {(['match', 'letter'] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                        activeTab === tab
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700',
                      )}
                    >
                      {tab === 'match' ? 'Suggestions CV' : 'Lettre de motivation'}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {activeTab === 'match' && (
                    <SuggestionsPanel suggestions={pack.suggestions} />
                  )}
                  {activeTab === 'letter' && (
                    <textarea
                      value={editedLetter}
                      onChange={(e) => setEditedLetter(e.target.value)}
                      className="w-full h-full min-h-[280px] text-sm p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 font-sans leading-relaxed"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="text-5xl">✓</div>
              <p className="text-base font-semibold text-emerald-700">Candidature enregistrée !</p>
              <p className="text-sm text-gray-400">Suivez son évolution dans vos candidatures.</p>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <p className="text-sm text-red-600 font-medium">Une erreur est survenue.</p>
              <button
                onClick={() => { setStep('idle'); prepareMutation.mutate(); }}
                className="text-sm text-indigo-600 underline"
              >
                Réessayer
              </button>
            </div>
          )}

          {step === 'confirming' && (
            <div className="flex items-center justify-center h-64 gap-4">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
              <p className="text-sm text-gray-500">Enregistrement…</p>
            </div>
          )}
        </div>

        {step === 'preview' && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
            <button
              onClick={handleClose}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg transition"
            >
              Annuler
            </button>
            <button
              onClick={() => confirmMutation.mutate()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
            >
              Confirmer la candidature
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="flex justify-center px-6 py-4 border-t border-gray-200 shrink-0">
            <button onClick={handleClose} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg">
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
