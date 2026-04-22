'use client';

import { useJobs } from '@/hooks/useJobs';
import { useResumes } from '@/hooks/useResumes';
import { useJobStore } from '@/store/useJobStore';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';

export default function JobsPage() {
  const { filters } = useJobStore();
  const { data: resumes } = useResumes();
  const defaultResume = resumes?.find((r) => r.isDefault) ?? resumes?.[0];

  const { data, isLoading } = useJobs({
    ...filters,
    resumeId: defaultResume?.id,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Offres d&apos;emploi</h1>
        {data?.meta && (
          <p className="text-sm text-gray-500">{data.meta.total} offres disponibles</p>
        )}
      </div>

      <JobFilters />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 h-40 animate-pulse" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Aucune offre trouvée</p>
          <p className="text-sm">Modifiez vos filtres ou ajoutez des offres via l&apos;API</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
