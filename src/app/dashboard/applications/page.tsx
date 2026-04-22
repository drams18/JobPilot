'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';

import { useApplications } from '@/hooks/useApplications';
import { InboxSidebar } from '@/components/inbox/InboxSidebar';
import { ApplicationCard } from '@/components/inbox/ApplicationCard';
import { ApplicationDetail } from '@/components/inbox/ApplicationDetail';
import {
  getFolder,
  getFolderCounts,
  canDrop,
  folderToStatus,
  type ApplicationFolder,
} from '@/lib/application-state';
import { apiClient } from '@/lib/api-client';
import { useApplicationStore } from '@/store/useApplicationStore';

export default function ApplicationsPage() {
  const { data: applications, isLoading } = useApplications({ limit: 200 });
  const qc = useQueryClient();
  const { openApplyModal } = useApplicationStore();

  const [activeFolder, setActiveFolder] = useState<ApplicationFolder>('TO_APPLY');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // D&D state — tracks dragged card's status for Fix 5 guard logic
  const [draggingStatus, setDraggingStatus] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/applications/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Candidature déplacée');
    },
    onError: () => toast.error('Erreur lors du déplacement'),
  });

  const appList: Array<{
    id: string;
    status: string;
    jobOfferId: string;
    lastSuccessfulStep?: string | null;
    appliedAt?: string | null;
    jobOffer?: { id?: string; title?: string; company?: string; location?: string; jobUrl?: string } | null;
    matchScore?: number | null;
  }> = Array.isArray(applications) ? applications : [];

  const counts = getFolderCounts(appList);

  const visibleApps = appList.filter((app) => {
    if (getFolder(app.status) !== activeFolder) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      app.jobOffer?.title?.toLowerCase().includes(q) ||
      app.jobOffer?.company?.toLowerCase().includes(q)
    );
  });

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const status = e.active.data.current?.status as string | undefined;
    setDraggingStatus(status ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setDraggingStatus(null);
      const { active, over } = e;
      if (!over) return;

      const appId = active.data.current?.applicationId as string | undefined;
      const sourceStatus = active.data.current?.status as string | undefined;
      const targetFolder = over.id.toString().replace('folder-', '') as ApplicationFolder;

      if (!appId || !sourceStatus) return;
      if (!canDrop(sourceStatus, targetFolder)) return;

      const newStatus = folderToStatus(targetFolder);
      if (!newStatus || newStatus === sourceStatus) return;

      statusMutation.mutate({ id: appId, status: newStatus });
    },
    [statusMutation],
  );

  const handleStartAutomation = useCallback(
    (applicationId: string) => {
      // Resolve jobOfferId from the local application list and open the AI modal
      const app = appList.find((a) => a.id === applicationId);
      const jobOfferId = app?.jobOfferId ?? app?.jobOffer?.id;
      if (jobOfferId) openApplyModal(jobOfferId);
    },
    [openApplyModal, appList],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-4rem)] gap-0 -mx-6 -mt-4">
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-gray-200 bg-gray-50/50 p-4 overflow-y-auto">
          <InboxSidebar
            counts={counts}
            activeFolder={activeFolder}
            onFolderChange={(f) => {
              setActiveFolder(f);
              setSelectedAppId(null);
            }}
            draggingStatus={draggingStatus}
          />
        </div>

        {/* Card list */}
        <div
          className={`flex flex-col overflow-hidden transition-all ${selectedAppId ? 'flex-1' : 'flex-1'}`}
        >
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
            <h2 className="font-semibold text-gray-800 text-sm shrink-0">
              {counts[activeFolder]} candidature{counts[activeFolder] !== 1 ? 's' : ''}
            </h2>
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto p-4">
            {visibleApps.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-sm font-medium">Aucune candidature</p>
                {activeFolder === 'TO_APPLY' && (
                  <p className="text-xs mt-1">
                    Utilisez &quot;Apply with AI&quot; depuis les offres d&apos;emploi
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    selected={selectedAppId === app.id}
                    onClick={() =>
                      setSelectedAppId((prev) => (prev === app.id ? null : app.id))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedAppId && (
          <ApplicationDetail
            applicationId={selectedAppId}
            onClose={() => setSelectedAppId(null)}
            onStartAutomation={handleStartAutomation}
          />
        )}
      </div>

      {/* Drag overlay (ghost card while dragging) */}
      <DragOverlay>
        {draggingStatus && (
          <div className="w-64 bg-white border border-indigo-300 rounded-xl shadow-lg px-4 py-3 opacity-90 text-sm font-medium text-gray-700">
            Déplacer la candidature…
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
