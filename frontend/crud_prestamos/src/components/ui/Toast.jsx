import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import styles from './ui.module.css'

const ToastContext = createContext(null)

const CLASES = { success: styles.toastSuccess, error: styles.toastError, info: '' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback(id => setToasts(actuales => actuales.filter(toast => toast.id !== id)), [])

  const show = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID()
    setToasts(actuales => [...actuales, { id, message, type }])
    window.setTimeout(() => dismiss(id), 4500)
  }, [dismiss])

  const value = useMemo(() => ({
    success: message => show(message, 'success'),
    error: message => show(message, 'error'),
    info: message => show(message, 'info'),
  }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toasts} aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className={`${styles.toast} ${CLASES[toast.type]}`} role="status">
            <p>{toast.message}</p>
            <button className={styles.close} onClick={() => dismiss(toast.id)} aria-label="Cerrar aviso">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
