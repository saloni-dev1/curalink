const axios = require('axios');

function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return '';
  const words = {};
  for (const [word, positions] of Object.entries(invertedIndex)) {
    positions.forEach(pos => { words[pos] = word; });
  }
  return Object.keys(words).sort((a, b) => a - b).map(k => words[k]).join(' ');
}

async function fetchOpenAlex(query, maxResults = 100) {
  try {
    const currentYear = new Date().getFullYear();
    const res = await axios.get('https://api.openalex.org/works', {
      params: {
        search: query,
        'per-page': maxResults,
        page: 1,
        sort: 'relevance_score:desc',
        filter: `from_publication_date:2015-01-01,to_publication_date:${currentYear}-12-31`
      },
      headers: { 'User-Agent': 'Curalink/1.0 (medical-research-assistant)' },
      timeout: 10000
    });

    const results = res.data.results || [];
    return results.map(work => {
      const authors = (work.authorships || [])
        .slice(0, 5)
        .map(a => a.author?.display_name)
        .filter(Boolean);

      const abstract = reconstructAbstract(work.abstract_inverted_index);
      const doi = work.doi ? work.doi.replace('https://doi.org/', '') : '';

      return {
        title: work.title || 'No title',
        abstract: abstract || 'No abstract available',
        authors,
        year: work.publication_year || 0,
        source: 'OpenAlex',
        url: work.doi || work.id || '',
        doi,
        citationCount: work.cited_by_count || 0
      };
    }).filter(p => p.title && p.title !== 'No title');
  } catch (err) {
    console.error('OpenAlex error:', err.message);
    return [];
  }
}

module.exports = { fetchOpenAlex };
