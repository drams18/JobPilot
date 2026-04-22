import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Resume {
  id: string;
  fileName: string;
  fileUrl: string;
  isDefault: boolean;
  parsedJson: any;
  createdAt: string;
}

export function useResumes() {
  return useQuery<Resume[]>({
    queryKey: ['resumes'],
    queryFn: () => apiClient.get('/resumes').then((r) => r.data),
  });
}
