'use client';
import { useState, useEffect } from 'react';
import { Save, Loader2, Plus, X, Briefcase, MapPin, DollarSign, User, Bell, CheckCircle, Zap } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { settingsApi } from '@/lib/api';
import type { UserPreferences } from '@/lib/types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const DE_SKILLS = [
  { name: 'Python', category: 'Languages' },
  { name: 'SQL', category: 'Languages' },
  { name: 'Scala', category: 'Languages' },
  { name: 'Java', category: 'Languages' },
  { name: 'Spark', category: 'Processing' },
  { name: 'Kafka', category: 'Processing' },
  { name: 'Airflow', category: 'Orchestration' },
  { name: 'dbt', category: 'Transformation' },
  { name: 'Snowflake', category: 'Warehouses' },
  { name: 'Redshift', category: 'Warehouses' },
  { name: 'BigQuery', category: 'Warehouses' },
  { name: 'Delta Lake', category: 'Warehouses' },
  { name: 'AWS', category: 'Cloud' },
  { name: 'GCP', category: 'Cloud' },
  { name: 'Azure', category: 'Cloud' },
  { name: 'Terraform', category: 'Infrastructure' },
  { name: 'Kubernetes', category: 'Infrastructure' },
  { name: 'Docker', category: 'Infrastructure' },
  { name: 'Hadoop', category: 'Processing' },
  { name: 'Data Modeling', category: 'Concepts' },
];

const SKILL_CATEGORIES = [...new Set(DE_SKILLS.map(s => s.category))];

const EXP_LEVELS = [
  { value: 'entry', label: 'Entry Level', sub: '0–2 years' },
  { value: 'mid', label: 'Mid Level', sub: '3–5 years' },
  { value: 'senior', label: 'Senior', sub: '5–8 years' },
  { value: 'staff', label: 'Staff / Principal', sub: '8+ years' },
];

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1f2937]">
        <div className="w-7 h-7 rounded-lg bg-violet-600/15 border border-violet-500/20 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [locInput, setLocInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

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

  const addKeyword = () => {
    const kw = tagInput.trim();
    if (kw && !(prefs.jobKeywords || []).includes(kw)) set('jobKeywords', [...(prefs.jobKeywords || []), kw]);
    setTagInput('');
  };

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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success('Preferences saved');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const filteredSkills = activeCategory === 'All' ? DE_SKILLS : DE_SKILLS.filter(s => s.category === activeCategory);
  const selectedSkills = prefs.skills || [];

  if (loading) return (
    <div className="flex min-h-screen bg-[#0a0d14]">
      <Sidebar />
      <main className="ml-56 flex-1 p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0a0d14]">
      <Sidebar />
      <main className="ml-56 flex-1 p-6">
        <div className="max-w-2xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="text-xl font-bold text-slate-100">Settings</h1>
              <p className="text-sm text-slate-500 mt-0.5">Configure your job search preferences</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50',
                saved
                  ? 'bg-emerald-600 shadow-emerald-900/40 text-white'
                  : 'bg-violet-600 hover:bg-violet-500 shadow-violet-900/40 text-white'
              )}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>

          <div className="space-y-5">

            {/* Keywords */}
            <SectionCard icon={Briefcase} title="Job Search Keywords">
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <input
                    className="w-full bg-[#0d1117] border border-[#2d3748] text-slate-200 rounded-xl px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
                    placeholder="e.g. Data Engineer, ETL, Pipeline..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addKeyword()}
                  />
                </div>
                <button onClick={addKeyword} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-violet-600/15 border border-violet-500/25 text-violet-400 hover:bg-violet-600/25 transition-colors text-sm">
                  <Plus className="w-4 h-4" />Add
                </button>
              </div>
              {(prefs.jobKeywords || []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(prefs.jobKeywords || []).map(kw => (
                    <span key={kw} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-medium">
                      {kw}
                      <button onClick={() => set('jobKeywords', (prefs.jobKeywords || []).filter(k => k !== kw))} className="hover:text-white transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-700 italic">No keywords added yet. These drive the job scraper searches.</p>
              )}
            </SectionCard>

            {/* Skills */}
            <SectionCard icon={Zap} title="Your Skills">
              <p className="text-xs text-slate-600 mb-3">
                {selectedSkills.length > 0
                  ? <span className="text-violet-400 font-medium">{selectedSkills.length} skills selected</span>
                  : 'Select your skills to improve job match scores'}
                {selectedSkills.length > 0 && ' · improves match scoring'}
              </p>

              {/* Category filter */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {['All', ...SKILL_CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border transition-all',
                      activeCategory === cat
                        ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                        : 'bg-[#0d1117] border-[#2d3748] text-slate-600 hover:text-slate-400'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {filteredSkills.map(({ name }) => {
                  const active = selectedSkills.includes(name);
                  return (
                    <button
                      key={name}
                      onClick={() => toggleSkill(name)}
                      className={cn(
                        'text-sm px-3 py-1.5 rounded-xl border transition-all duration-150 font-medium',
                        active
                          ? 'bg-violet-600/20 border-violet-500/40 text-violet-300 shadow-sm shadow-violet-900/20'
                          : 'bg-[#0d1117] border-[#2d3748] text-slate-500 hover:text-slate-200 hover:border-slate-500'
                      )}
                    >
                      {active && <span className="mr-1 text-violet-400">✓</span>}
                      {name}
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* Location */}
            <SectionCard icon={MapPin} title="Location Preferences">
              <div className="flex gap-2 mb-3">
                <input
                  className="flex-1 bg-[#0d1117] border border-[#2d3748] text-slate-200 rounded-xl px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
                  placeholder="e.g. Remote, San Francisco, New York..."
                  value={locInput}
                  onChange={e => setLocInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addLoc()}
                />
                <button onClick={addLoc} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-violet-600/15 border border-violet-500/25 text-violet-400 hover:bg-violet-600/25 transition-colors text-sm">
                  <Plus className="w-4 h-4" />Add
                </button>
              </div>
              {(prefs.locations || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {(prefs.locations || []).map(loc => (
                    <span key={loc} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a2235] border border-[#2d3f5c] text-slate-300 text-xs font-medium">
                      <MapPin className="w-3 h-3 text-slate-600" />{loc}
                      <button onClick={() => set('locations', (prefs.locations || []).filter(l => l !== loc))} className="hover:text-red-400 transition-colors ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <label className={cn(
                'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                prefs.remoteOnly ? 'bg-teal-500/5 border-teal-500/20' : 'bg-[#0d1117] border-[#2d3748] hover:border-slate-600'
              )}>
                <input type="checkbox" checked={prefs.remoteOnly || false} onChange={e => set('remoteOnly', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" />
                <div>
                  <p className={cn('text-sm font-medium', prefs.remoteOnly ? 'text-teal-400' : 'text-slate-300')}>Remote only</p>
                  <p className="text-xs text-slate-600">Only show jobs that are fully remote</p>
                </div>
              </label>
            </SectionCard>

            {/* Salary & Experience */}
            <SectionCard icon={DollarSign} title="Salary & Experience">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">Min Salary ($)</label>
                  <input
                    type="number"
                    className="w-full bg-[#0d1117] border border-[#2d3748] text-slate-200 rounded-xl px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
                    placeholder="120,000"
                    value={prefs.salaryMin || ''}
                    onChange={e => set('salaryMin', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">Max Salary ($)</label>
                  <input
                    type="number"
                    className="w-full bg-[#0d1117] border border-[#2d3748] text-slate-200 rounded-xl px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
                    placeholder="200,000"
                    value={prefs.salaryMax || ''}
                    onChange={e => set('salaryMax', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-2 block">Experience Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXP_LEVELS.map(lvl => (
                    <button
                      key={lvl.value}
                      onClick={() => set('experienceLevel', lvl.value as UserPreferences['experienceLevel'])}
                      className={cn(
                        'text-left px-3 py-2.5 rounded-xl border transition-all',
                        prefs.experienceLevel === lvl.value
                          ? 'bg-violet-600/15 border-violet-500/30 text-violet-300'
                          : 'bg-[#0d1117] border-[#2d3748] text-slate-500 hover:text-slate-300 hover:border-slate-600'
                      )}
                    >
                      <p className="text-xs font-semibold">{lvl.label}</p>
                      <p className="text-xs opacity-60 mt-0.5">{lvl.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Notifications */}
            <SectionCard icon={Bell} title="Notifications">
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Email for daily job digest</label>
              <input
                type="email"
                className="w-full bg-[#0d1117] border border-[#2d3748] text-slate-200 rounded-xl px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all"
                placeholder="your@email.com"
                value={prefs.email || ''}
                onChange={e => set('email', e.target.value)}
              />
              <p className="text-xs text-slate-700 mt-2">Requires SMTP configuration in backend/.env to send emails.</p>
            </SectionCard>

          </div>
        </div>
      </main>
    </div>
  );
}
