import { useState } from 'react'
import styles from './Auth.module.css'

const ICONOS = {
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  id: <><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="11" r="2" /><path d="M6 16a3 3 0 0 1 6 0M14 10h4M14 14h3" /></>,
}

function InputIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      {ICONOS[name]}
    </svg>
  )
}

export default function AuthCard({ title, subtitle, wide = false, children, footer }) {
  return (
    <main className={styles['login-page']}>
      <div className={`${styles['login-decoration']} ${styles['decoration-one']}`} />
      <div className={`${styles['login-decoration']} ${styles['decoration-two']}`} />

      <section className={`${styles['login-card']} ${wide ? styles['login-card-wide'] : ''}`}>
        <div className={styles['login-brand']}>
          <span className={styles['brand-mark']}>LS</span>
          <span className={styles['brand-text']}>LOAN SYSTEM</span>
        </div>
        <div className={styles['login-heading']}>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {children}

        <div className={styles['login-divider']}>
          <span />
          <span className={styles['divider-text']}>ACCESO SEGURO</span>
          <span />
        </div>

        <p className={styles['login-security']}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Tus credenciales se procesan de forma segura.
        </p>
        {footer && <div className={styles['auth-footer']}>{footer}</div>}
      </section>
    </main>
  )
}

export function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div className={styles['login-error']} role="alert">
      <span className={styles['error-icon']}>!</span>
      <span>{message}</span>
    </div>
  )
}

export function SuccessBox({ message }) {
  if (!message) return null
  return (
    <div className={styles['login-success']} role="status">
      <span className={styles['success-icon']}>✓</span>
      <span>{message}</span>
    </div>
  )
}

export function Field({ id, label, icon, value, onChange, hint, required = true, ...props }) {
  return (
    <div className={styles['form-group']}>
      <label htmlFor={id}>{label}</label>
      <div className={styles['input-wrapper']}>
        {icon && <InputIcon name={icon} />}
        <input id={id} value={value} onChange={event => onChange(event.target.value)} required={required} {...props} />
      </div>
      {hint && <small className={styles['field-hint']}>{hint}</small>}
    </div>
  )
}

export function PasswordField({ id, label, value, onChange, hint, ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={styles['form-group']}>
      <label htmlFor={id}>{label}</label>
      <div className={styles['input-wrapper']}>
        <InputIcon name="lock" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={event => onChange(event.target.value)}
          required
          {...props}
        />
        <button
          type="button"
          className={styles['toggle-password']}
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9 7-.2 1.1-1 2.3-2.1 3.4M6.2 6.2C4.1 7.6 2.5 9.7 2 12c.5 2.5 4 7 10 7 1.4 0 2.7-.3 3.8-.8" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {hint && <small className={styles['field-hint']}>{hint}</small>}
    </div>
  )
}

export function SubmitButton({ loading, loadingLabel = 'Enviando...', children }) {
  return (
    <button className={styles['login-button']} type="submit" disabled={loading}>
      {loading ? (
        <><span className={styles['login-spinner']} /> {loadingLabel}</>
      ) : (
        <>
          {children}
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </>
      )}
    </button>
  )
}
