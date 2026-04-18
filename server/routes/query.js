const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const { fetchPubmed } = require('../services/pubmed');
const { fetchOpenAlex } = require('../services/openalex');
const { fetchClinicalTrials } = require('../services/clinicaltrials');
const { expandQuery, rankResults } = require('../services/ranker');
const { queryLLM } = require('../llm/ollama');

// In-memory sessions fallback (when MongoDB not available)
const memSessions = {};

router.post('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { query, disease: queryDisease } = req.body;

  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    // Load session
    let session = null;
    let disease = queryDisease || '';
    let patientName = 'Patient';
    let location = '';
    let conversationHistory = [];

    try {
      session = await Session.findById(sessionId);
      if (session) {
        disease = disease || session.disease;
        patientName = session.patientName;
        location = session.location;
        conversationHistory = session.messages.slice(-4);
      }
    } catch {
      // Use in-memory
      if (memSessions[sessionId]) {
        const mem = memSessions[sessionId];
        disease = disease || mem.disease;
        patientName = mem.patientName;
        location = mem.location;
        conversationHistory = (mem.messages || []).slice(-4);
      }
    }

    if (!disease) return res.status(400).json({ error: 'Disease context required' });

    // Step 1: Expand query
    const { expanded } = expandQuery(disease, query);
    console.log(`Query expanded: "${query}" -> "${expanded}"`);

    // Step 2: Parallel fetch from all 3 sources
    const startTime = Date.now();
    const [pubmedResult, openalexResult, trialsResult] = await Promise.allSettled([
      fetchPubmed(expanded, 80),
      fetchOpenAlex(expanded, 100),
      fetchClinicalTrials(disease, query, location, 50)
    ]);

    const pubmedPubs = pubmedResult.status === 'fulfilled' ? pubmedResult.value : [];
    const openalexPubs = openalexResult.status === 'fulfilled' ? openalexResult.value : [];
    const allTrials = trialsResult.status === 'fulfilled' ? trialsResult.value : [];
    const allPubs = [...pubmedPubs, ...openalexPubs];

    console.log(`Fetched: ${pubmedPubs.length} PubMed, ${openalexPubs.length} OpenAlex, ${allTrials.length} trials in ${Date.now()-startTime}ms`);

    // Step 3: Re-rank
    const { publications, trials, totalFetched } = rankResults(allPubs, allTrials, disease, query);

    // Step 4: LLM reasoning
    const llmResponse = await queryLLM(disease, query, patientName, publications, trials, conversationHistory);

    // Step 5: Build final response
    const responseData = {
      ...llmResponse,
      publications,
      clinicalTrialsData: trials,
      meta: {
        totalFetched,
        ranked: { publications: publications.length, trials: trials.length },
        expandedQuery: expanded,
        processingTime: Date.now() - startTime
      }
    };

    // Step 6: Save to session
    const userMsg = { role: 'user', content: query };
    const assistantMsg = {
      role: 'assistant',
      content: llmResponse.personalizedRecommendation || 'Research summary generated.',
      structuredData: responseData
    };

    try {
      if (session) {
        session.messages.push(userMsg, assistantMsg);
        await session.save();
      } else {
        if (!memSessions[sessionId]) memSessions[sessionId] = { messages: [], disease, patientName, location };
        memSessions[sessionId].messages.push(userMsg, assistantMsg);
      }
    } catch (e) {
      console.error('Session save error:', e.message);
    }

    res.json(responseData);
  } catch (err) {
    console.error('Query pipeline error:', err);
    res.status(500).json({ error: 'Pipeline error: ' + err.message });
  }
});

module.exports = router;
