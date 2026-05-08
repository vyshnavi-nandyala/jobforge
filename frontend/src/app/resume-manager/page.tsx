'use client';
import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { resumeApi, settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ResumeManagerPage() {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [hasResume, setHasResume] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.docx')) { toast.error('Only DOCX files are supported'); return; }

    setUploading(true);
    try {
      const res = await resumeApi.upload(file);
      setPreview(res.extractedText || '');
      setHasResume(true);
      toast.success('Resume uploaded! AI can now customize it for each job.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-56 flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-100">Resume Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">Upload your base resume. AI customizes it for each job automatically.</p>
        </div>

        <div className="max-w-2xl space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-200 mb-4">Base Resume</h2>

            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                hasResume ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[#374151] hover:border-violet-500/40 hover:bg-violet-500/5'
              }`}
            >
              {hasResume ? (
                <>
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-emerald-400">Resume uploaded</p>
                  <p className="text-xs text-slate-600 mt-1">Click to replace</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-400">Drop your DOCX resume here</p>
                  <p className="text-xs text-slate-600 mt-1">or click to browse</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={handleUpload} />

            {uploading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-violet-400">
                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                Uploading and processing...
              </div>
            )}
          </div>

          {preview && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-slate-400" />
                <h2 className="font-semibold text-slate-200">Resume Preview</h2>
              </div>
              <pre className="text-xs text-slate-500 whitespace-pre-wrap font-mono bg-[#0a0d14] rounded-lg p-4 max-h-80 overflow-y-auto border border-[#1f2937]">
                {preview}
              </pre>
            </div>
          )}

          <div className="card p-6">
            <h2 className="font-semibold text-slate-200 mb-4">How AI Customization Works</h2>
            <div className="space-y-3">
              {[
                { num: '1', title: 'Upload your base DOCX resume', desc: 'Your master resume with all experience and skills' },
                { num: '2', title: 'Select a job from the Jobs page', desc: 'Click any job card to open the details' },
                { num: '3', title: 'Click "Customize Resume"', desc: 'Claude AI analyzes the job description and tailors your resume' },
                { num: '4', title: 'Download and apply', desc: 'Get a DOCX ready for ATS, customized for that specific role' },
              ].map(step => (
                <div key={step.num} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xs text-violet-400 font-bold flex-shrink-0 mt-0.5">
                    {step.num}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">{step.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 border-amber-500/20 bg-amber-500/5">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">Set your Anthropic API key</p>
                <p className="text-xs text-slate-500 mt-0.5">Add <code className="bg-[#0a0d14] px-1 rounded">ANTHROPIC_API_KEY</code> to <code className="bg-[#0a0d14] px-1 rounded">backend/.env</code> for AI resume customization. Without it, a template-based customization is used.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
