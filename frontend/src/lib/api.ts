import axios from 'axios';
import type { Job, Resume, Application, UserPreferences, JobFilters } from './types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
});

api.interceptors.response.use(
  r => r,
  err => Promise.reject(new Error(err.response?.data?.detail || err.message || 'Request failed'))
);

export const jobsApi = {
  getAll: (params?: Partial<JobFilters> & { limit?: number; offset?: number; sort_by?: string }) =>
    api.get<{ success: boolean; data: Job[]; total: number }>('/api/jobs', { params }).then(r => r.data),
  getById: (id: string) =>
    api.get<{ success: boolean; data: Job }>(`/api/jobs/${id}`).then(r => r.data),
  triggerSearch: () =>
    api.post<{ success: boolean; message: string }>('/api/jobs/search').then(r => r.data),
  toggleSave: (id: string) =>
    api.put<{ success: boolean; saved: boolean }>(`/api/jobs/${id}/save`).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/api/jobs/${id}`).then(r => r.data),
};

export const resumeApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ success: boolean; message: string; extractedText: string }>('/api/resume/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  customize: (jobId: string) =>
    api.post<{ success: boolean; data: Resume }>(`/api/resume/customize/${jobId}/sync`).then(r => r.data),
  get: (jobId: string) =>
    api.get<{ success: boolean; data: Resume }>(`/api/resume/${jobId}`).then(r => r.data),
  downloadUrl: (jobId: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/resume/${jobId}/download`,
};

export const applicationsApi = {
  getAll: () =>
    api.get<{ success: boolean; data: Application[] }>('/api/applications').then(r => r.data),
  create: (jobId: string, notes?: string) =>
    api.post<{ success: boolean; data: Application }>('/api/applications', { job_id: jobId, notes }).then(r => r.data),
  update: (id: string, data: { status?: string; notes?: string; follow_up_date?: string }) =>
    api.put<{ success: boolean; data: Application }>(`/api/applications/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/api/applications/${id}`).then(r => r.data),
};

export const settingsApi = {
  get: () =>
    api.get<{ success: boolean; data: UserPreferences }>('/api/settings').then(r => r.data),
  update: (data: Partial<UserPreferences>) =>
    api.post<{ success: boolean; data: UserPreferences }>('/api/settings', data).then(r => r.data),
};

export default api;
