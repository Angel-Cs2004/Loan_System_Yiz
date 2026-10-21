
import React, { useState } from 'react'
import { login } from '../api/auth'

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
    <main className="login-page">
      <div className="login-decoration decoration-one" />
      <div className="login-decoration decoration-two" />

      <section className="login-card">
        <div className="login-brand">
          


        </div>

        <div className="login-heading">

          <h1>Iniciar sesión</h1>
          <p>Ingresa tus credenciales para acceder a tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="login-error" role="alert">
              <span className="error-icon">!</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>

            <div className="input-wrapper">
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

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>

            <div className="input-wrapper">
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
                className="toggle-password"
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
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner" />
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

        <div className="login-divider">
          <span />
          <span className="divider-text">ACCESO SEGURO</span>
          <span />
        </div>

        <p className="login-security">
          <svg viewBox="0 0 24 24" width="16" height="16"
            fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Tus credenciales se procesan de forma segura.
        </p>
      </section>

      <footer className="login-footer">
        
      </footer>

      <style>{`
        .login-page,
        .login-page * {
          box-sizing: border-box;
        }

        .login-page {
          position: relative;
          isolation: isolate;
          display: flex;
          min-height: 100vh;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 40px 20px 80px;
          background:
            radial-gradient(ellipse at 10% 10%, #dbeafe 0%, transparent 40%),
            radial-gradient(ellipse at 90% 90%, #dbeafe 0%, transparent 38%),
            #f7faff;
          color: #172554;
          font-family: Inter, Arial, sans-serif;
        }

        .login-decoration {
          position: absolute;
          z-index: -1;
          border: 1px solid rgba(59, 130, 246, .12);
          border-radius: 50%;
          pointer-events: none;
        }

        .decoration-one {
          width: 420px;
          height: 420px;
          top: -230px;
          right: -120px;
        }

        .decoration-two {
          width: 340px;
          height: 340px;
          bottom: -190px;
          left: -100px;
        }

        .login-card {
          width: 100%;
          max-width: 460px;
          padding: 38px 40px;
          border: 1px solid #e4ecfa;
          border-radius: 24px;
          background: rgba(255, 255, 255, .96);
          box-shadow:
            0 25px 70px rgba(30, 64, 175, .09),
            0 4px 12px rgba(30, 64, 175, .03);
          animation: login-appear .45s ease-out;
        }

        .login-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          margin-bottom: 34px;
        }

        .brand-icon {
          display: flex;
          width: 48px;
          height: 48px;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          box-shadow: 0 7px 16px rgba(37, 99, 235, .22);
        }

        .brand-name {
          color: #153775;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .brand-name span {
          color: #3b82f6;
        }

        .login-heading {
          margin-bottom: 30px;
          text-align: center;
        }

        .login-eyebrow {
          color: #2563eb;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .login-heading h1 {
          margin: 12px 0 10px;
          color: #142e5d;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -.8px;
        }

        .login-heading p {
          max-width: 310px;
          margin: 0 auto;
          color: #718096;
          font-size: 13px;
          line-height: 1.7;
        }

        .form-group {
          margin-bottom: 22px;
        }

        .form-group label {
          display: block;
          margin-bottom: 9px;
          color: #263c60;
          font-size: 13px;
          font-weight: 700;
        }

        .input-wrapper {
          display: flex;
          min-height: 54px;
          align-items: center;
          gap: 12px;
          padding: 0 15px;
          border: 1px solid #dce5f3;
          border-radius: 12px;
          background: #fbfdff;
          color: #7290bd;
          transition: border-color .2s, box-shadow .2s, background .2s;
        }

        .input-wrapper:focus-within {
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, .10);
        }

        .input-wrapper input {
          width: 100%;
          min-width: 0;
          height: 50px;
          padding: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #172554;
          font-family: inherit;
          font-size: 13px;
        }

        .input-wrapper input::placeholder {
          color: #a0aec0;
        }

        .input-wrapper input:disabled {
          opacity: .65;
        }

        .toggle-password {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          padding: 5px;
          border: 0;
          background: transparent;
          color: #7290bd;
          cursor: pointer;
        }

        .toggle-password:hover {
          color: #2563eb;
        }

        .login-button {
          display: flex;
          width: 100%;
          min-height: 54px;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 28px;
          padding: 14px 18px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(110deg, #2563eb, #1d4ed8);
          box-shadow: 0 8px 18px rgba(37, 99, 235, .22);
          color: white;
          font-family: inherit;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
          transition: transform .2s, box-shadow .2s, opacity .2s;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(37, 99, 235, .28);
        }

        .login-button:disabled {
          cursor: wait;
          opacity: .8;
        }

        .login-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, .4);
          border-top-color: white;
          border-radius: 50%;
          animation: login-spin .7s linear infinite;
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 22px;
          padding: 12px 14px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          background: #fff5f5;
          color: #b91c1c;
          font-size: 12px;
          line-height: 1.5;
        }

        .error-icon {
          display: flex;
          width: 21px;
          height: 21px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #fee2e2;
          font-weight: 800;
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 29px;
        }

        .login-divider > span:first-child,
        .login-divider > span:last-child {
          height: 1px;
          flex: 1;
          background: #e9eff8;
        }

        .divider-text {
          color: #94a3b8;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
          white-space: nowrap;
        }

        .login-security {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin: 19px 0 0;
          color: #8292aa;
          font-size: 11px;
          text-align: center;
        }

        .login-security svg {
          flex-shrink: 0;
          color: #3b82f6;
        }

        .login-footer {
          position: absolute;
          right: 20px;
          bottom: 22px;
          left: 20px;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px 16px;
          color: #94a3b8;
          font-size: 10px;
          text-align: center;
        }

        .login-footer span:first-child {
          color: #5b7eb6;
          font-weight: 800;
          letter-spacing: 1px;
        }

        @keyframes login-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes login-appear {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 520px) {
          .login-page {
            padding: 25px 15px 80px;
          }

          .login-card {
            padding: 30px 23px;
            border-radius: 20px;
          }

          .login-heading h1 {
            font-size: 27px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-card {
            animation: none;
          }

          .login-spinner {
            animation: none;
          }

          .login-button,
          .input-wrapper {
            transition: none;
          }
        }
      `}</style>
    </main>
  )
}
