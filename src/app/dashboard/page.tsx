'use client';

import Link from 'next/link';
import { Files, Layers, ArrowRight } from 'lucide-react';
import { useResumes } from '@/hooks/useResumes';

export default function DashboardPage() {
  const { data: resumes, isLoading } = useResumes();

  const resumeCount = resumes?.length ?? 0;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bienvenue sur CV Optimizer</h1>
        <p className="text-sm text-gray-400 mt-1">
          Uploadez votre CV et optimisez-le pour n&apos;importe quelle offre en un clic.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-400 font-medium">CV uploadés</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <Files size={15} className="text-indigo-600" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-10 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-indigo-600">{resumeCount}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-400 font-medium">Versions générées</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <Layers size={15} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">—</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Files size={18} className="text-indigo-600" />
        </div>
        <p className="text-sm font-semibold text-gray-800 mb-1">Optimisez votre CV</p>
        <p className="text-xs text-gray-400 mb-4">
          Uploadez votre CV, collez une offre d&apos;emploi, et obtenez un CV adapté instantanément.
        </p>
        <Link
          href="/dashboard/resumes"
          className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Mes CV
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
