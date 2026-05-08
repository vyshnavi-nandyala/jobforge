'use client';
import { useState, useEffect } from 'react';
import { Trash2, MapPin, Calendar, ChevronRight, FileText, CheckCircle2, XCircle, Clock, Trophy, MinusCircle } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { applicationsApi } from '@/lib/api';
import type { Application, AppStatus } from '@/lib/types';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType; accent: string }> = {
  applied:      { label: 'Applied',      color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25',   icon: Clock,         accent: 'border-l-blue-400' },
  interviewing: { label: 'Interviewing', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/25', icon: CheckCircle2,  accent: 'border-l-violet-400' },
  offer:        { label: 'Offer',        color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/25',icon: Trophy,        accent: 'border-l-emerald-400' },
  rejected:     { label: 'Rejected',     color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/25',    icon: XCircle,       accent: 'border-l-red-400' },
  withdrawn:    { label: 'Withdrawn',    color: 'text-slate-500',  bg: 'bg-slate-500/10',  border: 'border-slate-500/25',  icon: MinusCircle,   accent: 'border-l-slate-600' },
};

const PIPELINE: AppStatus[] = ['applied', 'interviewing', 'offer'];

function CompanyAvatar({ name, status }: { name: string; status: AppStatus }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const cfg = STATUS_CONFIG[status];
  return (
    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0', cfg.bg, cfg.border, 'border', cfg.color)}>
      {initials}
    </div>
  );
}

function AppCardSkeleton() {
  return (
    <div className="bg-[#111827] border border-[#1f2937] border-l-4 border-l-[#1f2937] rounded-xl p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-[#1f2937] rounded-xl animate-pulse flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-[#1f2937] rounded animate-pulse w-48 mb-2" />
          <div className="h-3 bg-[#1f2937] rounded animate-pulse w-32" />
        </div>
        <div className="h-6 w-24 bg-[#1f2937] rounded-full animate-pulse" />
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<AppStatus | 'all'>('all');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);

  useEffect(() => {
    applicationsApi.getAll()
      .then(r => setApps(r.data))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: AppStatus) => {
    try {
      await applicationsApi.update(id, { status });
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast.success(`Moved to ${STATUS_CONFIG[status].label}`);
    } catch { toast.error('Failed to update'); }
  };

  const saveNotes = async (id: string, notes: string) => {
    try {
      await applicationsApi.update(id, { notes });
      setApps(prev => prev.map(a => a.id === id ? { ...a, notes } : a));
      setEditingNotes(null);
    } catch { toast.error('Failed to save notes'); }
  };

  const deleteApp = async (id: string) => {
    if (!confirm('Remove this application?')) return;
    try {
      await applicationsApi.delete(id);
      setApps(prev => prev.filter(a => a.id !== id));
      toast.success('Application removed');
    } catch { toast.error('Failed to delete'); }
  };

  const counts = Object.fromEntries(
    (Object.keys(STATUS_CONFIG) as AppStatus[]).map(s => [s, apps.filter(a => a.status === s).length])
  ) as Record<AppStatus, number>;

  const filtered = activeFilter === 'all' ? apps : apps.filter(a => a.status === activeFilter);
  const offerRate = apps.length ? Math.round((counts.offer / apps.length) * 100) : 0;
  const interviewRate = apps.length ? Math.round(((counts.interviewing + counts.offer) / apps.length) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-[#0a0d14]">
      <Sidebar />
      <main className="ml-56 flex-1 p-6 max-w-5xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-100">Application Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {apps.length} applications · {interviewRate}% interview rate · {offerRate}% offer rate
          </p>
        </div>

        {/* Pipeline funnel */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5 mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Hiring Pipeline</h2>
          <div className="flex items-center gap-0">
            {PIPELINE.map((status, i) => {
              const cfg = STATUS_CONFIG[status];
              const Icon = cfg.icon;
              const count = counts[status] || 0;
              const pct = apps.length ? Math.round((count / apps.length) * 100) : 0;
              return (
                <div key={status} className="flex items-center flex-1">
                  <button
                    onClick={() => setActiveFilter(activeFilter === status ? 'all' : status)}
                    className={cn(
                      'flex-1 rounded-xl p-4 border transition-all duration-150 text-left',
                      activeFilter === status
                        ? cn(cfg.bg, cfg.border, 'border')
                        : 'bg-[#0d1117] border-[#1f2937] hover:border-slate-600'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn('w-4 h-4', activeFilter === status ? cfg.color : 'text-slate-600')} />
                      <span className={cn('text-xs font-medium', activeFilter === status ? cfg.color : 'text-slate-500')}>{cfg.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-100">{count}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{pct}% of total</p>
                  </button>
                  {i < PIPELINE.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-slate-700 flex-shrink-0 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {([['all', 'All'], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])] as [string, string][]).map(([key, label]) => {
            const count = key === 'all' ? apps.length : counts[key as AppStatus] || 0;
            const cfg = key !== 'all' ? STATUS_CONFIG[key as AppStatus] : null;
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key as AppStatus | 'all')}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all',
                  isActive && cfg ? cn(cfg.bg, cfg.border, cfg.color) :
                  isActive ? 'bg-violet-600 border-violet-500 text-white' :
                  'bg-[#111827] border-[#1f2937] text-slate-500 hover:text-slate-300 hover:border-slate-600'
                )}
              >
                {label}
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full', isActive ? 'bg-white/20' : 'bg-[#1f2937]')}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <AppCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#111827] border border-[#1f2937] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#1f2937] flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-400 mb-1">
              {activeFilter === 'all' ? 'No applications yet' : `No ${STATUS_CONFIG[activeFilter as AppStatus]?.label} applications`}
            </h3>
            <p className="text-sm text-slate-600 max-w-xs">
              {activeFilter === 'all'
                ? 'Apply to jobs from the Jobs page — they\'ll be tracked here automatically.'
                : 'Switch to "All" to see your other applications.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => {
              const cfg = STATUS_CONFIG[app.status];
              const Icon = cfg.icon;
              const isEditingNote = editingNotes === app.id;
              return (
                <div
                  key={app.id}
                  className={cn(
                    'bg-[#111827] border border-[#1f2937] border-l-4 rounded-xl p-4 transition-all duration-150 hover:border-r-slate-700 hover:border-t-slate-700 hover:border-b-slate-700 group',
                    cfg.accent
                  )}
                >
                  <div className="flex items-start gap-3">
                    <CompanyAvatar name={app.job?.company || '?'} status={app.status} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-sm font-semibold text-slate-100 leading-snug">{app.job?.title || 'Unknown Role'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{app.job?.company || ''}</p>
                        </div>

                        {/* Status selector */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium', cfg.bg, cfg.border, cfg.color)}>
                            <Icon className="w-3 h-3" />
                            <select
                              value={app.status}
                              onChange={e => updateStatus(app.id, e.target.value as AppStatus)}
                              className="bg-transparent border-0 text-xs font-medium cursor-pointer focus:outline-none appearance-none pr-1"
                              style={{ color: 'inherit' }}
                            >
                              {(Object.entries(STATUS_CONFIG) as [AppStatus, typeof STATUS_CONFIG[AppStatus]][]).map(([s, c]) => (
                                <option key={s} value={s} className="bg-[#111827] text-slate-200">{c.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-slate-600 mb-2">
                        {app.job?.location && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.job.location}</span>
                        )}
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Applied {formatDate(app.appliedDate)}</span>
                      </div>

                      {/* Notes */}
                      {isEditingNote ? (
                        <textarea
                          autoFocus
                          defaultValue={app.notes || ''}
                          onBlur={e => saveNotes(app.id, e.target.value)}
                          onKeyDown={e => { if (e.key === 'Escape') setEditingNotes(null); }}
                          rows={2}
                          className="w-full text-xs bg-[#0d1117] border border-[#2d3748] text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500/40 placeholder-slate-700 resize-none"
                          placeholder="Add notes..."
                        />
                      ) : (
                        <button
                          onClick={() => setEditingNotes(app.id)}
                          className="text-xs text-left text-slate-600 hover:text-slate-400 transition-colors italic w-full truncate"
                        >
                          {app.notes || '+ Add notes...'}
                        </button>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteApp(app.id)}
                      className="p-1.5 text-slate-700 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
