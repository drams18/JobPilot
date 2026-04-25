'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Star, Trash2, Pencil, Sparkles } from 'lucide-react';
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
        'bg-white border rounded-2xl overflow-hidden flex flex-col transition',
        resume.isDefault
          ? 'border-indigo-300 ring-1 ring-indigo-200'
          : 'border-gray-200',
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-full bg-gray-100" style={{ aspectRatio: '210/297' }}>
        {resume.thumbnail ? (
          <img
            src={resume.thumbnail}
            alt={resume.fileName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-20 bg-gray-200 rounded animate-pulse" />
            <FileText size={24} className="text-gray-300 absolute" />
          </div>
        )}
        {resume.isDefault && (
          <span className="absolute top-2 right-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium shadow">
            Principal
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <p className="text-sm font-semibold text-gray-800 leading-tight truncate">
          {resume.fileName}
        </p>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skills.map((s) => (
              <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto pt-1">
          <Link
            href={`/dashboard/resumes/${resume.id}`}
            className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Pencil size={12} />
            Éditer
          </Link>

          <Link
            href={`/dashboard/resumes/${resume.id}?optimize=1`}
            className="flex items-center gap-1.5 text-xs bg-violet-50 text-violet-700 px-3 py-1.5 rounded-lg font-medium hover:bg-violet-100 transition-colors border border-violet-200"
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
    </div>
  );
}
