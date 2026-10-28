import { useState } from 'react'
import { apiError } from '../../api/client'
import ui from '../../styles/components.module.css'
import Modal from './Modal'

export default function FormModal({
  title, description, size, submitLabel = 'Guardar', onSubmit, onClose, disabled = false, children,
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit()
      onClose()
    } catch (err) {
      setError(apiError(err))
      setBusy(false)
    }
  }

  return (
    <Modal title={title} description={description} size={size} onClose={busy ? () => {} : onClose}>
      <form className={ui.formGrid} onSubmit={submit}>
        {children}
        {error && <p className={`${ui.wide} ${ui.notice} ${ui.error}`} role="alert">{error}</p>}
        <div className={`${ui.wide} ${ui.actions}`}>
          <button className={ui.button} disabled={busy || disabled}>{busy ? 'Guardando…' : submitLabel}</button>
          <button type="button" className={`${ui.button} ${ui.secondary}`} onClick={onClose} disabled={busy}>
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}
