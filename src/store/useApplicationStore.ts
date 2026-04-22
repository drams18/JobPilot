import { create } from 'zustand';

interface ApplicationStore {
  activeJobId: string | null;
  isApplyModalOpen: boolean;
  openApplyModal: (jobId: string) => void;
  closeApplyModal: () => void;
}

export const useApplicationStore = create<ApplicationStore>((set) => ({
  activeJobId: null,
  isApplyModalOpen: false,
  openApplyModal: (jobId) => set({ activeJobId: jobId, isApplyModalOpen: true }),
  closeApplyModal: () => set({ isApplyModalOpen: false, activeJobId: null }),
}));
