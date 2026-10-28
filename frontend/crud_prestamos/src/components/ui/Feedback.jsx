import styles from './ui.module.css'

export function Loading({ label = 'Cargando…', fullscreen = false }) {
  return (
    <div className={`${styles.loading} ${fullscreen ? styles.fullscreen : ''}`} role="status">
      <span className={styles.spinner} />
      {label}
    </div>
  )
}

export function EmptyState({ title, message, children }) {
  return (
    <div className={styles.emptyState}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 14h32v24a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V14Z" />
        <path d="m8 14 5-7h22l5 7M19 22h10" />
      </svg>
      <strong>{title}</strong>
      {message && <p>{message}</p>}
      {children}
    </div>
  )
}
