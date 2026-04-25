import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ParsedResumeJson {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  skills?: string[];
  experiences?: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
}

export interface Resume {
  id: string;
  fileName: string;
  fileUrl: string;
  isDefault: boolean;
  parsedJson: ParsedResumeJson | null;
  thumbnail: string | null;
  createdAt: string;
}

export interface ResumeVersion {
  id: string;
  createdAt: string;
  jobText: string | null;
  optimizedJson: ParsedResumeJson;
}

export function useResumes() {
  return useQuery<Resume[]>({
    queryKey: ['resumes'],
    queryFn: () => apiClient.get('/resumes').then((r) => r.data),
  });
}

export function useResumeVersions(resumeId: string) {
  return useQuery<ResumeVersion[]>({
    queryKey: ['resume-versions', resumeId],
    queryFn: () => apiClient.get(`/resume/${resumeId}/versions`).then((r) => r.data),
    enabled: !!resumeId,
  });
}
