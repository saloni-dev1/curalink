import { useState } from 'react'
import styles from './ResearchPanel.module.css'

const STATUS_COLOR = {
  RECRUITING: '#4fffb0',
  COMPLETED: '#00d4ff',
  ACTIVE_NOT_RECRUITING: '#ff9f43',
  TERMINATED: '#ff6b6b',
  WITHDRAWN: '#8b96ab',
  UNKNOWN: '#8b96ab'
}

export default function ResearchPanel({ data, disease, onClose }) {
  const [tab, setTab] = useState('publications')
  const { publications = [], clinicalTrialsData = [], meta, researchInsights = [] } = data

  return (
    <aside className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>Research sources</div>
        <div className={styles.panelMeta}>
          {meta?.totalFetched && (
            <span className={styles.fetchedBadge}>
              {meta.totalFetched.publications + meta.totalFetched.trials} retrieved → {publications.length + clinicalTrialsData.length} ranked
            </span>
          )}
        </div>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      {meta?.expandedQuery && (
        <div className={styles.queryExpanded}>
          <span className={styles.queryLabel}>Expanded query</span>
          <span className={styles.queryText}>"{meta.expandedQuery}"</span>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'publications' ? styles.tabActive : ''}`}
          onClick={() => setTab('publications')}
        >
          Publications
          <span className={styles.tabCount}>{publications.length}</span>
        </button>
        <button
          className={`${styles.tab} ${tab === 'trials' ? styles.tabActive : ''}`}
          onClick={() => setTab('trials')}
        >
          Clinical trials
          <span className={styles.tabCount}>{clinicalTrialsData.length}</span>
        </button>
        {researchInsights.length > 0 && (
          <button
            className={`${styles.tab} ${tab === 'insights' ? styles.tabActive : ''}`}
            onClick={() => setTab('insights')}
          >
            Insights
            <span className={styles.tabCount}>{researchInsights.length}</span>
          </button>
        )}
      </div>

      <div className={styles.content}>
        {tab === 'publications' && (
          <div className={styles.list}>
            {publications.length === 0 && (
              <div className={styles.empty}>No publications retrieved.</div>
            )}
            {publications.map((pub, i) => (
              <PublicationCard key={i} pub={pub} index={i} />
            ))}
          </div>
        )}

        {tab === 'trials' && (
          <div className={styles.list}>
            {clinicalTrialsData.length === 0 && (
              <div className={styles.empty}>No clinical trials found for this query.</div>
            )}
            {clinicalTrialsData.map((trial, i) => (
              <TrialCard key={i} trial={trial} index={i} />
            ))}
          </div>
        )}

        {tab === 'insights' && (
          <div className={styles.list}>
            {researchInsights.map((insight, i) => (
              <InsightCard key={i} insight={insight} index={i} />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

function PublicationCard({ pub, index }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={styles.card} style={{ animationDelay: `${index * 0.04}s` }}>
      <div className={styles.cardHeader}>
        <span className={`${styles.sourcePill} ${pub.source === 'PubMed' ? styles.pubmed : styles.openalex}`}>
          {pub.source}
        </span>
        <span className={styles.year}>{pub.year || 'N/A'}</span>
      </div>
      <div className={styles.cardTitle}>
        {pub.url ? (
          <a href={pub.url} target="_blank" rel="noopener noreferrer" className={styles.titleLink}>
            {pub.title}
          </a>
        ) : pub.title}
      </div>
      {pub.authors?.length > 0 && (
        <div className={styles.authors}>{pub.authors.slice(0, 3).join(', ')}{pub.authors.length > 3 ? ' et al.' : ''}</div>
      )}
      {pub.abstract && pub.abstract !== 'No abstract available' && (
        <div className={styles.abstractWrap}>
          <div className={`${styles.abstract} ${expanded ? styles.abstractExpanded : ''}`}>
            {pub.abstract}
          </div>
          <button className={styles.expandBtn} onClick={() => setExpanded(e => !e)}>
            {expanded ? 'Show less' : 'Show abstract'}
          </button>
        </div>
      )}
      {pub.citationCount > 0 && (
        <div className={styles.citCount}>Cited {pub.citationCount} times</div>
      )}
    </div>
  )
}

function TrialCard({ trial, index }) {
  const [expanded, setExpanded] = useState(false)
  const color = STATUS_COLOR[trial.status] || STATUS_COLOR.UNKNOWN
  return (
    <div className={styles.card} style={{ animationDelay: `${index * 0.04}s` }}>
      <div className={styles.cardHeader}>
        <span className={styles.statusPill} style={{ color, borderColor: `${color}30`, background: `${color}10` }}>
          {trial.status?.replace(/_/g, ' ')}
        </span>
        {trial.phase && trial.phase !== 'N/A' && (
          <span className={styles.phase}>Phase {trial.phase}</span>
        )}
        {trial.nctId && <span className={styles.nctId}>{trial.nctId}</span>}
      </div>
      <div className={styles.cardTitle}>
        {trial.url ? (
          <a href={trial.url} target="_blank" rel="noopener noreferrer" className={styles.titleLink}>
            {trial.title}
          </a>
        ) : trial.title}
      </div>

      {trial.briefSummary && (
        <div className={styles.abstractWrap}>
          <div className={`${styles.abstract} ${expanded ? styles.abstractExpanded : ''}`}>
            {trial.briefSummary}
          </div>
          <button className={styles.expandBtn} onClick={() => setExpanded(e => !e)}>
            {expanded ? 'Show less' : 'Show summary'}
          </button>
        </div>
      )}

      <div className={styles.trialMeta}>
        {trial.minAge !== 'N/A' && (
          <span className={styles.trialMetaItem}>Ages: {trial.minAge} – {trial.maxAge}</span>
        )}
        {trial.sex && trial.sex !== 'All' && (
          <span className={styles.trialMetaItem}>Sex: {trial.sex}</span>
        )}
        {trial.startDate && trial.startDate !== 'N/A' && (
          <span className={styles.trialMetaItem}>Started: {trial.startDate}</span>
        )}
      </div>

      {trial.locations?.length > 0 && (
        <div className={styles.locations}>
          <span className={styles.locLabel}>Locations: </span>
          {trial.locations.join(' · ')}
        </div>
      )}

      {trial.contacts?.length > 0 && (
        <div className={styles.contacts}>
          {trial.contacts.map((c, i) => (
            <div key={i} className={styles.contact}>
              {c.name && <span>{c.name}</span>}
              {c.email && <a href={`mailto:${c.email}`} className={styles.contactLink}>{c.email}</a>}
              {c.phone && <span>{c.phone}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InsightCard({ insight, index }) {
  return (
    <div className={styles.insightCard} style={{ animationDelay: `${index * 0.04}s` }}>
      <div className={styles.insightFinding}>{insight.finding}</div>
      <div className={styles.insightMeta}>
        <span className={styles.insightSource}>{insight.source}</span>
        {insight.year && <span className={styles.insightYear}>{insight.year}</span>}
      </div>
      {insight.significance && (
        <div className={styles.insightSig}>{insight.significance}</div>
      )}
    </div>
  )
}
