import { useState } from 'react'
import { apiError } from '../../api/client'
import ui from '../../styles/components.module.css'
import Modal from './Modal'
import styles from './ui.module.css'

export default function ConfirmDialog({
  title, message, confirmLabel = 'Confirmar', danger = false, onConfirm, onClose, children,
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const confirm = async () => {
    setBusy(true)
    setError('')
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(apiError(err))
      setBusy(false)
    }
  }

  return (
    <Modal title={title} size="sm" onClose={busy ? () => {} : onClose}>
      <p className={styles.confirmText}>{message}</p>
      {children}
      {error && <p className={`${ui.notice} ${ui.error}`} role="alert">{error}</p>}
      <div className={ui.actions}>
        <button className={`${ui.button} ${danger ? ui.dangerButton : ''}`} onClick={confirm} disabled={busy}>
          {busy ? 'Procesando…' : confirmLabel}
        </button>
        <button className={`${ui.button} ${ui.secondary}`} onClick={onClose} disabled={busy}>Volver</button>
      </div>
    </Modal>
  )
}
