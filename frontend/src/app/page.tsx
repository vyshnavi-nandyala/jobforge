'use client';
import { useState, useEffect } from 'react';
import { Briefcase, CheckSquare, Bookmark, Target, RefreshCw, Sparkles, Loader2, Users, TrendingUp, ArrowRight, Upload, Settings, Zap, Circle } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import JobCard from '@/components/jobs/JobCard';
import JobDetailsModal from '@/components/jobs/JobDetailsModal';
import { jobsApi, applicationsApi } from '@/lib/api';
import type { Job } from '@/lib/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ label, value, sub, icon: Icon, gradient, ring }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; gradient: string; ring: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 ${ring}`} style={{ background: 'rgba(17,24,39,0.8)' }}>
      <div className={`absolute inset-0 opacity-10 ${gradient}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center opacity-80 ${gradient}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <p className="text-3xl font-bold text-slate-100 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-600 mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#1f2937] p-5 bg-[#111827]">
      <div className="flex justify-between mb-3">
        <div className="h-3 w-20 bg-[#1f2937] rounded animate-pulse" />
        <div className="w-8 h-8 bg-[#1f2937] rounded-xl animate-pulse" />
      </div>
      <div className="h-8 w-16 bg-[#1f2937] rounded animate-pulse mb-2" />
      <div className="h-3 w-28 bg-[#1f2937] rounded animate-pulse" />
    </div>
  );
}

function JobCardSkeleton() {
  return (
    <div className="bg-[#111827] border border-[#1f2937] border-l-4 border-l-[#1f2937] rounded-xl p-4">
      <div className="flex gap-3 mb-3">
        <div className="w-9 h-9 bg-[#1f2937] rounded-lg animate-pulse flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-[#1f2937] rounded animate-pulse mb-2 w-3/4" />
          <div className="h-3 bg-[#1f2937] rounded animate-pulse w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-3 bg-[#1f2937] rounded animate-pulse w-24" />
        <div className="h-3 bg-[#1f2937] rounded animate-pulse w-20" />
      </div>
      <div className="flex gap-1.5 mb-3">
        {[40, 32, 36].map(w => <div key={w} className={`h-5 bg-[#1f2937] rounded animate-pulse`} style={{ width: `${w}px` }} />)}
      </div>
      <div className="flex justify-between">
        <div className="h-5 w-20 bg-[#1f2937] rounded-full animate-pulse" />
        <div className="h-5 w-24 bg-[#1f2937] rounded-full animate-pulse" />
      </div>
    </div>
  );
}

const SOURCE_COLORS: Record<string, string> = {
  linkedin: '#0077b5', indeed: '#2164f3', glassdoor: '#0caa41',
  ziprecruiter: '#4caf50', monster: '#6d1ee4',
};

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const router = useRouter();

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
      toast.success('Job search started! New results will appear shortly.');
      setTimeout(fetchData, 4000);
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

  const topJobs = jobs.slice(0, 6);
  const savedCount = jobs.filter(j => j.isSaved).length;
  const avgScore = jobs.length ? Math.round(jobs.reduce((s, j) => s + j.matchedScore, 0) / jobs.length * 100) : 0;
  const excellentCount = jobs.filter(j => j.matchedScore >= 0.85).length;
  const remoteCount = jobs.filter(j => j.remote).length;

  const sourceCounts = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.source] = (acc[j.source] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: 'Jobs Found', value: jobs.length.toString(), sub: `${excellentCount} excellent matches`, icon: Briefcase, gradient: 'bg-gradient-to-br from-violet-500 to-violet-700', ring: 'border-violet-500/20' },
    { label: 'Applications', value: applications.toString(), sub: 'tracked this session', icon: CheckSquare, gradient: 'bg-gradient-to-br from-blue-500 to-blue-700', ring: 'border-blue-500/20' },
    { label: 'Saved Jobs', value: savedCount.toString(), sub: 'bookmarked for later', icon: Bookmark, gradient: 'bg-gradient-to-br from-amber-500 to-amber-700', ring: 'border-amber-500/20' },
    { label: 'Avg Match Score', value: `${avgScore}%`, sub: `${remoteCount} remote roles`, icon: Target, gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700', ring: 'border-emerald-500/20' },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0d14]">
      <Sidebar />
      <main className="ml-56 flex-1 p-6 max-w-[1400px]">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-500 font-medium">Live · Updated just now</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{greeting()}, welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Your AI-powered Data Engineer job search is running.</p>
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all duration-150 shadow-lg shadow-violet-900/40 disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {searching ? 'Searching...' : 'Search Jobs'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : stats.map(s => <StatCard key={s.label} {...s} />)
          }
        </div>

        {/* Main content: job grid + sidebar panel */}
        <div className="flex gap-5">

          {/* Job matches */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-200">Top Matches</h2>
              <button
                onClick={() => router.push('/jobs')}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                View all {jobs.length} jobs <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)}
              </div>
            ) : topJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-[#111827] border border-[#1f2937] rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-[#1f2937] flex items-center justify-center mb-4">
                  <Briefcase className="w-7 h-7 text-slate-600" />
                </div>
                <h3 className="font-semibold text-slate-400 mb-1">No jobs yet</h3>
                <p className="text-sm text-slate-600 max-w-xs mb-5">Click "Search Jobs" to scrape Data Engineer roles from LinkedIn, Indeed, Glassdoor and more.</p>
                <button onClick={handleSearch} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors">
                  <Sparkles className="w-4 h-4" />Search Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {topJobs.map(job => (
                  <JobCard key={job.id} job={job} onSave={handleSave} onSelect={setSelectedJob} selected={selectedJob?.id === job.id} />
                ))}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="w-72 flex-shrink-0 space-y-4">

            {/* Job sources breakdown */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Sources</h3>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#1f2937] animate-pulse" />
                      <div className="h-3 flex-1 bg-[#1f2937] rounded animate-pulse" />
                      <div className="h-3 w-6 bg-[#1f2937] rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : Object.keys(sourceCounts).length === 0 ? (
                <p className="text-xs text-slate-600">No jobs scraped yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([src, count]) => {
                    const pct = Math.round((count / jobs.length) * 100);
                    const color = SOURCE_COLORS[src] || '#6366f1';
                    const label = src.charAt(0).toUpperCase() + src.slice(1);
                    return (
                      <div key={src}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">{label}</span>
                          <span className="text-xs text-slate-500">{count} jobs</span>
                        </div>
                        <div className="h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Quick Setup</h3>
              <div className="space-y-1">
                {[
                  { icon: Upload, label: 'Upload your resume', sub: 'For AI customization', href: '/resume-manager', done: false },
                  { icon: Settings, label: 'Set your skills', sub: 'Improve match scores', href: '/settings', done: false },
                  { icon: Zap, label: 'Run a job search', sub: 'Find fresh roles now', onClick: handleSearch, done: jobs.length > 0 },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.onClick || (() => router.push(item.href!))}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#1f2937] transition-colors text-left group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${item.done ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-[#1f2937] group-hover:bg-[#374151]'}`}>
                      {item.done
                        ? <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        : <item.icon className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${item.done ? 'text-emerald-400 line-through opacity-60' : 'text-slate-300'}`}>{item.label}</p>
                      <p className="text-xs text-slate-600">{item.sub}</p>
                    </div>
                    {!item.done && <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Match quality breakdown */}
            {!loading && jobs.length > 0 && (
              <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Match Quality</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Excellent (85%+)', count: jobs.filter(j => j.matchedScore >= 0.85).length, color: 'bg-emerald-400', text: 'text-emerald-400' },
                    { label: 'Good (70–84%)', count: jobs.filter(j => j.matchedScore >= 0.70 && j.matchedScore < 0.85).length, color: 'bg-blue-400', text: 'text-blue-400' },
                    { label: 'Fair (50–69%)', count: jobs.filter(j => j.matchedScore >= 0.50 && j.matchedScore < 0.70).length, color: 'bg-amber-400', text: 'text-amber-400' },
                    { label: 'Low (<50%)', count: jobs.filter(j => j.matchedScore < 0.50).length, color: 'bg-slate-600', text: 'text-slate-500' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${row.color}`} />
                      <span className="text-xs text-slate-500 flex-1">{row.label}</span>
                      <span className={`text-xs font-semibold ${row.text}`}>{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedJob && (
        <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} onApplied={fetchData} />
      )}
    </div>
  );
}
