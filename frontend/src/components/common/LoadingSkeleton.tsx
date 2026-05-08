'use client';
import { cn } from '@/lib/utils';

const Sk = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse bg-[#1f2937] rounded-lg', className)} />
);

export const JobCardSkeleton = () => (
  <div className="card p-4">
    <div className="flex justify-between mb-3">
      <div className="flex-1"><Sk className="h-4 w-48 mb-2" /><Sk className="h-3 w-32" /></div>
      <Sk className="h-6 w-6 rounded-md" />
    </div>
    <div className="flex gap-3 mb-3"><Sk className="h-3 w-24" /><Sk className="h-3 w-20" /></div>
    <div className="flex gap-2"><Sk className="h-5 w-20 rounded-full" /><Sk className="h-5 w-16 rounded-full" /></div>
  </div>
);

export const StatSkeleton = () => (
  <div className="card p-5"><Sk className="h-3 w-24 mb-3" /><Sk className="h-8 w-16 mb-2" /><Sk className="h-3 w-32" /></div>
);

export default Sk;
