import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './LandingPage.module.css'

const API = import.meta.env.VITE_API_URL || ''

const EXAMPLE_QUERIES = [
  { disease: 'Parkinson\'s disease', query: 'Deep Brain Stimulation', icon: '⬡' },
  { disease: 'Lung Cancer', query: 'Latest immunotherapy treatments', icon: '⬡' },
  { disease: 'Type 2 Diabetes', query: 'Clinical trials recruiting', icon: '⬡' },
  { disease: 'Alzheimer\'s disease', query: 'Amyloid beta inhibitors', icon: '⬡' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ patientName: '', disease: '', query: '', location: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.disease.trim()) { setError('Please enter a disease or condition.'); return }
    setError(''); setLoading(true)
    try {
      const res = await axios.post(`${API}/api/session`, form)
      navigate(`/chat/${res.data.sessionId}`, { state: { initialQuery: form.query, disease: form.disease, patientName: form.patientName } })
    } catch {
      setError('Could not connect to server. Please ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const useExample = ex => setForm(f => ({ ...f, disease: ex.disease, query: ex.query }))

  return (
    <div className={styles.root}>
      <div className={styles.bg}>
        <div className={styles.grid} />
        <div className={styles.glow1} />
        <div className={styles.glow2} />
        <div className={styles.scanline} />
      </div>

      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>C</span>
          <span className={styles.logoText}>uralink</span>
        </div>
        <div className={styles.navTag}>AI Medical Research</div>
      </nav>

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.badge}>Research-backed · Source-cited · Context-aware</div>
          <h1 className={styles.headline}>
            Medical research,<br />
            <em>reasoned for you.</em>
          </h1>
          <p className={styles.sub}>
            Enter your condition and query. Curalink retrieves publications from PubMed and OpenAlex,
            active clinical trials, and delivers structured insights — powered by open-source AI.
          </p>
        </div>

        <div className={styles.formWrap}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Patient name <span className={styles.opt}>optional</span></label>
                <input
                  className={styles.input}
                  name="patientName"
                  value={form.patientName}
                  onChange={handleChange}
                  placeholder="e.g. John Smith"
                  autoComplete="off"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Location <span className={styles.opt}>optional</span></label>
                <input
                  className={styles.input}
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Toronto, Canada"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Disease or condition <span className={styles.req}>*</span></label>
              <input
                className={`${styles.input} ${styles.inputLg}`}
                name="disease"
                value={form.disease}
                onChange={handleChange}
                placeholder="e.g. Parkinson's disease, Type 2 Diabetes, Lung Cancer"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Research query <span className={styles.opt}>optional</span></label>
              <input
                className={`${styles.input} ${styles.inputLg}`}
                name="query"
                value={form.query}
                onChange={handleChange}
                placeholder="e.g. Deep brain stimulation, latest treatments, clinical trials"
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? (
                <><span className={styles.spinner} /> Initializing session...</>
              ) : (
                <><span>Begin Research Session</span><span className={styles.arrow}>→</span></>
              )}
            </button>
          </form>

          <div className={styles.examples}>
            <div className={styles.examplesLabel}>Try an example</div>
            <div className={styles.examplesList}>
              {EXAMPLE_QUERIES.map((ex, i) => (
                <button key={i} className={styles.exampleChip} onClick={() => useExample(ex)}>
                  <span className={styles.exIcon}>{ex.icon}</span>
                  <span>{ex.disease} — {ex.query}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.sources}>
          <span className={styles.sourcesLabel}>Data sources</span>
          <div className={styles.sourcesBadges}>
            <span className={styles.sourceBadge}>PubMed NCBI</span>
            <span className={styles.dot}>·</span>
            <span className={styles.sourceBadge}>OpenAlex</span>
            <span className={styles.dot}>·</span>
            <span className={styles.sourceBadge}>ClinicalTrials.gov</span>
            <span className={styles.dot}>·</span>
            <span className={styles.sourceBadge}>Mistral via Ollama</span>
          </div>
        </div>
      </main>
    </div>
  )
}
