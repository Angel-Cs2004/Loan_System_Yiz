import { useState } from 'react'
import { apiError } from '../api/client'
import { cambiarPassword, updatePerfil } from '../api/auth'
import StatusBadge from '../components/ui/StatusBadge'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import ui from '../styles/components.module.css'
import { ESTADOS_USUARIO, TIPOS_USUARIO } from '../utils/format'

const PASSWORD_VACIA = { password_actual: '', password_nueva: '', confirmacion: '' }

export default function Perfil() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [datos, setDatos] = useState({ first_name: user.first_name, last_name: user.last_name })
  const [guardando, setGuardando] = useState(false)
  const [errorDatos, setErrorDatos] = useState('')
  const [password, setPassword] = useState(PASSWORD_VACIA)
  const [cambiando, setCambiando] = useState(false)
  const [errorPassword, setErrorPassword] = useState('')

  const guardarDatos = async event => {
    event.preventDefault()
    setGuardando(true)
    setErrorDatos('')
    try {
      const { data } = await updatePerfil(datos)
      setUser(data)
      toast.success('Tus datos se actualizaron.')
    } catch (err) {
      setErrorDatos(apiError(err))
    } finally {
      setGuardando(false)
    }
  }

  const guardarPassword = async event => {
    event.preventDefault()
    setErrorPassword('')
    if (password.password_nueva !== password.confirmacion) {
      setErrorPassword('La confirmación no coincide con la contraseña nueva.')
      return
    }
    setCambiando(true)
    try {
      await cambiarPassword(password.password_actual, password.password_nueva)
      setPassword(PASSWORD_VACIA)
      toast.success('Contraseña actualizada. Se cerraron tus otras sesiones.')
    } catch (err) {
      setErrorPassword(apiError(err))
    } finally {
      setCambiando(false)
    }
  }

  const campoDatos = key => event => setDatos({ ...datos, [key]: event.target.value })
  const campoPassword = key => event => setPassword({ ...password, [key]: event.target.value })

  return (
    <main className={ui.page}>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>MI CUENTA</span>
          <h2>Mi perfil</h2>
          <p>Revisa tus datos y mantén segura tu cuenta.</p>
        </div>
        <StatusBadge value={user.status} labels={ESTADOS_USUARIO} />
      </div>

      <section className={ui.panel}>
        <h3>Datos de la cuenta</h3>
        <dl className={ui.detailGrid}>
          <div><dt>Correo</dt><dd>{user.email}</dd></div>
          <div><dt>Tipo de usuario</dt><dd>{TIPOS_USUARIO[user.tipo_usuario]}</dd></div>
          <div><dt>DNI</dt><dd>{user.dni}</dd></div>
          <div><dt>CUI</dt><dd>{user.cui || '—'}</dd></div>
        </dl>
      </section>

      <section className={ui.panel}>
        <h3>Datos personales</h3>
        <form className={ui.formGrid} onSubmit={guardarDatos}>
          <label>Nombres<input value={datos.first_name} onChange={campoDatos('first_name')} required /></label>
          <label>Apellidos<input value={datos.last_name} onChange={campoDatos('last_name')} required /></label>
          <div className={`${ui.wide} ${ui.actions}`}>
            <button className={ui.button} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
          </div>
        </form>
        {errorDatos && <p className={`${ui.notice} ${ui.error}`} role="alert">{errorDatos}</p>}
      </section>

      <section className={ui.panel}>
        <h3>Cambiar contraseña</h3>
        <form className={ui.formGrid} onSubmit={guardarPassword}>
          <label className={ui.wide}>
            Contraseña actual
            <input type="password" value={password.password_actual} onChange={campoPassword('password_actual')}
              autoComplete="current-password" required />
          </label>
          <label>
            Contraseña nueva
            <input type="password" value={password.password_nueva} onChange={campoPassword('password_nueva')}
              autoComplete="new-password" required />
          </label>
          <label>
            Confirmar contraseña nueva
            <input type="password" value={password.confirmacion} onChange={campoPassword('confirmacion')}
              autoComplete="new-password" required />
          </label>
          <span className={`${ui.wide} ${ui.hint}`}>
            Al cambiarla se cierran tus sesiones abiertas en otros dispositivos.
          </span>
          <div className={`${ui.wide} ${ui.actions}`}>
            <button className={ui.button} disabled={cambiando}>{cambiando ? 'Actualizando…' : 'Actualizar contraseña'}</button>
          </div>
        </form>
        {errorPassword && <p className={`${ui.notice} ${ui.error}`} role="alert">{errorPassword}</p>}
      </section>
    </main>
  )
}
