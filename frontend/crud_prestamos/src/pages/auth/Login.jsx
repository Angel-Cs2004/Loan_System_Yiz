import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { inicioDe } from '../../routes/guards'
import styles from './Auth.module.css'
import AuthCard, { ErrorBox, Field, PasswordField, SubmitButton } from './AuthCard'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      navigate(location.state?.from || inicioDe(user), { replace: true })
    } catch (err) {
      setError(err?.response?.status === 401
        ? 'Correo o contraseña incorrectos, o la cuenta no está activa.'
        : apiError(err))
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Iniciar sesión"
      subtitle="Ingresa tus credenciales para acceder a tu cuenta."
      footer={<span>¿No tienes cuenta? <Link to="/registro">Regístrate</Link></span>}
    >
      <form onSubmit={handleSubmit}>
        <ErrorBox message={error} />
        <Field
          id="email" label="Correo electrónico" icon="mail" type="email" placeholder="nombre@ejemplo.com"
          value={email} onChange={setEmail} autoComplete="username" disabled={loading}
        />
        <PasswordField
          id="password" label="Contraseña" placeholder="Ingresa tu contraseña"
          value={password} onChange={setPassword} autoComplete="current-password" disabled={loading}
        />
        <p className={styles['inline-link']}><Link to="/olvide-password">¿Olvidaste tu contraseña?</Link></p>
        <SubmitButton loading={loading} loadingLabel="Verificando...">Ingresar a mi cuenta</SubmitButton>
      </form>
    </AuthCard>
  )
}
