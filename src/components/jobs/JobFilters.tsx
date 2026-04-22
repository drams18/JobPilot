'use client';

import { useJobStore } from '@/store/useJobStore';

export function JobFilters() {
  const { filters, setFilters, resetFilters } = useJobStore();

  return (
    <div className="flex flex-wrap gap-3 bg-white border border-gray-200 rounded-2xl p-4">
      <input
        placeholder="Rechercher…"
        value={filters.search ?? ''}
        onChange={(e) => setFilters({ search: e.target.value || undefined })}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <input
        placeholder="Localisation"
        value={filters.location ?? ''}
        onChange={(e) => setFilters({ location: e.target.value || undefined })}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <select
        value={filters.sortBy ?? 'scraped_at'}
        onChange={(e) => setFilters({ sortBy: e.target.value as 'scraped_at' | 'score' })}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <option value="scraped_at">Plus récentes</option>
        <option value="score">Meilleur match</option>
      </select>
      <button
        onClick={resetFilters}
        className="text-xs text-gray-400 hover:text-gray-700 px-2"
      >
        Réinitialiser
      </button>
    </div>
  );
}
