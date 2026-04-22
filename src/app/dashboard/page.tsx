'use client';

import Link from 'next/link';
import { Send, TrendingUp, BarChart2, Star } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboard';

const STAT_CONFIG = [
  { key: 'totalApplications', label: 'Candidatures totales', icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'activeApplications', label: 'En cours', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'responseRate', label: 'Taux de réponse', icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-50', suffix: '%' },
  { key: 'averageMatchScore', label: 'Score moyen', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50', suffix: '%' },
] satisfies readonly { key: string; label: string; icon: any; color: string; bg: string; suffix?: string }[];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
  APPLIED: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700' },
  IN_REVIEW: { label: 'En cours', color: 'bg-amber-100 text-amber-700' },
  INTERVIEW_SCHEDULED: { label: 'Entretien', color: 'bg-purple-100 text-purple-700' },
  OFFER_RECEIVED: { label: 'Offre reçue', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Refusée', color: 'bg-red-100 text-red-600' },
  WITHDRAWN: { label: 'Retirée', color: 'bg-gray-100 text-gray-500' },
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 h-56" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CONFIG.map(({ key, label, icon: Icon, color, bg, suffix }) => (
          <div
            key={key}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium leading-tight">{label}</p>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={15} className={color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>
              {(stats as any)?.[key] ?? 0}
              {suffix ?? ''}
            </p>
          </div>
        ))}
      </div>

      {(stats as any)?.recentApplications?.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Candidatures récentes</h2>
            <Link
              href="/dashboard/applications"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Voir tout →
            </Link>
          </div>
          <div className="flex flex-col">
            {(stats as any).recentApplications.map((app: any) => {
              const badge = STATUS_LABELS[app.status] ?? STATUS_LABELS.DRAFT;
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{app.jobOffer?.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{app.jobOffer?.company}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Send size={18} className="text-indigo-600" />
          </div>
          <p className="text-sm font-semibold text-gray-800 mb-1">Commencez à postuler</p>
          <p className="text-xs text-gray-400 mb-4">Explorez les offres et utilisez Apply with AI</p>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs px-4 py-2 rounded-xl font-medium hover:bg-indigo-700"
          >
            Voir les offres
          </Link>
        </div>
      )}
    </div>
  );
}
