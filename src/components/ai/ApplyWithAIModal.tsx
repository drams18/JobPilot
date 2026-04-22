'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ScoreGauge } from './ScoreGauge';
import { SuggestionsPanel } from './SuggestionsPanel';
import { apiClient } from '@/lib/api-client';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useResumes } from '@/hooks/useResumes';
import type { PreviewPack } from '@/hooks/useApply';
import { cn } from '@/lib/utils';

type Step = 'idle' | 'loading' | 'preview' | 'confirming' | 'automating' | 'ready_for_review' | 'done' | 'error';
type Tab = 'match' | 'letter';

interface AutomationEvent {
  event: string;
  data?: Record<string, unknown>;
}

function eventLabel(ev: AutomationEvent): string {
  switch (ev.event) {
    case 'navigating': return `Ouverture de la page…`;
    case 'page_loaded': return 'Page chargée';
    case 'field_filled': {
      const field = ev.data?.field as string;
      const success = ev.data?.success as boolean;
      const labels: Record<string, string> = { name: 'Nom', email: 'Email', phone: 'Téléphone', message: 'Message' };
      return `${labels[field] ?? field} : ${success ? 'rempli' : 'non trouvé'}`;
    }
    case 'upload_done': return `CV : ${ev.data?.success ? 'uploadé' : 'upload échoué'}`;
    case 'ready_for_review': return '✋ En attente de votre validation';
    case 'submitted': return '✓ Formulaire soumis !';
    case 'cancelled': return 'Annulé par l\'utilisateur';
    case 'heartbeat': return '';
    case 'error': return `Erreur : ${(ev.data?.message as string) ?? 'inconnue'}`;
    default: return ev.event;
  }
}

function eventColor(ev: AutomationEvent): string {
  if (ev.event === 'error') return 'bg-red-500';
  if (ev.event === 'submitted') return 'bg-emerald-500';
  if (ev.event === 'cancelled') return 'bg-amber-500';
  if (ev.event === 'field_filled' && ev.data?.success === false) return 'bg-amber-400';
  if (ev.event === 'upload_done' && ev.data?.success === false) return 'bg-amber-400';
  return 'bg-indigo-400';
}

export function ApplyWithAIModal() {
  const { activeJobId, isApplyModalOpen, closeApplyModal } = useApplicationStore();
  const { data: resumes } = useResumes();
  const { accessToken } = useAuthStore();
  const defaultResume = resumes?.find((r) => r.isDefault) ?? resumes?.[0];
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>('idle');
  const [activeTab, setActiveTab] = useState<Tab>('match');
  const [pack, setPack] = useState<PreviewPack | null>(null);
  const [editedLetter, setEditedLetter] = useState('');
  const [automationEvents, setAutomationEvents] = useState<AutomationEvent[]>([]);
  const [automationAbortController, setAutomationAbortController] = useState<AbortController | null>(null);

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

  const handleAutomate = useCallback(async () => {
    if (!pack) return;
    setStep('automating');
    setAutomationEvents([]);

    const controller = new AbortController();
    setAutomationAbortController(controller);

    try {
      const res = await fetch('/api/apply/automate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ applicationId: pack.applicationId }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Erreur serveur' }));
        toast.error(err.message ?? 'Automatisation indisponible');
        setStep('preview');
        return;
      }

      if (!res.body) {
        toast.error('Stream non supporté par votre navigateur');
        setStep('preview');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines.filter(Boolean)) {
          try {
            const ev: AutomationEvent = JSON.parse(line);

            if (ev.event === 'heartbeat') continue;

            setAutomationEvents((prev) => [...prev, ev]);

            if (ev.event === 'ready_for_review') {
              setStep('ready_for_review');
            }

            if (ev.event === 'submitted') {
              setStep('done');
              qc.invalidateQueries({ queryKey: ['applications'] });
              qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
              toast.success('Candidature soumise !');
            }

            if (ev.event === 'cancelled') {
              setStep('preview');
              toast('Automatisation annulée', { icon: 'ℹ️' });
            }

            if (ev.event === 'error') {
              toast.error(`Erreur : ${(ev.data?.message as string) ?? 'inconnue'}`);
              if (step !== 'done') setStep('preview');
            }
          } catch {
            // malformed JSON line, skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Connexion interrompue');
        setStep('preview');
      }
    }
  }, [pack, accessToken, qc, step]);

  const handleAbortAutomation = () => {
    automationAbortController?.abort();
    setStep('preview');
  };

  useEffect(() => {
    if (isApplyModalOpen && step === 'idle') {
      prepareMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApplyModalOpen]);

  const handleClose = () => {
    automationAbortController?.abort();
    closeApplyModal();
    setTimeout(() => {
      setStep('idle');
      setPack(null);
      setEditedLetter('');
      setActiveTab('match');
      setAutomationEvents([]);
      setAutomationAbortController(null);
    }, 300);
  };

  if (!isApplyModalOpen) return null;

  const isAutomating = step === 'automating' || step === 'ready_for_review';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Postuler avec IA</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">

          {/* Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
              <p className="text-sm text-gray-500">Calcul du matching en cours…</p>
            </div>
          )}

          {/* Preview */}
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
                  {activeTab === 'match' && <SuggestionsPanel suggestions={pack.suggestions} />}
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

          {/* Automating — filling in progress */}
          {step === 'automating' && (
            <div className="flex flex-col gap-4 p-6 h-64 overflow-y-auto">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">Remplissage du formulaire…</span>
              </div>
              <div className="space-y-2">
                {automationEvents.map((ev, i) => {
                  const label = eventLabel(ev);
                  if (!label) return null;
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className={cn('w-2 h-2 rounded-full mt-1 shrink-0', eventColor(ev))} />
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ready for review — awaiting human submit */}
          {step === 'ready_for_review' && (
            <div className="flex flex-col items-center justify-center h-64 gap-5 px-6">
              <div className="flex flex-col items-center gap-2">
                <div className="text-3xl">✋</div>
                <p className="text-base font-semibold text-gray-800 text-center">
                  Vérifiez le formulaire dans Chrome et cliquez sur Envoyer
                </p>
                <p className="text-sm text-gray-400 text-center">
                  Le formulaire a été pré-rempli automatiquement. Relisez et soumettez manuellement.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-indigo-500">
                <Loader2 size={12} className="animate-spin" />
                En attente de soumission…
              </div>
              <div className="space-y-1 w-full max-w-sm">
                {automationEvents.slice(-5).map((ev, i) => {
                  const label = eventLabel(ev);
                  if (!label) return null;
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                      <span className={cn('w-1.5 h-1.5 rounded-full mt-1 shrink-0', eventColor(ev))} />
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confirming */}
          {step === 'confirming' && (
            <div className="flex items-center justify-center h-64 gap-4">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
              <p className="text-sm text-gray-500">Enregistrement…</p>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <CheckCircle2 size={48} className="text-emerald-500" />
              <p className="text-base font-semibold text-emerald-700">Candidature enregistrée !</p>
              <p className="text-sm text-gray-400">Suivez son évolution dans vos candidatures.</p>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <AlertCircle size={36} className="text-red-400" />
              <p className="text-sm text-red-600 font-medium">Une erreur est survenue.</p>
              <button
                onClick={() => { setStep('idle'); prepareMutation.mutate(); }}
                className="text-sm text-indigo-600 underline"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
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
              className="border border-indigo-300 text-indigo-600 text-sm font-medium px-5 py-2 rounded-lg transition hover:bg-indigo-50"
            >
              Marquer comme postulé
            </button>
            <button
              onClick={handleAutomate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition flex items-center gap-2"
            >
              <Zap size={14} />
              Postuler automatiquement
            </button>
          </div>
        )}

        {isAutomating && (
          <div className="flex justify-between px-6 py-4 border-t border-gray-200 shrink-0">
            <button
              onClick={handleAbortAutomation}
              className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2 rounded-lg transition"
            >
              Abandonner
            </button>
            {step === 'ready_for_review' && (
              <button
                onClick={() => confirmMutation.mutate()}
                className="border border-emerald-300 text-emerald-600 text-sm font-medium px-5 py-2 rounded-lg transition hover:bg-emerald-50"
              >
                Marquer comme soumis manuellement
              </button>
            )}
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
