import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface PreviewPack {
  applicationId: string;
  matchScore: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    locationMatch: boolean;
  };
  suggestions: { priority: 'HIGH' | 'MEDIUM' | 'LOW'; items: string[] };
  coverLetter: string;
  formFill: Record<string, string>;
}

export function useApplyPrepare() {
  return useMutation<PreviewPack, Error, { jobOfferId: string; resumeId: string }>({
    mutationFn: (body) =>
      apiClient.post('/apply/prepare', body).then((r) => r.data),
  });
}
