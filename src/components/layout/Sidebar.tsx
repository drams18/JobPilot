'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, ClipboardList, Files, Settings, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/jobs', label: 'Offres', icon: Briefcase },
  { href: '/dashboard/applications', label: 'Candidatures', icon: ClipboardList },
  { href: '/dashboard/resumes', label: 'Mes CV', icon: Files },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-[18px]">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <Zap size={14} className="text-white fill-white" />
        </div>
        <span className="font-bold text-gray-900 tracking-tight text-sm">Apply Copilot</span>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
              )}
            >
              <Icon
                size={16}
                className={cn(
                  'shrink-0 transition-transform duration-150 group-hover:scale-110',
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600',
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 w-full"
        >
          <LogOut size={16} className="shrink-0 group-hover:scale-110 transition-transform duration-150" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
