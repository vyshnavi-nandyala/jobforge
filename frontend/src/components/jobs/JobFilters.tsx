'use client';
import { Search, X } from 'lucide-react';
import type { JobFilters } from '@/lib/types';

interface Props {
  filters: Partial<JobFilters>;
  onChange: (f: Partial<JobFilters>) => void;
  onClear: () => void;
}

export default function JobFilters({ filters, onChange, onClear }: Props) {
  const hasFilters = Object.values(filters).some(v => v !== '' && v !== false && v !== undefined);
  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        <input
          className="input pl-9 text-sm"
          placeholder="Search jobs, companies..."
          value={filters.search || ''}
          onChange={e => onChange({ search: e.target.value })}
        />
      </div>
      <select className="input text-sm w-auto min-w-36" value={filters.source || ''} onChange={e => onChange({ source: e.target.value })}>
        <option value="">All Sources</option>
        <option value="linkedin">LinkedIn</option>
        <option value="indeed">Indeed</option>
        <option value="glassdoor">Glassdoor</option>
        <option value="ziprecruiter">ZipRecruiter</option>
        <option value="monster">Monster</option>
      </select>
      <select className="input text-sm w-auto min-w-28" value={filters.remote || ''} onChange={e => onChange({ remote: e.target.value })}>
        <option value="">All Locations</option>
        <option value="true">Remote Only</option>
        <option value="false">On-site</option>
      </select>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.savedOnly || false}
          onChange={e => onChange({ savedOnly: e.target.checked })}
          className="w-4 h-4 rounded border-slate-600 text-violet-600"
        />
        <span className="text-sm text-slate-400">Saved only</span>
      </label>
      {hasFilters && (
        <button onClick={onClear} className="btn-secondary flex items-center gap-1 text-sm">
          <X className="w-4 h-4" />Clear
        </button>
      )}
    </div>
  );
}
