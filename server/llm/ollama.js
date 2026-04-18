const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.LLM_MODEL || 'mistral';

const SYSTEM_PROMPT = `You are Curalink, an expert AI medical research assistant. You receive:
1. Patient context: disease, query, name, location
2. Top-ranked research publications with abstracts
3. Relevant clinical trials

Your task is to produce a JSON response ONLY (no other text, no markdown fences) with this exact structure:
{
  "conditionOverview": "2-3 sentence evidence-based summary of the condition and current treatment landscape",
  "researchInsights": [
    {
      "finding": "Specific finding from the research",
      "source": "Publication title (shortened)",
      "year": 2024,
      "significance": "Why this matters clinically"
    }
  ],
  "clinicalTrials": [
    {
      "title": "Trial title",
      "status": "RECRUITING",
      "relevance": "Why this trial is relevant to the patient"
    }
  ],
  "personalizedRecommendation": "Personalized paragraph referencing specific studies and the patient's context",
  "keyTakeaways": ["Point 1", "Point 2", "Point 3"],
  "disclaimer": "This information is for educational purposes only. Always consult a qualified healthcare provider before making medical decisions."
}

Rules:
- ONLY reference publications and trials provided to you
- Never invent citations or data
- Be specific and cite source titles when making claims
- Use plain language while remaining medically accurate
- If follow-up context exists, reference prior conversation
- Return ONLY valid JSON, nothing else`;

function buildPrompt(disease, query, patientName, publications, trials, conversationHistory) {
  const pubsText = publications.slice(0, 6).map((p, i) =>
    `[PUB ${i+1}] "${p.title}" (${p.source}, ${p.year})
Authors: ${p.authors.slice(0,3).join(', ')}
Abstract: ${p.abstract.substring(0, 400)}...`
  ).join('\n\n');

  const trialsText = trials.slice(0, 4).map((t, i) =>
    `[TRIAL ${i+1}] "${t.title}"
Status: ${t.status} | Phase: ${t.phase}
Summary: ${t.briefSummary.substring(0, 200)}...
Location: ${t.locations.slice(0,2).join(', ') || 'Not specified'}`
  ).join('\n\n');

  const historyText = conversationHistory.length > 0
    ? `\nPREVIOUS CONVERSATION:\n${conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n`
    : '';

  return `PATIENT: ${patientName || 'Patient'}
DISEASE: ${disease}
QUERY: ${query}
${historyText}
RESEARCH PUBLICATIONS (${publications.length} retrieved, showing top 6):
${pubsText}

CLINICAL TRIALS (${trials.length} retrieved, showing top 4):
${trialsText}

Generate a comprehensive, personalized research summary as JSON.`;
}

async function queryLLM(disease, query, patientName, publications, trials, conversationHistory = []) {
  const userMessage = buildPrompt(disease, query, patientName, publications, trials, conversationHistory);

  try {
    const res = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: MODEL,
      stream: false,
      options: { temperature: 0.3, num_predict: 2000 },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ]
    }, { timeout: 60000 });

    const content = res.data.message?.content || '';
    // Strip any accidental markdown fences
    const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      // Fallback: return structured response without LLM
      return generateFallbackResponse(disease, query, patientName, publications, trials);
    }
    console.error('LLM error:', err.message);
    return generateFallbackResponse(disease, query, patientName, publications, trials);
  }
}

function generateFallbackResponse(disease, query, patientName, publications, trials) {
  return {
    conditionOverview: `${disease} is an active area of medical research. Based on ${publications.length} retrieved publications and ${trials.length} clinical trials, here is what current evidence shows regarding ${query}.`,
    researchInsights: publications.slice(0, 4).map(p => ({
      finding: p.abstract.substring(0, 150) + '...',
      source: p.title.substring(0, 60),
      year: p.year,
      significance: 'Retrieved from ' + p.source
    })),
    clinicalTrials: trials.slice(0, 3).map(t => ({
      title: t.title,
      status: t.status,
      relevance: t.briefSummary.substring(0, 150) + '...'
    })),
    personalizedRecommendation: `Based on the available research for ${patientName || 'the patient'} regarding ${query} in the context of ${disease}, the evidence suggests reviewing the retrieved publications with a healthcare provider.`,
    keyTakeaways: [
      `${publications.length} relevant publications retrieved from PubMed and OpenAlex`,
      `${trials.length} clinical trials found for ${disease}`,
      'Consult a specialist to interpret these findings in your specific context'
    ],
    disclaimer: 'This information is for educational purposes only. Always consult a qualified healthcare provider before making medical decisions.',
    _fallback: true
  };
}

module.exports = { queryLLM };
