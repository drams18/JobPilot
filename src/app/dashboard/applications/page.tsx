'use client';

import { useApplications } from '@/hooks/useApplications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
  APPLIED: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700' },
  IN_REVIEW: { label: 'En cours', color: 'bg-amber-100 text-amber-700' },
  INTERVIEW_SCHEDULED: { label: 'Entretien', color: 'bg-purple-100 text-purple-700' },
  OFFER_RECEIVED: { label: 'Offre reçue', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Refusée', color: 'bg-red-100 text-red-600' },
  WITHDRAWN: { label: 'Retirée', color: 'bg-gray-100 text-gray-500' },
};

export default function ApplicationsPage() {
  const { data: applications, isLoading } = useApplications();
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/applications/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Statut mis à jour');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-gray-900">Mes candidatures</h1>

      {!applications?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Aucune candidature</p>
          <p className="text-sm">Utilisez &quot;Apply with AI&quot; depuis les offres d&apos;emploi</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Poste', 'Entreprise', 'Statut', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((app: any) => {
                const badge = STATUS_LABELS[app.status] ?? STATUS_LABELS.DRAFT;
                return (
                  <tr key={app.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{app.jobOffer?.title}</td>
                    <td className="px-4 py-3 text-gray-600">{app.jobOffer?.company}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700"
                        value={app.status}
                        onChange={(e) => updateMutation.mutate({ id: app.id, status: e.target.value })}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
