'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/dashboard/resumes': 'Mes CV',
  '/dashboard/settings': 'Préférences',
};

export function TopBar() {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const title = pathname.startsWith('/dashboard/resumes/')
    ? 'Optimisation CV'
    : (PAGE_TITLES[pathname] ?? 'Dashboard');

  return (
    <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0">
      <p className="text-sm font-semibold text-gray-900">{title}</p>

      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
          <Bell size={15} />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
          <span className="text-xs text-gray-400 hidden sm:block">{user?.email}</span>
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
        </div>
      </div>
    </header>
  );
}
