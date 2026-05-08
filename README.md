# JobForge — AI-Powered Job Search Agent for Data Engineers

Automatically scrapes job boards, scores matches, and customizes your resume using Claude AI.

## Stack

| Layer    | Technology                                           |
|----------|------------------------------------------------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS                 |
| Backend  | Python 3.9+, FastAPI, SQLAlchemy, AsyncPG            |
| AI       | Anthropic Claude API (resume customization + agent)  |
| Database | PostgreSQL                                           |
| Scraping | httpx + BeautifulSoup (LinkedIn, Indeed, Glassdoor, ZipRecruiter, Monster) |

---

## Quick Start

### 1. Start PostgreSQL
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env          # add your ANTHROPIC_API_KEY
source ../venv/bin/activate   # or: python3 -m venv ../venv && source ../venv/bin/activate && pip install -r requirements.txt
python db/seed.py             # seed 5 sample jobs
python main.py                # starts on http://localhost:8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                   # starts on http://localhost:3000
```

Open **http://localhost:3000**

---

## Features

| Feature | Description |
|---------|-------------|
| Job Search | Scrapes LinkedIn, Indeed, Glassdoor, ZipRecruiter, Monster daily |
| AI Scoring | Ranks jobs by skills match, salary, competition level |
| Resume AI | Claude customizes your DOCX resume per job for ATS optimization |
| Application Tracker | Track status (applied → interviewing → offer/rejected) |
| Dashboard | Stats, top matches, quick tips |
| Settings | Skills, salary range, locations, keywords |

## API Endpoints

```
GET  /api/jobs              List jobs (filters: search, source, remote, saved_only)
POST /api/jobs/search       Trigger on-demand scrape
PUT  /api/jobs/:id/save     Save/unsave job

POST /api/resume/upload     Upload base DOCX resume
POST /api/resume/customize/:id/sync   AI-customize resume for job
GET  /api/resume/:id/download         Download customized DOCX

GET  /api/applications      All tracked applications
POST /api/applications      Track new application
PUT  /api/applications/:id  Update status/notes

GET  /api/settings          Get preferences
POST /api/settings          Save preferences
```

## Key Config

Add to `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...    # Required for AI resume customization
DATABASE_URL=postgresql+asyncpg://jobforge:jobforge123@localhost:5432/jobforgedb
```

## Deployment

- **Frontend** → Vercel
- **Backend** → Railway / Fly.io / Render  
- **Database** → Neon / Supabase / AWS RDS
