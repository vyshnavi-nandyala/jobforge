'use client';
import { Search, X, Wifi, Bookmark, Globe } from 'lucide-react';
import type { JobFilters } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  filters: Partial<JobFilters>;
  onChange: (f: Partial<JobFilters>) => void;
  onClear: () => void;
}

const SOURCES = [
  { value: '', label: 'All Sources' },
  { value: 'linkedin', label: 'LinkedIn', color: '#0077b5' },
  { value: 'indeed', label: 'Indeed', color: '#2164f3' },
  { value: 'glassdoor', label: 'Glassdoor', color: '#0caa41' },
  { value: 'ziprecruiter', label: 'ZipRecruiter', color: '#4caf50' },
  { value: 'monster', label: 'Monster', color: '#6d1ee4' },
];

export default function JobFilters({ filters, onChange, onClear }: Props) {
  const hasFilters = Object.values(filters).some(v => v !== '' && v !== false && v !== undefined);
  const activeSource = filters.source || '';
  const isRemote = filters.remote === 'true';
  const isSaved = filters.savedOnly === true;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          className="w-full bg-[#0d1117] border border-[#2d3748] text-slate-200 rounded-xl px-3 py-2.5 pl-10 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
          placeholder="Search by job title, company, or skill..."
          value={filters.search || ''}
          onChange={e => onChange({ search: e.target.value })}
        />
        {filters.search && (
          <button
            onClick={() => onChange({ search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter chips row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Source pills */}
        <div className="flex items-center gap-1.5">
          {SOURCES.map(s => (
            <button
              key={s.value}
              onClick={() => onChange({ source: s.value })}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150',
                activeSource === s.value
                  ? 'bg-violet-600 border-violet-500 text-white shadow-sm shadow-violet-900/40'
                  : 'bg-[#1a2235] border-[#2d3f5c] text-slate-400 hover:text-slate-200 hover:border-slate-500'
              )}
              style={activeSource === s.value && s.color ? { backgroundColor: `${s.color}`, borderColor: `${s.color}` } : {}}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[#2d3748] mx-1" />

        {/* Quick filters */}
        <button
          onClick={() => onChange({ remote: isRemote ? '' : 'true' })}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150',
            isRemote
              ? 'bg-teal-500/15 border-teal-500/40 text-teal-400'
              : 'bg-[#1a2235] border-[#2d3f5c] text-slate-400 hover:text-teal-400 hover:border-teal-500/30'
          )}
        >
          <Wifi className="w-3 h-3" />
          Remote
        </button>

        <button
          onClick={() => onChange({ savedOnly: !isSaved })}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150',
            isSaved
              ? 'bg-violet-500/15 border-violet-500/40 text-violet-400'
              : 'bg-[#1a2235] border-[#2d3f5c] text-slate-400 hover:text-violet-400 hover:border-violet-500/30'
          )}
        >
          <Bookmark className="w-3 h-3" />
          Saved
        </button>

        {hasFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors ml-auto"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
