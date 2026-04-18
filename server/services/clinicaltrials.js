const axios = require('axios');

async function fetchClinicalTrials(disease, query, location = '', maxResults = 50) {
  try {
    const searchTerm = `${disease} ${query}`.trim();
    const params = {
      'query.cond': searchTerm,
      'filter.overallStatus': 'RECRUITING,COMPLETED,ACTIVE_NOT_RECRUITING',
      pageSize: maxResults,
      format: 'json'
    };
    if (location) params['query.locn'] = location;

    const res = await axios.get('https://clinicaltrials.gov/api/v2/studies', {
      params,
      timeout: 12000
    });

    const studies = res.data.studies || [];

    return studies.map(study => {
      const proto = study.protocolSection || {};
      const id = proto.identificationModule || {};
      const status = proto.statusModule || {};
      const desc = proto.descriptionModule || {};
      const eligibility = proto.eligibilityModule || {};
      const contacts = proto.contactsLocationsModule || {};
      const design = proto.designModule || {};

      const locations = (contacts.locations || []).slice(0, 3).map(l =>
        [l.city, l.state, l.country].filter(Boolean).join(', ')
      );

      const centralContacts = (contacts.centralContacts || []).slice(0, 2).map(c => ({
        name: c.name || '',
        email: c.email || '',
        phone: c.phone || ''
      }));

      return {
        title: id.briefTitle || 'No title',
        nctId: id.nctId || '',
        status: status.overallStatus || 'Unknown',
        phase: (design.phases || []).join(', ') || 'N/A',
        briefSummary: desc.briefSummary || '',
        eligibilityCriteria: eligibility.eligibilityCriteria || '',
        minAge: eligibility.minimumAge || 'N/A',
        maxAge: eligibility.maximumAge || 'N/A',
        sex: eligibility.sex || 'All',
        locations: locations,
        contacts: centralContacts,
        url: id.nctId ? `https://clinicaltrials.gov/study/${id.nctId}` : '',
        startDate: status.startDateStruct?.date || 'N/A'
      };
    }).filter(t => t.title && t.title !== 'No title');
  } catch (err) {
    console.error('ClinicalTrials error:', err.message);
    return [];
  }
}

module.exports = { fetchClinicalTrials };
