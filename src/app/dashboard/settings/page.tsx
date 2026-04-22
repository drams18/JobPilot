'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';

const TONES = [
  { value: 'CONFIDENT', label: 'Confiant(e)' },
  { value: 'FORMAL', label: 'Formel(le)' },
  { value: 'FRIENDLY', label: 'Chaleureux(se)' },
  { value: 'CONCISE', label: 'Concis(e)' },
];

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: prefs } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => apiClient.get('/preferences').then((r) => r.data),
  });

  const [form, setForm] = useState({
    targetRoles: '',
    targetLocations: '',
    minSalary: '',
    maxSalary: '',
    preferredTone: 'CONFIDENT',
    workType: '',
  });

  useEffect(() => {
    if (prefs) {
      setForm({
        targetRoles: (prefs.targetRoles as string[]).join(', '),
        targetLocations: (prefs.targetLocations as string[]).join(', '),
        minSalary: prefs.minSalary ? String(prefs.minSalary) : '',
        maxSalary: prefs.maxSalary ? String(prefs.maxSalary) : '',
        preferredTone: prefs.preferredTone ?? 'CONFIDENT',
        workType: prefs.workType ?? '',
      });
    }
  }, [prefs]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.put('/preferences', {
        targetRoles: form.targetRoles.split(',').map((s) => s.trim()).filter(Boolean),
        targetLocations: form.targetLocations.split(',').map((s) => s.trim()).filter(Boolean),
        minSalary: form.minSalary ? Number(form.minSalary) : undefined,
        maxSalary: form.maxSalary ? Number(form.maxSalary) : undefined,
        preferredTone: form.preferredTone,
        workType: form.workType || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Préférences sauvegardées');
    },
  });

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Mes préférences</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">
        {[
          { key: 'targetRoles', label: 'Postes recherchés', placeholder: 'Ex: Développeur React, Lead Dev' },
          { key: 'targetLocations', label: 'Localisations', placeholder: 'Ex: Paris, Remote' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              value={(form as any)[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <p className="text-xs text-gray-400 mt-1">Séparés par des virgules</p>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'minSalary', label: 'Salaire min (€)' },
            { key: 'maxSalary', label: 'Salaire max (€)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="number"
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ton de la lettre de motivation
          </label>
          <select
            value={form.preferredTone}
            onChange={(e) => setForm((f) => ({ ...f, preferredTone: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition mt-2"
        >
          {saveMutation.isPending ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
