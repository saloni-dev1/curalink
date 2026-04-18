import { useState, useRef, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './ChatPage.module.css'
import MessageBubble from '../components/MessageBubble'
import ResearchPanel from '../components/ResearchPanel'
import TypingIndicator from '../components/TypingIndicator'

const API = import.meta.env.VITE_API_URL || ''

export default function ChatPage() {
  const { sessionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { initialQuery, disease, patientName } = location.state || {}

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeResult, setActiveResult] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const sentInitial = useRef(false)

  useEffect(() => {
    if (initialQuery && !sentInitial.current) {
      sentInitial.current = true
      sendQuery(initialQuery)
    } else if (!initialQuery && !sentInitial.current) {
      sentInitial.current = true
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendQuery = async (queryText) => {
    const q = queryText || input.trim()
    if (!q || loading) return
    setInput('')
    setError('')
    setLoading(true)

    const userMsg = { id: Date.now(), role: 'user', content: q }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await axios.post(`${API}/api/query/${sessionId}`, {
        query: q,
        disease
      })
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.personalizedRecommendation || 'Research complete.',
        data: res.data
      }
      setMessages(prev => [...prev, assistantMsg])
      setActiveResult(res.data)
      setPanelOpen(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Research failed. Please try again.')
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'error',
        content: err.response?.data?.error || 'An error occurred. Please try again.'
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendQuery()
    }
  }

  const FOLLOW_UP = [
    'What are the side effects?',
    'Are there clinical trials I can join?',
    'What do top researchers say?',
    'Explain this to a non-specialist',
  ]

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <span>←</span> New session
        </button>
        <div className={styles.sessionInfo}>
          <div className={styles.sessionLabel}>Current session</div>
          <div className={styles.sessionDisease}>{disease || 'General Research'}</div>
          {patientName && <div className={styles.sessionPatient}>{patientName}</div>}
        </div>
        <div className={styles.sidebarDivider} />
        <div className={styles.sidebarSection}>
          <div className={styles.sidebarLabel}>Data sources</div>
          <div className={styles.sourceList}>
            <div className={styles.sourceItem}><span className={styles.sourceDot} style={{background:'#4fffb0'}} />PubMed NCBI</div>
            <div className={styles.sourceItem}><span className={styles.sourceDot} style={{background:'#00d4ff'}} />OpenAlex</div>
            <div className={styles.sourceItem}><span className={styles.sourceDot} style={{background:'#7b68ff'}} />ClinicalTrials.gov</div>
            <div className={styles.sourceItem}><span className={styles.sourceDot} style={{background:'#ff9f43'}} />Mistral LLM</div>
          </div>
        </div>
        <div className={styles.sidebarDivider} />
        <div className={styles.sidebarSection}>
          <div className={styles.sidebarLabel}>Quick queries</div>
          <div className={styles.quickList}>
            {FOLLOW_UP.map((q, i) => (
              <button key={i} className={styles.quickBtn} onClick={() => { setInput(q); inputRef.current?.focus() }}>
                {q}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.sidebarFooter}>
          <div className={styles.disclaimer}>For research purposes only. Always consult a qualified healthcare provider.</div>
        </div>
      </aside>

      {/* Chat area */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>
              <span className={styles.logoMark}>C</span>
              <span className={styles.logoText}>uralink</span>
            </div>
            <div className={styles.headerBadge}>{disease || 'Research Session'}</div>
          </div>
          {activeResult && (
            <button className={styles.panelToggle} onClick={() => setPanelOpen(p => !p)}>
              {panelOpen ? 'Hide sources' : 'View sources'}
              <span className={styles.panelCount}>
                {(activeResult.publications?.length || 0) + (activeResult.clinicalTrialsData?.length || 0)}
              </span>
            </button>
          )}
        </header>

        <div className={styles.messages}>
          {messages.length === 0 && !loading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⬡</div>
              <div className={styles.emptyTitle}>Research session started</div>
              <div className={styles.emptyText}>
                Ask anything about <strong>{disease}</strong>. Curalink will retrieve
                real publications, clinical trials, and synthesize an evidence-backed answer.
              </div>
              <div className={styles.emptySuggestions}>
                {['Latest treatments', 'Clinical trials recruiting', 'Side effects and risks', 'Top researchers'].map((s, i) => (
                  <button key={i} className={styles.suggestionChip} onClick={() => sendQuery(s + ' for ' + disease)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              index={i}
              onViewSources={() => { setActiveResult(msg.data); setPanelOpen(true) }}
            />
          ))}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className={styles.errorBar}>
            <span>{error}</span>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className={styles.inputArea}>
          <div className={styles.inputWrap}>
            <textarea
              ref={inputRef}
              className={styles.textarea}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Ask about ${disease || 'your condition'}...`}
              rows={1}
              disabled={loading}
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendQuery()}
              disabled={loading || !input.trim()}
            >
              {loading ? <span className={styles.spinner} /> : '↑'}
            </button>
          </div>
          <div className={styles.inputHint}>Press Enter to send · Shift+Enter for new line</div>
        </div>
      </main>

      {/* Research panel */}
      {panelOpen && activeResult && (
        <ResearchPanel
          data={activeResult}
          disease={disease}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  )
}
