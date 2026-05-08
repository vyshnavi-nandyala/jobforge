'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import JobCard from '@/components/jobs/JobCard';
import JobFilters from '@/components/jobs/JobFilters';
import JobDetailsModal from '@/components/jobs/JobDetailsModal';
import EmptyState from '@/components/common/EmptyState';
import { JobCardSkeleton } from '@/components/common/LoadingSkeleton';
import { jobsApi } from '@/lib/api';
import type { Job, JobFilters as Filters } from '@/lib/types';
import toast from 'react-hot-toast';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState<Partial<Filters>>({});
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean | number> = { limit: 100, sort_by: 'matched_score' };
      if (filters.search) params.search = filters.search;
      if (filters.source) params.source = filters.source;
      if (filters.remote) params.remote = filters.remote === 'true';
      if (filters.savedOnly) params.saved_only = true;
      const res = await jobsApi.getAll(params as never);
      setJobs(res.data);
      setTotal(res.total);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSave = async (id: string) => {
    try {
      const res = await jobsApi.toggleSave(id);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, isSaved: res.saved } : j));
    } catch { toast.error('Failed to save'); }
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      await jobsApi.triggerSearch();
      toast.success('Job search started!');
      setTimeout(fetchJobs, 3000);
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-56 flex-1 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Job Matches</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-500">{total} Data Engineer roles</span>
              {total > 0 && (
                <>
                  <span className="text-slate-700">·</span>
                  <span className="text-xs text-emerald-500">{jobs.filter(j => j.matchedScore >= 0.85).length} excellent matches</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-xs text-teal-500">{jobs.filter(j => j.remote).length} remote</span>
                </>
              )}
            </div>
          </div>
          <button onClick={handleSearch} disabled={searching} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all duration-150 shadow-lg shadow-violet-900/30 disabled:opacity-50">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {searching ? 'Searching...' : 'Search Now'}
          </button>
        </div>

        <div className="bg-[#0d1117] border border-[#1f2937] rounded-2xl p-4 mb-5">
          <JobFilters filters={filters} onChange={f => setFilters(p => ({ ...p, ...f }))} onClear={() => setFilters({})} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            title="No jobs found"
            description="Try clearing filters or clicking 'Search Now' to find fresh Data Engineer roles."
            action={{ label: 'Search Now', onClick: handleSearch }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onSave={handleSave}
                onSelect={setSelectedJob}
                selected={selectedJob?.id === job.id}
              />
            ))}
          </div>
        )}

        {selectedJob && (
          <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} onApplied={fetchJobs} />
        )}
      </main>
    </div>
  );
}
