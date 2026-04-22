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
}

export const useJobStore = create<JobStore>((set) => ({
  filters: { sortBy: 'scraped_at' },
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  resetFilters: () => set({ filters: { sortBy: 'scraped_at' } }),
}));
