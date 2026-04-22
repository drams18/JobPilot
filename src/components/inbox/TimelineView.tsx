'use client';

import { getStepLabel, getStepColor } from '@/lib/application-state';
import type { TimelineItem } from '@/hooks/useApplications';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  SkipForward,
} from 'lucide-react';

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function EventIcon({ event, skipped }: { event: string; skipped?: boolean }) {
  if (skipped) return <SkipForward size={14} className="text-gray-400" />;
  if (event === 'submitted') return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (event === 'error' || event === 'cancelled') return <AlertCircle size={14} className="text-red-500" />;
  if (event === 'STATUS_CHANGED') return <Info size={14} className="text-indigo-500" />;
  if (event === 'heartbeat') return <Clock size={14} className="text-gray-300" />;
  return (
    <span className="block h-2 w-2 rounded-full bg-current mt-0.5" />
  );
}

function EventLabel({ item }: { item: TimelineItem }) {
  if (item.type === 'event') {
    // Business event
    const details = item.details as { from?: string; to?: string; via?: string } | undefined;
    if (details?.from && details?.to) {
      return (
        <span>
          <span className="font-medium">{details.to}</span>
          {details.via && <span className="text-gray-400"> · via {details.via}</span>}
        </span>
      );
    }
    return <span className="font-medium">{item.event}</span>;
  }

  // Automation log
  const label = getStepLabel(item.event);
  const isError = item.event === 'error';
  const errorMsg = isError ? (item.details as { message?: string })?.message : undefined;

  return (
    <span>
      <span className={item.skipped ? 'text-gray-400 italic' : ''}>{label}</span>
      {item.skipped && <span className="text-gray-400 text-xs"> (repris)</span>}
      {errorMsg && <span className="text-red-500 text-xs block mt-0.5">{errorMsg}</span>}
    </span>
  );
}

export function TimelineView({
  items,
  isLive,
}: {
  items: TimelineItem[];
  isLive?: boolean;
}) {
  const visible = items.filter((i) => i.event !== 'heartbeat' && i.event !== 'process_exit');

  if (!visible.length) {
    return (
      <p className="text-xs text-gray-400 text-center py-6">Aucun événement</p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-0">
      {visible.map((item, idx) => {
        const isLast = idx === visible.length - 1;
        const colorClass = item.type === 'log' ? getStepColor(item.event) : 'text-indigo-500';

        return (
          <li key={item.id} className="flex gap-3 pb-4">
            {/* Spine */}
            <div className="flex flex-col items-center">
              <div className={`mt-0.5 ${colorClass}`}>
                <EventIcon event={item.event} skipped={item.skipped} />
              </div>
              {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <span className={`text-xs ${item.skipped ? 'text-gray-400' : 'text-gray-700'}`}>
                  <EventLabel item={item} />
                </span>
                <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                  {formatRelative(item.createdAt)}
                </span>
              </div>
            </div>
          </li>
        );
      })}

      {/* Live pulse on last item */}
      {isLive && visible.length > 0 && (
        <li className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="relative flex h-2.5 w-2.5 mt-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
            </span>
          </div>
          <span className="text-xs text-blue-500 font-medium pt-0.5">En cours…</span>
        </li>
      )}
    </ol>
  );
}
