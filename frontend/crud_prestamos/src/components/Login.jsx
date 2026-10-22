
import React, { useState } from 'react'
import { login } from '../api/auth'
import styles from './Login.module.css'

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email.trim(), password)
      onLoginSuccess()
    } catch (err) {
      console.error('Error al iniciar sesión:', err)
      setError(err?.response?.data?.detail || 'Correo o contraseña incorrectos. Verifica tus datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles['login-page']}>
      <div className={`${styles['login-decoration']} ${styles['decoration-one']}`} />
      <div className={`${styles['login-decoration']} ${styles['decoration-two']}`} />

      <section className={styles['login-card']}>
        <div className={styles['login-brand']}>
          


        </div>

        <div className={styles['login-heading']}>

          <h1>Iniciar sesión</h1>
          <p>Ingresa tus credenciales para acceder a tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className={styles['login-error']} role="alert">
              <span className={styles['error-icon']}>!</span>
              <span>{error}</span>
            </div>
          )}

          <div className={styles['form-group']}>
            <label htmlFor="email">Correo electrónico</label>

            <div className={styles['input-wrapper']}>
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m4 7 8 6 8-6" />
              </svg>

              <input
                id="email"
                type="email"
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="password">Contraseña</label>

            <div className={styles['input-wrapper']}>
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="11" rx="3" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />

              <button
                type="button"
                className={styles['toggle-password']}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20"
                    fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9 7-.2 1.1-1 2.3-2.1 3.4M6.2 6.2C4.1 7.6 2.5 9.7 2 12c.5 2.5 4 7 10 7 1.4 0 2.7-.3 3.8-.8" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20"
                    fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            className={styles['login-button']}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles['login-spinner']} />
                Verificando...
              </>
            ) : (
              <>
                Ingresar a mi cuenta
                <svg viewBox="0 0 24 24" width="19" height="19"
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className={styles['login-divider']}>
          <span />
          <span className={styles['divider-text']}>ACCESO SEGURO</span>
          <span />
        </div>

        <p className={styles['login-security']}>
          <svg viewBox="0 0 24 24" width="16" height="16"
            fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Tus credenciales se procesan de forma segura.
        </p>
      </section>

      <footer>
        
      </footer>


    </main>
  )
}
