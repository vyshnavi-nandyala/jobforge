'use client';
import { useState, useEffect } from 'react';
import { Briefcase, CheckSquare, Bookmark, TrendingUp, RefreshCw, Sparkles, Loader2, Users, Target } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import JobCard from '@/components/jobs/JobCard';
import JobDetailsModal from '@/components/jobs/JobDetailsModal';
import EmptyState from '@/components/common/EmptyState';
import { StatSkeleton, JobCardSkeleton } from '@/components/common/LoadingSkeleton';
import { jobsApi, applicationsApi } from '@/lib/api';
import type { Job } from '@/lib/types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        jobsApi.getAll({ limit: 20, sort_by: 'matched_score' }),
        applicationsApi.getAll(),
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data.length);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = async () => {
    setSearching(true);
    try {
      await jobsApi.triggerSearch();
      toast.success('Job search started! Results will appear shortly.');
      setTimeout(fetchData, 3000);
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async (id: string) => {
    try {
      const res = await jobsApi.toggleSave(id);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, isSaved: res.saved } : j));
    } catch { toast.error('Failed to save'); }
  };

  const topJobs = jobs.slice(0, 3);
  const savedCount = jobs.filter(j => j.isSaved).length;
  const avgScore = jobs.length ? Math.round(jobs.reduce((s, j) => s + j.matchedScore, 0) / jobs.length * 100) : 0;
  const lowApplicants = jobs.filter(j => (j.applicantsCount ?? 999) < 100).length;

  const stats = [
    { label: 'Jobs Found', value: jobs.length.toString(), icon: Briefcase, color: 'violet' },
    { label: 'Applications', value: applications.toString(), icon: CheckSquare, color: 'blue' },
    { label: 'Saved Jobs', value: savedCount.toString(), icon: Bookmark, color: 'amber' },
    { label: 'Avg Match', value: `${avgScore}%`, icon: Target, color: 'green' },
    { label: 'Low Competition', value: lowApplicants.toString(), icon: Users, color: 'cyan' },
    { label: 'Top Score', value: jobs[0] ? `${Math.round(jobs[0].matchedScore * 100)}%` : '—', icon: Sparkles, color: 'pink' },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-56 flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">AI-powered Data Engineer job search</p>
          </div>
          <button onClick={handleSearch} disabled={searching} className="btn-primary flex items-center gap-2 text-sm">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {searching ? 'Searching...' : 'Search Jobs'}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {loading ? Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />) : stats.map(s => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">{s.label}</p>
                <div className={`w-7 h-7 rounded-lg bg-${s.color}-500/10 flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 text-${s.color}-400`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">Top Matches</h2>
            <a href="/jobs" className="text-xs text-violet-400 hover:text-violet-300">View all →</a>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : topJobs.length === 0 ? (
            <EmptyState
              title="No jobs yet"
              description="Click 'Search Jobs' to find Data Engineer roles across LinkedIn, Indeed, Glassdoor, and more."
              action={{ label: 'Search Now', onClick: handleSearch }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topJobs.map(job => (
                <JobCard key={job.id} job={job} onSave={handleSave} onSelect={setSelectedJob} selected={selectedJob?.id === job.id} />
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-200 mb-4">Quick Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🔍', title: 'Search Daily', desc: 'Jobs are scraped automatically at 9 AM. Click "Search Jobs" for an on-demand search.' },
              { icon: '📄', title: 'Upload Resume', desc: 'Go to Resume Manager → upload your base DOCX. AI will customize it per job.' },
              { icon: '🎯', title: 'Set Preferences', desc: 'Configure your skills and salary range in Settings for better job matching.' },
            ].map(tip => (
              <div key={tip.title} className="flex gap-3 p-3 rounded-lg bg-[#0a0d14] border border-[#1f2937]">
                <span className="text-2xl">{tip.icon}</span>
                <div>
                  <p className="text-sm font-medium text-slate-300">{tip.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedJob && (
          <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} onApplied={fetchData} />
        )}
      </main>
    </div>
  );
}
