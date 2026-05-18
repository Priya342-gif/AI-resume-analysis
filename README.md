# Candidate Profile Shortlisting System

A full-stack web application that filters and ranks candidates based on required skill sets, with AI-powered shortlisting via OpenRouter.

## Tech Stack

- **Frontend**: Vite + React, Recharts, Axios
- **Backend**: Node.js, Express
- **Database**: MongoDB (Atlas)
- **AI**: OpenRouter API (mistralai/mistral-7b-instruct:free)

## Features

- Add / view / delete candidates
- Basic skill-overlap matching with experience filter
- AI-powered candidate ranking with explanations
- Match score bar chart visualization
- AI-generated interview questions per candidate
- Search & filter candidates

## Local Development

### Backend
```bash
cd backend
npm install
# copy .env.example to .env and fill in values
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# copy .env.example to .env and fill in VITE_API_URL
npm run dev
```

## Render Deployment

### Backend (Web Service)
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment Variables:
  - `MONGODB_URI`
  - `OPENROUTER_API_KEY`
  - `FRONTEND_URL` (your frontend Render URL)

### Frontend (Static Site)
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variables:
  - `VITE_API_URL` (your backend Render URL)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/candidates` | Add a candidate |
| GET | `/api/candidates` | Get all candidates |
| DELETE | `/api/candidates/:id` | Delete a candidate |
| POST | `/api/match` | Basic skill matching |
| POST | `/api/ai/shortlist` | AI-powered shortlisting |
| POST | `/api/ai/interview-questions` | Generate interview questions |
| GET | `/health` | Health check |
