import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? '';

const API = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Candidates
export const addCandidate = (data) => API.post('/api/candidates', data);
export const getCandidates = (search = '') =>
  API.get('/api/candidates', { params: search ? { search } : {} });
export const deleteCandidate = (id) => API.delete(`/api/candidates/${id}`);

// Basic Match
export const matchCandidates = (data) => API.post('/api/match', data);

// AI
export const aiShortlist = (data) => API.post('/api/ai/shortlist', data);
export const getInterviewQuestions = (data) => API.post('/api/ai/interview-questions', data);
