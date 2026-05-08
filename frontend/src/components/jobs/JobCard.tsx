'use client';
import { Bookmark, BookmarkCheck, ExternalLink, Users, MapPin, DollarSign, Clock, Sparkles } from 'lucide-react';
import type { Job } from '@/lib/types';
import { cn, formatSalary, formatRelative, scoreColor, scoreBg, sourceConfig } from '@/lib/utils';

interface Props {
  job: Job;
  onSave: (id: string) => void;
  onSelect: (job: Job) => void;
  selected?: boolean;
}

export default function JobCard({ job, onSave, onSelect, selected }: Props) {
  const src = sourceConfig[job.source] || { label: job.source, color: '#6366f1' };

  return (
    <div
      onClick={() => onSelect(job)}
      className={cn(
        'card p-4 cursor-pointer hover:border-violet-500/30 transition-all duration-150 group',
        selected && 'border-violet-500/50 bg-violet-600/5'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-200 text-sm leading-snug group-hover:text-violet-300 transition-colors truncate">
            {job.title}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5 truncate">{job.company}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onSave(job.id); }}
          className={cn('flex-shrink-0 p-1.5 rounded-md transition-colors', job.isSaved ? 'text-violet-400' : 'text-slate-600 hover:text-violet-400')}
        >
          {job.isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
        {job.salaryMin || job.salaryMax ? (
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatSalary(job.salaryMin, job.salaryMax)}</span>
        ) : null}
        {job.applicantsCount !== null && job.applicantsCount !== undefined && (
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.applicantsCount} applicants</span>
        )}
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelative(job.postingDate || job.createdAt)}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${src.color}20`, color: src.color }}
          >
            {src.label}
          </span>
          {job.remote && (
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Remote
            </span>
          )}
        </div>

        <div className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border', scoreBg(job.matchedScore))}>
          <Sparkles className="w-3 h-3" />
          <span className={scoreColor(job.matchedScore)}>{Math.round(job.matchedScore * 100)}% match</span>
        </div>
      </div>

      {job.requiredSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {job.requiredSkills.slice(0, 4).map(skill => (
            <span key={skill} className="text-xs bg-[#1f2937] text-slate-500 px-1.5 py-0.5 rounded border border-[#374151]">
              {skill}
            </span>
          ))}
          {job.requiredSkills.length > 4 && (
            <span className="text-xs text-slate-700">+{job.requiredSkills.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
}
