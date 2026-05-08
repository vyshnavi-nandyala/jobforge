'use client';
import { useState, useEffect } from 'react';
import { Trash2, ExternalLink } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import EmptyState from '@/components/common/EmptyState';
import { applicationsApi } from '@/lib/api';
import type { Application, AppStatus } from '@/lib/types';
import { formatDate, statusConfig, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await applicationsApi.getAll();
      setApps(res.data);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); }, []);

  const updateStatus = async (id: string, status: AppStatus) => {
    try {
      await applicationsApi.update(id, { status });
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  };

  const updateNotes = async (id: string, notes: string) => {
    try {
      await applicationsApi.update(id, { notes });
    } catch { toast.error('Failed to update notes'); }
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
    (['applied', 'interviewing', 'offer', 'rejected', 'withdrawn'] as AppStatus[]).map(s => [s, apps.filter(a => a.status === s).length])
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-56 flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-100">Application Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">{apps.length} applications tracked</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {(Object.entries(statusConfig) as [AppStatus, typeof statusConfig[AppStatus]][]).map(([status, cfg]) => (
            <div key={status} className="card p-3 text-center">
              <p className="text-xl font-bold text-slate-100">{counts[status] || 0}</p>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', cfg.bg, cfg.color)}>{cfg.label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-[#1f2937] rounded w-48 mb-2" />
                <div className="h-3 bg-[#1f2937] rounded w-32" />
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Apply to jobs from the Jobs page and they'll be tracked here automatically."
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#1f2937] bg-[#0a0d14]">
                <tr>
                  {['Company / Role', 'Applied', 'Status', 'Notes', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937]">
                {apps.map(app => {
                  const cfg = statusConfig[app.status];
                  return (
                    <tr key={app.id} className="hover:bg-[#1f2937]/50 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-200">{app.job?.title || 'Unknown Role'}</p>
                        <p className="text-xs text-slate-500">{app.job?.company || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-400">{formatDate(app.appliedDate)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={app.status}
                          onChange={e => updateStatus(app.id, e.target.value as AppStatus)}
                          className={cn('text-xs font-medium px-2 py-1 rounded-md border bg-transparent cursor-pointer', cfg.bg, cfg.color)}
                        >
                          {Object.entries(statusConfig).map(([s, c]) => (
                            <option key={s} value={s} className="bg-[#111827] text-slate-200">{c.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className="text-xs bg-transparent border-0 text-slate-400 placeholder-slate-700 focus:outline-none w-full"
                          placeholder="Add notes..."
                          defaultValue={app.notes || ''}
                          onBlur={e => updateNotes(app.id, e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {app.job && (
                            <a href={`/jobs`} className="p-1.5 text-slate-600 hover:text-violet-400 rounded-md">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button onClick={() => deleteApp(app.id)} className="p-1.5 text-slate-600 hover:text-red-400 rounded-md">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
