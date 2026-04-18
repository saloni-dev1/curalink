import styles from './TypingIndicator.module.css'

export default function TypingIndicator() {
  return (
    <div className={styles.wrap}>
      <div className={styles.avatar}>C</div>
      <div className={styles.bubble}>
        <div className={styles.label}>Retrieving and reasoning</div>
        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        <div className={styles.steps}>
          <span className={styles.step}>Querying PubMed</span>
          <span className={styles.sep}>·</span>
          <span className={styles.step}>OpenAlex</span>
          <span className={styles.sep}>·</span>
          <span className={styles.step}>ClinicalTrials</span>
          <span className={styles.sep}>·</span>
          <span className={styles.step}>Ranking</span>
          <span className={styles.sep}>·</span>
          <span className={styles.step}>LLM reasoning</span>
        </div>
      </div>
    </div>
  )
}
