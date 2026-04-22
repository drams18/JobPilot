import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useApplications(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['applications', filters],
    queryFn: () =>
      apiClient.get('/applications', { params: filters }).then((r) => r.data),
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => apiClient.get(`/applications/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}
