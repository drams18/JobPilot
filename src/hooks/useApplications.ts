import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { getFolder, getStepIndex, type ApplicationFolder } from '@/lib/application-state';

export function useApplications(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['applications', filters],
    queryFn: () =>
      apiClient.get('/applications', { params: filters }).then((r) => r.data),
  });
}

export function useApplicationDetail(id: string | null) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => apiClient.get(`/applications/${id}`).then((r) => r.data),
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll every 3s while automation is active so timeline stays live
      const data = query.state.data as { status?: string } | undefined;
      return data?.status === 'AUTOMATING' ? 3000 : false;
    },
  });
}

export type TimelineItem = {
  id: string;
  type: 'event' | 'log';
  event: string;
  label?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  seq: number;
  skipped?: boolean;
};

// Fix 3: merge ApplicationEvent + AutomationLog sorted by (createdAt, seq)
export function useApplicationTimeline(id: string | null) {
  const { data, ...rest } = useApplicationDetail(id);

  const timeline: TimelineItem[] = [];

  if (data) {
    // Business events (status changes, documents)
    for (const ev of (data.events ?? []) as Array<{
      id: string;
      eventType: string;
      detailsJson: unknown;
      createdAt: string;
    }>) {
      timeline.push({
        id: `event-${ev.id}`,
        type: 'event',
        event: ev.eventType,
        details: (ev.detailsJson as Record<string, unknown>) ?? {},
        createdAt: ev.createdAt,
        seq: 0,
      });
    }

    // Automation logs
    for (const log of (data.automationLogs ?? []) as Array<{
      id: string;
      event: string;
      payload: unknown;
      createdAt: string;
    }>) {
      const payload = (log.payload ?? {}) as Record<string, unknown>;
      timeline.push({
        id: `log-${log.id}`,
        type: 'log',
        event: log.event,
        details: payload,
        createdAt: log.createdAt,
        seq: (payload.seq as number) ?? 0,
        skipped: payload.skipped === true,
      });
    }

    // Fix 3: stable sort by createdAt then seq
    timeline.sort((a, b) => {
      const tDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (tDiff !== 0) return tDiff;
      return a.seq - b.seq;
    });
  }

  return { data, timeline, ...rest };
}

// Returns all applications grouped by folder (computed from status)
export function useApplicationsByFolder() {
  const { data: applications, ...rest } = useApplications({ limit: 200 });

  const byFolder: Record<ApplicationFolder, unknown[]> = {
    TO_APPLY: [],
    IN_PROGRESS: [],
    SENT: [],
    INTERVIEW: [],
    REJECTED: [],
    ARCHIVED: [],
  };

  if (Array.isArray(applications?.data ?? applications)) {
    const list = Array.isArray(applications) ? applications : (applications?.data ?? []);
    for (const app of list) {
      const folder = getFolder(app.status);
      byFolder[folder].push(app);
    }
  }

  return { byFolder, rawApplications: applications, ...rest };
}
