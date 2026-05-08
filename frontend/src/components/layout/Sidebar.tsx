'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, CheckSquare, Settings, FileText, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/applications', icon: CheckSquare, label: 'Applications' },
  { href: '/resume-manager', icon: FileText, label: 'Resumes' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#111827] border-r border-[#1f2937] flex flex-col z-40">
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-[#1f2937]">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-100 text-sm leading-none">JobForge</p>
          <p className="text-xs text-slate-600 mt-0.5">AI Job Search</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-[#1f2937]'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#1f2937]">
        <div className="text-xs text-slate-600 px-3 py-2">
          <p className="font-medium text-slate-500">JobForge v1.0</p>
          <p className="mt-0.5">AI-powered for Data Engineers</p>
        </div>
      </div>
    </aside>
  );
}
