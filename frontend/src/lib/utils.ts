import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';
import type { AppStatus } from './types';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatSalary = (min?: number, max?: number, currency = 'USD'): string => {
  if (!min && !max) return 'Salary not disclosed';
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max || 0);
};

export const formatDate = (date?: string): string => {
  if (!date) return 'Unknown';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatRelative = (date?: string): string => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const scoreColor = (score: number): string => {
  if (score >= 0.85) return 'text-green-400';
  if (score >= 0.7) return 'text-blue-400';
  if (score >= 0.5) return 'text-amber-400';
  return 'text-slate-500';
};

export const scoreBg = (score: number): string => {
  if (score >= 0.85) return 'bg-green-500/10 border-green-500/20';
  if (score >= 0.7) return 'bg-blue-500/10 border-blue-500/20';
  if (score >= 0.5) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-slate-500/10 border-slate-500/20';
};

export const statusConfig: Record<AppStatus, { label: string; color: string; bg: string }> = {
  applied: { label: 'Applied', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  interviewing: { label: 'Interviewing', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  offer: { label: 'Offer', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  withdrawn: { label: 'Withdrawn', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
};

export const sourceConfig: Record<string, { label: string; color: string }> = {
  linkedin: { label: 'LinkedIn', color: '#0077b5' },
  indeed: { label: 'Indeed', color: '#2164f3' },
  glassdoor: { label: 'Glassdoor', color: '#0caa41' },
  ziprecruiter: { label: 'ZipRecruiter', color: '#4caf50' },
  monster: { label: 'Monster', color: '#6d1ee4' },
  ladders: { label: 'Ladders', color: '#e44b28' },
};
