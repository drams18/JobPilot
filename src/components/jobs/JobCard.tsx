'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Building2, MapPin, DollarSign, Zap } from 'lucide-react';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useJobStore } from '@/store/useJobStore';
import type { JobOffer } from '@/hooks/useJobs';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: JobOffer;
}

export function JobCard({ job }: JobCardProps) {
  const openApplyModal = useApplicationStore((s) => s.openApplyModal);
  const { selectedJobIds, toggleJobSelection } = useJobStore();
  const isSelected = selectedJobIds.has(job.id);

  const scoreBadge =
    job.matchScore == null
      ? null
      : job.matchScore >= 70
        ? 'bg-emerald-100 text-emerald-700'
        : job.matchScore >= 45
          ? 'bg-amber-100 text-amber-700'
          : 'bg-red-100 text-red-600';

  return (
    <div
      className={cn(
        'group relative bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200',
        isSelected
          ? 'border-indigo-400 ring-2 ring-indigo-200'
          : 'border-gray-200 hover:border-indigo-200',
      )}
    >
      {/* Selection checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => toggleJobSelection(job.id)}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 left-4 h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
        aria-label={`Sélectionner ${job.title}`}
      />

      {job.matchScore != null && (
        <div className={cn('absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', scoreBadge!)}>
          <Zap size={11} className="fill-current" />
          {Math.round(job.matchScore)}%
        </div>
      )}

      <div className={cn('mb-3 pl-7', job.matchScore != null && 'pr-16')}>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
          {job.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
          <Building2 size={12} />
          {job.company}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 pl-7">
        {job.location && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={11} />
            {job.location}
          </span>
        )}
        {job.salaryRange && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <DollarSign size={11} />
            {job.salaryRange}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(job.scrapedAt), { addSuffix: true, locale: fr })}
        </span>
        <button
          onClick={() => openApplyModal(job.id)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
        >
          Postuler avec IA
        </button>
      </div>
    </div>
  );
}
