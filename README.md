# Curalink — AI Medical Research Assistant

A full-stack MERN application that retrieves research publications and clinical trials, re-ranks them intelligently, and delivers structured, personalized answers via an open-source LLM (Mistral via Ollama).

---

## Architecture

```
User Input
    ↓
React Frontend (Vite)
    ↓
Express.js API (Node)
    ↓ (parallel)
PubMed API  ←→  OpenAlex API  ←→  ClinicalTrials.gov
    ↓
Re-ranking Pipeline (relevance + recency + credibility)
    ↓
Mistral LLM via Ollama (structured JSON output)
    ↓
MongoDB (conversation history)
    ↓
Structured Response → UI
```

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Ollama installed: https://ollama.ai

### 1. Clone and install

```bash
# Server
cd server
cp .env.example .env
npm install

# Client
cd ../client
cp .env.example .env
npm install
```

### 2. Start Ollama and pull model

```bash
ollama serve
# In another terminal:
ollama pull mistral
```

### 3. Start the server

```bash
cd server
npm run dev
# Runs on http://localhost:5000
```

### 4. Start the client

```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

---

## Environment Variables

### Server (`server/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/curalink
OLLAMA_URL=http://localhost:11434
LLM_MODEL=mistral
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```
VITE_API_URL=http://localhost:5000
```

---

## Deployment

### Client → Vercel
```bash
cd client
npm run build
# Deploy dist/ to Vercel or use: vercel --prod
```

### Server → Railway (with Docker)
```bash
cd server
# Push to GitHub, connect to Railway
# Railway detects Dockerfile automatically
# Set environment variables in Railway dashboard
```

---

## Pipeline Details

### Query Expansion
- Merges disease context + query into an expanded search string
- Adds domain-specific synonyms (e.g. "DBS" → "deep brain stimulation")

### Data Retrieval (Parallel)
| Source | Method | Max Fetch |
|--------|--------|-----------|
| PubMed | esearch → efetch (XML parse) | 80 results |
| OpenAlex | REST search + abstract reconstruction | 100 results |
| ClinicalTrials.gov | v2 API structured params | 50 results |

### Re-ranking Algorithm
Score per publication:
- Keyword hits in title/abstract: +8 per match, capped at 40
- Title match bonus: +15 per term
- Recency: +30 − (3 × years_old)
- Has abstract: +10
- Citation count: min(citations/10, 20)

Top 8 publications and 6 trials returned.

### LLM Reasoning
- Model: Mistral 7B via Ollama (local inference)
- Temperature: 0.3 (factual, low hallucination)
- Returns structured JSON: conditionOverview, researchInsights, clinicalTrials, personalizedRecommendation, keyTakeaways, disclaimer
- Fallback: if Ollama unavailable, returns structured response built from ranked results directly

### Conversation Context
- Last 4 message turns injected into each LLM prompt
- Stored in MongoDB Session model
- In-memory fallback when MongoDB unavailable

---

## Tech Stack
- **Frontend**: React 18, Vite, React Router, Axios
- **Backend**: Node.js, Express, Mongoose
- **LLM**: Mistral via Ollama (open-source, local)
- **Database**: MongoDB
- **APIs**: PubMed NCBI, OpenAlex, ClinicalTrials.gov v2
