'use client';
import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Sparkles, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { resumeApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const STEPS = [
  { num: '1', icon: Upload,    title: 'Upload your base DOCX resume',   desc: 'Your master resume with all experience and skills.' },
  { num: '2', icon: FileText,  title: 'Apply to a job from the Jobs page', desc: 'Click any job card → open details → Apply Now.' },
  { num: '3', icon: Sparkles,  title: 'Resume is auto-customized',       desc: 'AI (or template engine) tailors your resume for that role.' },
  { num: '4', icon: Download,  title: 'Download the tailored DOCX',      desc: 'Ready for ATS systems, customized per role.' },
];

export default function ResumeManagerPage() {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [fileName, setFileName] = useState('');
  const [hasResume, setHasResume] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.docx')) { toast.error('Only DOCX files are supported'); return; }
    setUploading(true);
    try {
      const res = await resumeApi.upload(file);
      setPreview(res.extractedText || '');
      setFileName(file.name);
      setHasResume(true);
      toast.success('Resume uploaded successfully!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="flex min-h-screen bg-[#0a0d14]">
      <Sidebar />
      <main className="ml-56 flex-1 p-6">
        <div className="max-w-2xl">

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-xl font-bold text-slate-100">Resume Manager</h1>
            <p className="text-sm text-slate-500 mt-0.5">Upload your base resume — it gets auto-customized when you apply to jobs.</p>
          </div>

          <div className="space-y-5">

            {/* Upload card */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1f2937]">
                <div className="w-7 h-7 rounded-lg bg-violet-600/15 border border-violet-500/20 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-200">Base Resume</h2>
                {hasResume && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />Uploaded
                  </span>
                )}
              </div>

              <div className="p-5">
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200',
                    dragOver
                      ? 'border-violet-400 bg-violet-500/10 scale-[1.01]'
                      : hasResume
                      ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400/50'
                      : 'border-[#2d3748] hover:border-violet-500/40 hover:bg-violet-500/5'
                  )}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
                      <p className="text-sm font-medium text-violet-400">Processing your resume...</p>
                      <p className="text-xs text-slate-600">Extracting text and preparing for AI customization</p>
                    </div>
                  ) : hasResume ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="w-7 h-7 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-400">{fileName || 'Resume uploaded'}</p>
                        <p className="text-xs text-slate-600 mt-1">Click to replace · Drag & drop a new file</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1"
                      >
                        <RefreshCw className="w-3 h-3" />Replace resume
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#1f2937] border border-[#374151] flex items-center justify-center">
                        <Upload className="w-7 h-7 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300">Drop your DOCX resume here</p>
                        <p className="text-xs text-slate-600 mt-1">or click to browse · DOCX format only</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-px w-12 bg-[#2d3748]" />
                        <span className="text-xs text-slate-700">DOCX</span>
                        <div className="h-px w-12 bg-[#2d3748]" />
                      </div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={handleFileChange} />
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f2937]">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <h2 className="text-sm font-semibold text-slate-200">Resume Preview</h2>
                  </div>
                  <span className="text-xs text-slate-600">{preview.length.toLocaleString()} characters extracted</span>
                </div>
                <div className="p-5">
                  <pre className="text-xs text-slate-500 whitespace-pre-wrap font-mono bg-[#0a0d14] rounded-xl p-4 max-h-64 overflow-y-auto border border-[#1f2937] leading-relaxed">
                    {preview}
                  </pre>
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1f2937]">
                <div className="w-7 h-7 rounded-lg bg-amber-600/15 border border-amber-500/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-200">How Auto-Customization Works</h2>
              </div>
              <div className="p-5 space-y-4">
                {STEPS.map((step, i) => (
                  <div key={step.num} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
                        <step.icon className="w-4 h-4 text-violet-400" />
                      </div>
                      {i < STEPS.length - 1 && <div className="w-px flex-1 bg-[#1f2937] mt-2 mb-0 min-h-4" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-slate-200">{step.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* API key notice */}
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-400">AI customization is optional</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Without an <code className="bg-[#0a0d14] px-1.5 py-0.5 rounded text-slate-300">ANTHROPIC_API_KEY</code> in <code className="bg-[#0a0d14] px-1.5 py-0.5 rounded text-slate-300">backend/.env</code>, a template-based customization is used — it swaps keywords from the job description into your resume. Add your API key anytime to upgrade to full Claude AI rewriting.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
