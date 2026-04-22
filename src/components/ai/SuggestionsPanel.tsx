'use client';

import { useState } from 'react';
import { AlertCircle, ArrowUpCircle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Suggestions {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  items: string[];
}

const PRIORITY_CONFIG = {
  HIGH: {
    label: 'Priorité haute — mettez à jour votre CV avant de postuler',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertCircle,
    iconClass: 'text-red-500',
  },
  MEDIUM: {
    label: 'Priorité moyenne — quelques améliorations recommandées',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: ArrowUpCircle,
    iconClass: 'text-amber-500',
  },
  LOW: {
    label: 'Bon match — optimisations mineures possibles',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Info,
    iconClass: 'text-emerald-500',
  },
} as const;

export function SuggestionsPanel({ suggestions }: { suggestions: Suggestions }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const config = PRIORITY_CONFIG[suggestions.priority];
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-4">
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium', config.className)}>
        <Icon size={15} className={config.iconClass} />
        {config.label}
      </div>

      <ul className="flex flex-col gap-2">
        {suggestions.items.map((item, i) => (
          <li
            key={i}
            onClick={() => setChecked((p) => ({ ...p, [i]: !p[i] }))}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none',
              checked[i]
                ? 'bg-gray-50 border-gray-200 opacity-60'
                : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30',
            )}
          >
            <div className="mt-0.5 shrink-0">
              {checked[i] ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
              ) : (
                <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />
              )}
            </div>
            <span
              className={cn(
                'text-sm leading-snug',
                checked[i] ? 'line-through text-gray-400' : 'text-gray-700',
              )}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-gray-400">
        Cochez chaque suggestion une fois appliquée à votre CV.
      </p>
    </div>
  );
}
