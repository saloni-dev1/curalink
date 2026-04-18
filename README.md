# Curalink — AI Medical Research Assistant

A full-stack MERN application that retrieves research publications and clinical trials, re-ranks them intelligently, and delivers structured, personalized answers via an open-source LLM (Llama 3.3 70B via Hugging Face).

---

## Architecture

```
User Input
    ↓
React Frontend (Vite) — Vercel
    ↓
Express.js API (Node) — Render
    ↓ (parallel)
PubMed API  ←→  OpenAlex API  ←→  ClinicalTrials.gov
    ↓
Re-ranking Pipeline (relevance + recency + credibility)
    ↓
Llama 3.3 70B via Hugging Face Inference API (structured JSON output)
    ↓
MongoDB Atlas (conversation history)
    ↓
Structured Response → UI
```

---

## Live Demo

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-app.onrender.com

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Hugging Face account + API key (free): https://huggingface.co/settings/tokens

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

### 2. Configure environment variables

**Server (`server/.env`):**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/curalink
HF_API_KEY=hf_your_huggingface_token_here
LLM_MODEL=Meta-Llama-3.3-70B-Instruct
CLIENT_URL=http://localhost:5173
```

**Client (`client/.env`):**
```
VITE_API_URL=http://localhost:5000
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

> No Ollama or local model setup needed. The LLM runs on Hugging Face's infrastructure.

---

## Deployment

### Frontend → Vercel

1. Push repo to GitHub
2. Go to vercel.com → New Project → Import repo
3. Set Root Directory to `client`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-render-backend.onrender.com
   ```
5. Deploy

### Backend → Render

1. Go to render.com → New Web Service → Connect GitHub repo
2. Set Root Directory to `server`
3. Build Command: `npm install`
4. Start Command: `node index.js`
5. Add environment variables:
   ```
   PORT=5000
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/curalink
   HF_API_KEY=hf_your_token_here
   LLM_MODEL=Meta-Llama-3.3-70B-Instruct
   CLIENT_URL=https://your-app.vercel.app
   ```
6. Deploy

### Database → MongoDB Atlas

1. Create free M0 cluster at mongodb.com/atlas
2. Create a database user with read/write access
3. Allow all IPs: `0.0.0.0/0` under Network Access
4. Copy connection string and set as `MONGO_URI`

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
- Model: **Meta Llama 3.3 70B Instruct** (open-source) via Hugging Face + SambaNova
- Temperature: 0.3 (factual, low hallucination)
- Returns structured JSON: `conditionOverview`, `researchInsights`, `clinicalTrials`, `personalizedRecommendation`, `keyTakeaways`, `disclaimer`
- Fallback: if HF API unavailable, returns structured response built directly from ranked results

### Conversation Context
- Last 4 message turns injected into each LLM prompt
- Stored in MongoDB Session model
- In-memory fallback when MongoDB unavailable

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | Node.js, Express, Mongoose |
| LLM | Llama 3.3 70B via Hugging Face Inference API (open-source) |
| Database | MongoDB Atlas |
| APIs | PubMed NCBI, OpenAlex, ClinicalTrials.gov v2 |
| Hosting | Vercel (frontend), Render (backend) |

---

## Getting a Hugging Face API Key

1. Sign up at https://huggingface.co
2. Go to Settings → Access Tokens → Create New Token
3. Choose **Fine-grained** token type
4. Enable **"Make calls to Inference Providers"** permission
5. Copy token and set as `HF_API_KEY` in your `.env`
