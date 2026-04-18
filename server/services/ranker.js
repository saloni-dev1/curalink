function expandQuery(disease, query) {
  const base = `${query} ${disease}`.trim();
  // Generate synonym expansions
  const synonyms = {
    'cancer': ['carcinoma', 'tumor', 'malignancy', 'oncology'],
    'diabetes': ['glycemic', 'insulin', 'hyperglycemia', 'T2DM'],
    'alzheimer': ['dementia', 'neurodegeneration', 'amyloid', 'cognitive decline'],
    'parkinson': ['dopamine', 'neurodegeneration', 'tremor', 'DBS'],
    'heart disease': ['cardiovascular', 'coronary', 'cardiac', 'myocardial'],
    'depression': ['antidepressant', 'MDD', 'mood disorder', 'SSRi'],
    'dbs': ['deep brain stimulation', 'neurostimulation', 'subthalamic nucleus'],
    'lung cancer': ['NSCLC', 'SCLC', 'pulmonary carcinoma', 'thoracic oncology']
  };

  const lower = base.toLowerCase();
  let expanded = base;
  for (const [key, vals] of Object.entries(synonyms)) {
    if (lower.includes(key)) {
      expanded = `${base} ${vals.slice(0, 2).join(' ')}`;
      break;
    }
  }
  return { base, expanded };
}

function scorePublication(pub, terms) {
  let score = 0;
  const text = `${pub.title} ${pub.abstract}`.toLowerCase();
  const currentYear = new Date().getFullYear();

  // Keyword relevance
  terms.forEach(term => {
    const t = term.toLowerCase().trim();
    if (!t) return;
    const count = (text.match(new RegExp(t, 'g')) || []).length;
    score += Math.min(count * 8, 40);
  });

  // Title match bonus (title hits worth more)
  const titleText = pub.title.toLowerCase();
  terms.forEach(term => {
    if (titleText.includes(term.toLowerCase())) score += 15;
  });

  // Recency
  const age = currentYear - (pub.year || 2000);
  score += Math.max(0, 30 - age * 3);

  // Has abstract
  if (pub.abstract && pub.abstract.length > 150) score += 10;

  // Citation count (OpenAlex)
  if (pub.citationCount) score += Math.min(pub.citationCount / 10, 20);

  return score;
}

function scoreTrial(trial, terms) {
  let score = 0;
  const text = `${trial.title} ${trial.briefSummary}`.toLowerCase();

  terms.forEach(term => {
    if (text.includes(term.toLowerCase())) score += 10;
  });

  // Status bonus
  if (trial.status === 'RECRUITING') score += 20;
  if (trial.status === 'ACTIVE_NOT_RECRUITING') score += 10;

  // Has contact info
  if (trial.contacts?.length) score += 5;

  return score;
}

function rankResults(publications, trials, disease, query) {
  const terms = [disease, ...query.split(' ')].filter(t => t.length > 2);

  const scoredPubs = publications
    .map(p => ({ ...p, _score: scorePublication(p, terms) }))
    .sort((a, b) => b._score - a._score);

  const scoredTrials = trials
    .map(t => ({ ...t, _score: scoreTrial(t, terms) }))
    .sort((a, b) => b._score - a._score);

  // Deduplicate by title similarity
  const dedupedPubs = [];
  const seenTitles = new Set();
  for (const pub of scoredPubs) {
    const key = pub.title.toLowerCase().substring(0, 50);
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      dedupedPubs.push(pub);
    }
  }

  return {
    publications: dedupedPubs.slice(0, 8),
    trials: scoredTrials.slice(0, 6),
    totalFetched: { publications: publications.length, trials: trials.length }
  };
}

module.exports = { expandQuery, rankResults };
