export type JobSource = 'linkedin' | 'indeed' | 'glassdoor' | 'ziprecruiter' | 'monster' | 'ladders';
export type AppStatus = 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'staff' | 'principal';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  requirements: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  postingDate?: string;
  applicantsCount?: number;
  source: JobSource;
  sourceUrl: string;
  matchedScore: number;
  isSaved: boolean;
  requiredSkills: string[];
  experienceLevel?: string;
  createdAt: string;
}

export interface Resume {
  id: string;
  jobId: string;
  customizedContent: string;
  filePath: string;
  changesMade: string[];
  keywordsAdded: string[];
  downloadCount: number;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  appliedDate: string;
  status: AppStatus;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
  job?: { id: string; title: string; company: string; location: string };
}

export interface UserPreferences {
  id: string;
  jobKeywords: string[];
  skills: string[];
  locations: string[];
  salaryMin: number;
  salaryMax: number;
  experienceLevel: ExperienceLevel;
  remoteOnly: boolean;
  email: string;
  hasResume: boolean;
  updatedAt?: string;
}

export interface JobFilters {
  search: string;
  source: string;
  remote: string;
  savedOnly: boolean;
}
