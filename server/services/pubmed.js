const axios = require('axios');
const xml2js = require('xml2js');

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

async function fetchPubmed(query, maxResults = 80) {
  try {
    // Step 1: search for IDs
    const searchRes = await axios.get(`${BASE}/esearch.fcgi`, {
      params: { db: 'pubmed', term: query, retmax: maxResults, sort: 'pub date', retmode: 'json' },
      timeout: 10000
    });
    const ids = searchRes.data.esearchresult?.idlist || [];
    if (!ids.length) return [];

    // Step 2: fetch details
    const fetchRes = await axios.get(`${BASE}/efetch.fcgi`, {
      params: { db: 'pubmed', id: ids.slice(0, 50).join(','), retmode: 'xml' },
      timeout: 15000
    });

    const parsed = await xml2js.parseStringPromise(fetchRes.data, { explicitArray: false });
    const articles = parsed?.PubmedArticleSet?.PubmedArticle;
    if (!articles) return [];

    const articleList = Array.isArray(articles) ? articles : [articles];

    return articleList.map(article => {
      const medline = article.MedlineCitation;
      const articleData = medline?.Article;
      const abstract = articleData?.Abstract?.AbstractText;
      const abstractText = typeof abstract === 'string' ? abstract :
        (abstract?._ || (Array.isArray(abstract) ? abstract.map(a => a._ || a).join(' ') : ''));

      const authorList = articleData?.AuthorList?.Author;
      const authors = authorList ? (Array.isArray(authorList) ? authorList : [authorList])
        .map(a => `${a.ForeName || ''} ${a.LastName || ''}`.trim())
        .filter(Boolean).slice(0, 5) : [];

      const pubDate = medline?.Article?.Journal?.JournalIssue?.PubDate;
      const year = pubDate?.Year || pubDate?.MedlineDate?.substring(0, 4) || 'N/A';

      const pmid = medline?.PMID?._ || medline?.PMID || '';

      return {
        title: articleData?.ArticleTitle?._ || articleData?.ArticleTitle || 'No title',
        abstract: abstractText || 'No abstract available',
        authors,
        year: parseInt(year) || 0,
        source: 'PubMed',
        url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : '',
        pmid
      };
    }).filter(p => p.title && p.title !== 'No title');
  } catch (err) {
    console.error('PubMed error:', err.message);
    return [];
  }
}

module.exports = { fetchPubmed };
