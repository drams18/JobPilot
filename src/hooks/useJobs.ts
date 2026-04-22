import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  location?: string;
  salaryRange?: string;
  source: string;
  scrapedAt: string;
  matchScore?: number | null;
  isActive: boolean;
}

export function useJobs(filters: Record<string, any> = {}) {
  return useQuery<{ data: JobOffer[]; meta: any }>({
    queryKey: ['jobs', filters],
    queryFn: () => apiClient.get('/jobs', { params: filters }).then((r) => r.data),
  });
}
