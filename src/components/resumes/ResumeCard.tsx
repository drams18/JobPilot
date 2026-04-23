'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Star, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import type { Resume } from '@/hooks/useResumes';
import { cn } from '@/lib/utils';

export function ResumeCard({ resume }: { resume: Resume }) {
  const qc = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/resumes/${resume.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('CV supprimé');
    },
  });

  const defaultMutation = useMutation({
    mutationFn: () => apiClient.patch(`/resumes/${resume.id}/set-default`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('CV défini comme principal');
    },
  });

  const skills: string[] = Array.isArray(resume.parsedJson?.skills)
    ? resume.parsedJson.skills.slice(0, 6)
    : [];

  return (
    <div
      className={cn(
        'bg-white border rounded-2xl p-5 flex flex-col gap-3 transition',
        resume.isDefault
          ? 'border-indigo-300 ring-1 ring-indigo-200'
          : 'border-gray-200',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-indigo-500 shrink-0" />
          <p className="text-sm font-semibold text-gray-800 leading-tight">{resume.fileName}</p>
        </div>
        {resume.isDefault && (
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            Principal
          </span>
        )}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-1">
        <Link
          href={`/dashboard/resumes/${resume.id}`}
          className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Sparkles size={12} />
          Optimiser
        </Link>

        {!resume.isDefault && (
          <button
            onClick={() => defaultMutation.mutate()}
            disabled={defaultMutation.isPending}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Star size={13} />
            Principal
          </button>
        )}

        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 ml-auto"
        >
          <Trash2 size={13} />
          Supprimer
        </button>
      </div>
    </div>
  );
}
