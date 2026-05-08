'use client';
import { Briefcase } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = 'Nothing here yet',
  description = 'Get started by triggering a job search.',
  action,
  icon = <Briefcase className="w-10 h-10 text-slate-700" />,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[#111827] border border-[#1f2937] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-400 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm max-w-xs mb-6">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary text-sm">{action.label}</button>
      )}
    </div>
  );
}
