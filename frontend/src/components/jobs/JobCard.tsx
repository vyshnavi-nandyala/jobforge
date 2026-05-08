'use client';
import { Bookmark, BookmarkCheck, MapPin, Users, DollarSign, Clock, Sparkles, TrendingUp } from 'lucide-react';
import type { Job } from '@/lib/types';
import { cn, formatSalary, formatRelative, sourceConfig } from '@/lib/utils';

interface Props {
  job: Job;
  onSave: (id: string) => void;
  onSelect: (job: Job) => void;
  selected?: boolean;
}

function matchGrade(score: number) {
  if (score >= 0.85) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', bar: 'bg-emerald-400', accent: 'border-l-emerald-400' };
  if (score >= 0.70) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/25', bar: 'bg-blue-400', accent: 'border-l-blue-400' };
  if (score >= 0.50) return { label: 'Fair', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25', bar: 'bg-amber-400', accent: 'border-l-amber-400' };
  return { label: 'Low', color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/25', bar: 'bg-slate-500', accent: 'border-l-slate-600' };
}

function CompanyAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ backgroundColor: `${color}25`, border: `1px solid ${color}40`, color }}
    >
      {initials}
    </div>
  );
}

export default function JobCard({ job, onSave, onSelect, selected }: Props) {
  const src = sourceConfig[job.source] || { label: job.source, color: '#6366f1' };
  const grade = matchGrade(job.matchedScore);
  const pct = Math.round(job.matchedScore * 100);

  return (
    <div
      onClick={() => onSelect(job)}
      className={cn(
        'relative flex flex-col bg-[#111827] rounded-xl border border-[#1f2937] border-l-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 group',
        grade.accent,
        selected && 'border-t-violet-500/50 border-r-violet-500/50 border-b-violet-500/50 shadow-lg shadow-violet-900/20'
      )}
    >
      <div className="p-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <CompanyAvatar name={job.company} color={src.color} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-100 text-sm leading-snug group-hover:text-white transition-colors line-clamp-2">
              {job.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{job.company}</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onSave(job.id); }}
            className={cn(
              'flex-shrink-0 p-1.5 rounded-lg transition-all duration-150',
              job.isSaved
                ? 'text-violet-400 bg-violet-500/10'
                : 'text-slate-600 hover:text-violet-400 hover:bg-violet-500/10'
            )}
          >
            {job.isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-600" />{job.location}</span>
          {(job.salaryMin || job.salaryMax) && (
            <span className="flex items-center gap-1 text-emerald-500/80"><DollarSign className="w-3 h-3" />{formatSalary(job.salaryMin, job.salaryMax)}</span>
          )}
          {job.applicantsCount != null && (
            <span className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-600" />{job.applicantsCount} applied</span>
          )}
          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-600" />{formatRelative(job.postingDate || job.createdAt)}</span>
        </div>

        {/* Skills */}
        {job.requiredSkills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {job.requiredSkills.slice(0, 4).map(skill => (
              <span key={skill} className="text-xs bg-[#1a2235] text-slate-300 border border-[#2d3f5c] px-2 py-0.5 rounded-md font-medium">
                {skill}
              </span>
            ))}
            {job.requiredSkills.length > 4 && (
              <span className="text-xs text-slate-600 self-center">+{job.requiredSkills.length - 4} more</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${src.color}18`, color: src.color }}
          >
            {src.label}
          </span>
          {job.remote && (
            <span className="text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full">
              Remote
            </span>
          )}
        </div>

        <div className={cn('flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border', grade.bg)}>
          <Sparkles className={cn('w-3 h-3', grade.color)} />
          <span className={grade.color}>{pct}%</span>
          <span className="text-slate-600 font-normal">{grade.label}</span>
        </div>
      </div>

      {/* Match bar */}
      <div className="h-1 w-full bg-[#1f2937] rounded-b-xl overflow-hidden">
        <div className={cn('h-full transition-all duration-500', grade.bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
