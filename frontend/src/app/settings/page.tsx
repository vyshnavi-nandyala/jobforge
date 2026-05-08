'use client';
import { useState, useEffect } from 'react';
import { Save, Loader2, Plus, X } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { settingsApi } from '@/lib/api';
import type { UserPreferences } from '@/lib/types';
import toast from 'react-hot-toast';

const DE_SKILLS = ['Python', 'SQL', 'Spark', 'Kafka', 'Airflow', 'dbt', 'Snowflake', 'Redshift', 'BigQuery', 'AWS', 'GCP', 'Azure', 'Terraform', 'Kubernetes', 'Docker', 'Scala', 'Java', 'Hadoop', 'Delta Lake', 'Data Modeling'];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [locInput, setLocInput] = useState('');

  useEffect(() => {
    settingsApi.get().then(r => { setPrefs(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const set = <K extends keyof UserPreferences>(k: K, v: UserPreferences[K]) => setPrefs(p => ({ ...p, [k]: v }));

  const toggleSkill = (skill: string) => {
    const skills = prefs.skills || [];
    set('skills', skills.includes(skill) ? skills.filter(s => s !== skill) : [...skills, skill]);
  };

  const addLoc = () => {
    const loc = locInput.trim();
    if (loc && !(prefs.locations || []).includes(loc)) set('locations', [...(prefs.locations || []), loc]);
    setLocInput('');
  };

  const removeLoc = (loc: string) => set('locations', (prefs.locations || []).filter(l => l !== loc));

  const addKeyword = () => {
    const kw = tagInput.trim();
    if (kw && !(prefs.jobKeywords || []).includes(kw)) set('jobKeywords', [...(prefs.jobKeywords || []), kw]);
    setTagInput('');
  };

  const removeKeyword = (kw: string) => set('jobKeywords', (prefs.jobKeywords || []).filter(k => k !== kw));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await settingsApi.update({
        job_keywords: prefs.jobKeywords,
        skills: prefs.skills,
        locations: prefs.locations,
        salary_min: prefs.salaryMin,
        salary_max: prefs.salaryMax,
        experience_level: prefs.experienceLevel,
        remote_only: prefs.remoteOnly,
        email: prefs.email,
      } as never);
      setPrefs(res.data);
      toast.success('Preferences saved');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex min-h-screen"><Sidebar />
      <main className="ml-56 flex-1 p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-56 flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">Configure your job search preferences</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        <div className="max-w-2xl space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-200 mb-4">Job Search Keywords</h2>
            <div className="flex gap-2 mb-3">
              <input className="input flex-1 text-sm" placeholder="Add keyword..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()} />
              <button onClick={addKeyword} className="btn-secondary px-3"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(prefs.jobKeywords || []).map(kw => (
                <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 text-sm">
                  {kw}
                  <button onClick={() => removeKeyword(kw)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-slate-200 mb-4">Your Skills</h2>
            <p className="text-xs text-slate-600 mb-3">Selected skills improve job match scoring</p>
            <div className="flex flex-wrap gap-2">
              {DE_SKILLS.map(skill => {
                const active = (prefs.skills || []).includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${active ? 'bg-violet-600/15 border-violet-500/30 text-violet-300' : 'bg-[#1f2937] border-[#374151] text-slate-500 hover:text-slate-300'}`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-slate-200 mb-4">Location Preferences</h2>
            <div className="flex gap-2 mb-3">
              <input className="input flex-1 text-sm" placeholder="e.g. Remote, San Francisco, New York" value={locInput} onChange={e => setLocInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLoc()} />
              <button onClick={addLoc} className="btn-secondary px-3"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {(prefs.locations || []).map(loc => (
                <span key={loc} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1f2937] border border-[#374151] text-slate-300 text-sm">
                  {loc}
                  <button onClick={() => removeLoc(loc)}><X className="w-3 h-3 text-slate-600 hover:text-red-400" /></button>
                </span>
              ))}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={prefs.remoteOnly || false} onChange={e => set('remoteOnly', e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm text-slate-400">Remote only</span>
            </label>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-slate-200 mb-4">Salary & Experience</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Salary Min ($)</label>
                <input type="number" className="input" placeholder="120000" value={prefs.salaryMin || ''} onChange={e => set('salaryMin', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="label">Salary Max ($)</label>
                <input type="number" className="input" placeholder="200000" value={prefs.salaryMax || ''} onChange={e => set('salaryMax', parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <div>
              <label className="label">Experience Level</label>
              <select className="input" value={prefs.experienceLevel || 'mid'} onChange={e => set('experienceLevel', e.target.value as UserPreferences['experienceLevel'])}>
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior (5-8 years)</option>
                <option value="staff">Staff / Principal (8+ years)</option>
              </select>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-slate-200 mb-4">Notifications</h2>
            <div>
              <label className="label">Email for daily job digest</label>
              <input type="email" className="input" placeholder="your@email.com" value={prefs.email || ''} onChange={e => set('email', e.target.value)} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
