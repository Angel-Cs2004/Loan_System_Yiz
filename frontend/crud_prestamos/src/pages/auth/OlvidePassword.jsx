import { useState } from 'react'
import { Link } from 'react-router-dom'
import { solicitarRestablecimiento } from '../../api/auth'
import { apiError } from '../../api/client'
import AuthCard, { ErrorBox, Field, SubmitButton, SuccessBox } from './AuthCard'

export default function OlvidePassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await solicitarRestablecimiento(email.trim())
      setMensaje(data?.detail || 'Si el correo está registrado, te llegará un enlace.')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace a tu correo para que elijas una contraseña nueva."
      footer={<Link to="/login">Volver a iniciar sesión</Link>}
    >
      <form onSubmit={handleSubmit}>
        <ErrorBox message={error} />
        <SuccessBox message={mensaje} />
        <Field id="email" label="Correo electrónico" icon="mail" type="email" placeholder="nombre@ejemplo.com"
          value={email} onChange={setEmail} autoComplete="email" disabled={loading} />
        <SubmitButton loading={loading}>Enviar enlace</SubmitButton>
      </form>
    </AuthCard>
  )
}
