import { useEffect } from 'react'
import styles from './ui.module.css'

export default function Modal({ title, description, size = 'md', onClose, children }) {
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className={styles.backdrop} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className={`${styles.modal} ${styles[size]}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className={styles.modalHeader}>
          <div>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className={styles.modalBody}>{children}</div>
      </section>
    </div>
  )
}
