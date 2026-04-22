'use client';

import { useResumes } from '@/hooks/useResumes';
import { ResumeUploader } from '@/components/resumes/ResumeUploader';
import { ResumeCard } from '@/components/resumes/ResumeCard';

export default function ResumesPage() {
  const { data: resumes, isLoading } = useResumes();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Mes CV</h1>
      <ResumeUploader />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 h-24 animate-pulse" />
          ))}
        </div>
      ) : resumes?.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          Uploadez votre premier CV pour commencer
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes?.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}
    </div>
  );
}
