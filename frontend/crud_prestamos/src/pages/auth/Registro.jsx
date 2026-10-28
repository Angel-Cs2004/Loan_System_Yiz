import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registrar } from '../../api/auth'
import { apiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { inicioDe } from '../../routes/guards'
import styles from './Auth.module.css'
import AuthCard, { ErrorBox, Field, PasswordField, SubmitButton } from './AuthCard'

const VACIO = { first_name: '', last_name: '', dni: '', cui: '', email: '', password: '', confirmacion: '' }

export default function Registro() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const campo = key => value => setForm({ ...form, [key]: value })

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    const { confirmacion: _, ...datos } = form
    try {
      await registrar({ ...datos, email: datos.email.trim() })
      const user = await login(datos.email.trim(), datos.password)
      navigate(inicioDe(user), { replace: true })
    } catch (err) {
      setError(apiError(err))
      setLoading(false)
    }
  }

  return (
    <AuthCard
      wide
      title="Crear cuenta"
      subtitle="Regístrate como estudiante para reservar recursos del catálogo."
      footer={<span>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></span>}
    >
      <form onSubmit={handleSubmit}>
        <ErrorBox message={error} />
        <div className={styles['form-row']}>
          <Field id="first_name" label="Nombres" icon="user" value={form.first_name}
            onChange={campo('first_name')} autoComplete="given-name" disabled={loading} />
          <Field id="last_name" label="Apellidos" icon="user" value={form.last_name}
            onChange={campo('last_name')} autoComplete="family-name" disabled={loading} />
          <Field id="dni" label="DNI" icon="id" value={form.dni} onChange={campo('dni')}
            inputMode="numeric" pattern="\d{8}" maxLength={8} title="8 dígitos" placeholder="8 dígitos" disabled={loading} />
          <Field id="cui" label="CUI" icon="id" value={form.cui} onChange={campo('cui')}
            inputMode="numeric" pattern="\d{8}" maxLength={8} title="8 dígitos" placeholder="8 dígitos" disabled={loading} />
        </div>
        <Field id="email" label="Correo electrónico" icon="mail" type="email" placeholder="nombre@unsa.edu.pe"
          value={form.email} onChange={campo('email')} autoComplete="email" disabled={loading} />
        <div className={styles['form-row']}>
          <PasswordField id="password" label="Contraseña" value={form.password} onChange={campo('password')}
            autoComplete="new-password" disabled={loading} hint="Mínimo 8 caracteres, no solo números." />
          <PasswordField id="confirmacion" label="Confirmar contraseña" value={form.confirmacion}
            onChange={campo('confirmacion')} autoComplete="new-password" disabled={loading} />
        </div>
        <SubmitButton loading={loading} loadingLabel="Creando cuenta...">Crear mi cuenta</SubmitButton>
      </form>
    </AuthCard>
  )
}
