import axios from 'axios';

// VITE_API_URL: set to deployed backend URL on Render
// In dev: leave empty — requests go through Vite proxy (/api → localhost:5001)
const BASE = import.meta.env.VITE_API_URL ?? '';

const API = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' }
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
