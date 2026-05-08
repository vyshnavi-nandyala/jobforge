'use client';
import { useState, useEffect } from 'react';
import { X, ExternalLink, Download, CheckCircle, Users, MapPin, DollarSign, Clock, Sparkles, Loader2 } from 'lucide-react';
import type { Job, Resume } from '@/lib/types';
import { formatSalary, formatDate, sourceConfig, scoreColor } from '@/lib/utils';
import { resumeApi, applicationsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Props {
  job: Job;
  onClose: () => void;
  onApplied: () => void;
}

export default function JobDetailsModal({ job, onClose, onApplied }: Props) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [customizing, setCustomizing] = useState(false);
  const [applying, setApplying] = useState(false);
  const src = sourceConfig[job.source] || { label: job.source, color: '#6366f1' };

  useEffect(() => {
    resumeApi.get(job.id).then(r => setResume(r.data)).catch(() => {});
  }, [job.id]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const handleCustomize = async () => {
    setCustomizing(true);
    try {
      const r = await resumeApi.customize(job.id);
      setResume(r.data);
      toast.success('Resume customized for this job!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Customization failed. Upload your resume first.');
    } finally {
      setCustomizing(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await applicationsApi.create(job.id);
      window.open(job.sourceUrl, '_blank', 'noopener');
      toast.success('Application tracked!');
      onApplied();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to track';
      if (msg.includes('Already applied')) {
        window.open(job.sourceUrl, '_blank', 'noopener');
      } else {
        toast.error(msg);
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#111827] border border-[#1f2937] rounded-2xl shadow-2xl animate-slide-in flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b border-[#1f2937] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-100">{job.title}</h2>
            <p className="text-slate-400 mt-0.5">{job.company}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
              {(job.salaryMin || job.salaryMax) && (
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{formatSalary(job.salaryMin, job.salaryMax)}</span>
              )}
              {job.applicantsCount !== null && job.applicantsCount !== undefined && (
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{job.applicantsCount} applicants</span>
              )}
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(job.postingDate || job.createdAt)}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${src.color}20`, color: src.color }}>
              {src.label}
            </span>
            {job.remote && <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">Remote</span>}
            <span className={`text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 ${scoreColor(job.matchedScore)}`}>
              <Sparkles className="w-3 h-3" />{Math.round(job.matchedScore * 100)}% match
            </span>
          </div>

          {job.requiredSkills?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills.map(skill => (
                  <span key={skill} className="text-xs bg-[#1f2937] text-slate-300 border border-[#374151] px-2 py-1 rounded-md">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {job.description && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {job.requirements && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Requirements</p>
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}

          {resume && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-400">Resume Customized</p>
              </div>
              <p className="text-xs text-slate-500 mb-3">{resume.changesMade?.length || 0} changes made · {resume.keywordsAdded?.length || 0} keywords added</p>
              {resume.changesMade?.slice(0, 3).map((c, i) => (
                <p key={i} className="text-xs text-slate-500 mb-1">• {c}</p>
              ))}
              <a href={resumeApi.downloadUrl(job.id)} download className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 mt-2">
                <Download className="w-3.5 h-3.5" />Download tailored resume
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-[#1f2937] flex-shrink-0">
          {!resume ? (
            <button onClick={handleCustomize} disabled={customizing} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
              {customizing ? <><Loader2 className="w-4 h-4 animate-spin" />Customizing...</> : <><Sparkles className="w-4 h-4" />Customize Resume</>}
            </button>
          ) : (
            <a href={resumeApi.downloadUrl(job.id)} download className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
              <Download className="w-4 h-4" />Download Resume
            </a>
          )}
          <button onClick={handleApply} disabled={applying} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}
