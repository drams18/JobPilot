'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  Inbox,
  Loader2,
  Send,
  Calendar,
  XCircle,
  Archive,
  type LucideIcon,
} from 'lucide-react';
import { FOLDER_META, type ApplicationFolder, canDrop } from '@/lib/application-state';

const FOLDER_ICONS: Record<ApplicationFolder, LucideIcon> = {
  TO_APPLY: Inbox,
  IN_PROGRESS: Loader2,
  SENT: Send,
  INTERVIEW: Calendar,
  REJECTED: XCircle,
  ARCHIVED: Archive,
};

const FOLDERS: ApplicationFolder[] = [
  'TO_APPLY',
  'IN_PROGRESS',
  'SENT',
  'INTERVIEW',
  'REJECTED',
  'ARCHIVED',
];

function FolderItem({
  folder,
  count,
  active,
  onClick,
  draggingStatus,
}: {
  folder: ApplicationFolder;
  count: number;
  active: boolean;
  onClick: () => void;
  draggingStatus: string | null;
}) {
  const meta = FOLDER_META[folder];
  const Icon = FOLDER_ICONS[folder];

  // Fix 5: disable drop target for IN_PROGRESS and when source is AUTOMATING
  const droppable = draggingStatus !== null && canDrop(draggingStatus ?? '', folder);
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder}`,
    disabled: !droppable,
  });

  const isHighlighted = isOver && droppable;
  const isDimmed = draggingStatus !== null && !droppable;

  return (
    <div ref={setNodeRef}>
      <button
        onClick={onClick}
        className={[
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
          active
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100',
          isHighlighted ? 'ring-2 ring-indigo-400 bg-indigo-50' : '',
          isDimmed ? 'opacity-40' : '',
        ].join(' ')}
      >
        <Icon
          size={16}
          className={[
            folder === 'IN_PROGRESS' && 'animate-spin',
            active ? 'text-indigo-600' : 'text-gray-400',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <span className="flex-1 text-left">{meta.label}</span>
        {count > 0 && (
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
              active ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {count}
          </span>
        )}
      </button>
    </div>
  );
}

export function InboxSidebar({
  counts,
  activeFolder,
  onFolderChange,
  draggingStatus,
}: {
  counts: Record<ApplicationFolder, number>;
  activeFolder: ApplicationFolder;
  onFolderChange: (folder: ApplicationFolder) => void;
  draggingStatus: string | null;
}) {
  return (
    <aside className="w-56 shrink-0 flex flex-col gap-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-1">
        Dossiers
      </p>
      {FOLDERS.slice(0, 4).map((folder) => (
        <FolderItem
          key={folder}
          folder={folder}
          count={counts[folder]}
          active={activeFolder === folder}
          onClick={() => onFolderChange(folder)}
          draggingStatus={draggingStatus}
        />
      ))}
      <div className="my-1 border-t border-gray-100" />
      {FOLDERS.slice(4).map((folder) => (
        <FolderItem
          key={folder}
          folder={folder}
          count={counts[folder]}
          active={activeFolder === folder}
          onClick={() => onFolderChange(folder)}
          draggingStatus={draggingStatus}
        />
      ))}
    </aside>
  );
}
