import { create } from 'zustand';

interface JobFilters {
  search?: string;
  location?: string;
  workType?: string;
  source?: string;
  sortBy?: 'scraped_at' | 'score';
}

interface JobStore {
  filters: JobFilters;
  setFilters: (f: Partial<JobFilters>) => void;
  resetFilters: () => void;
  selectedJobIds: Set<string>;
  toggleJobSelection: (id: string) => void;
  clearSelection: () => void;
}

export const useJobStore = create<JobStore>((set) => ({
  filters: { sortBy: 'scraped_at' },
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  resetFilters: () => set({ filters: { sortBy: 'scraped_at' } }),
  selectedJobIds: new Set<string>(),
  toggleJobSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedJobIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedJobIds: next };
    }),
  clearSelection: () => set({ selectedJobIds: new Set<string>() }),
}));
