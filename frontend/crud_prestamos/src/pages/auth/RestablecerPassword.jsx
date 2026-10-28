import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { restablecerPassword } from '../../api/auth'
import { apiError } from '../../api/client'
import AuthCard, { ErrorBox, PasswordField, SubmitButton, SuccessBox } from './AuthCard'

export default function RestablecerPassword() {
  const [params] = useSearchParams()
  const uid = params.get('uid')
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState(uid && token ? '' : 'El enlace está incompleto. Solicita uno nuevo.')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      const { data } = await restablecerPassword(uid, token, password)
      setMensaje(data?.detail || 'Contraseña actualizada.')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Nueva contraseña"
      subtitle="Elige una contraseña nueva para tu cuenta."
      footer={mensaje
        ? <Link to="/login">Ir a iniciar sesión</Link>
        : <Link to="/olvide-password">Solicitar otro enlace</Link>}
    >
      <form onSubmit={handleSubmit}>
        <ErrorBox message={error} />
        <SuccessBox message={mensaje} />
        {!mensaje && (
          <>
            <PasswordField id="password" label="Contraseña nueva" value={password} onChange={setPassword}
              autoComplete="new-password" disabled={loading || !uid || !token} hint="Mínimo 8 caracteres, no solo números." />
            <PasswordField id="confirmacion" label="Confirmar contraseña" value={confirmacion} onChange={setConfirmacion}
              autoComplete="new-password" disabled={loading || !uid || !token} />
            <SubmitButton loading={loading}>Guardar contraseña</SubmitButton>
          </>
        )}
      </form>
    </AuthCard>
  )
}
