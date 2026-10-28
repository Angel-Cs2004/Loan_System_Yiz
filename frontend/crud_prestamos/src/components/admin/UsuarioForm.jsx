import { useEffect, useState } from 'react'
import { apiError } from '../../api/client'
import { createUsuario, getUsuario, updateUsuario } from '../../api/users'
import ui from '../../styles/components.module.css'
import { ESTADOS_USUARIO, TIPOS_USUARIO } from '../../utils/format'
import { Loading } from '../ui/Feedback'
import FormModal from '../ui/FormModal'

const VACIO = {
  email: '', first_name: '', last_name: '', dni: '', cui: '', tipo_usuario: 'STUDENT', status: 'ACTIVO', password: '',
}

export default function UsuarioForm({ usuarioId, onClose, onSaved }) {
  const [form, setForm] = useState(usuarioId ? null : VACIO)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!usuarioId) return
    getUsuario(usuarioId)
      .then(({ data }) => setForm({ ...VACIO, ...data, cui: data.cui || '', password: '' }))
      .catch(err => setError(apiError(err)))
  }, [usuarioId])

  const campo = key => event => setForm({ ...form, [key]: event.target.value })

  const guardar = async () => {
    const { id: _, password, ...datos } = form
    const payload = { ...datos, email: datos.email.trim(), cui: datos.cui || null }
    if (password) payload.password = password
    if (!usuarioId) delete payload.status
    const { data } = usuarioId ? await updateUsuario(usuarioId, payload) : await createUsuario(payload)
    onSaved(data)
  }

  return (
    <FormModal
      title={usuarioId ? 'Editar usuario' : 'Nuevo usuario'}
      size="lg"
      submitLabel={usuarioId ? 'Guardar cambios' : 'Crear usuario'}
      onSubmit={guardar}
      onClose={onClose}
      disabled={!form}
    >
      {!form ? (
        error ? <p className={`${ui.wide} ${ui.error}`}>{error}</p> : <div className={ui.wide}><Loading /></div>
      ) : (
        <>
          <label>Nombres<input value={form.first_name} onChange={campo('first_name')} required autoFocus /></label>
          <label>Apellidos<input value={form.last_name} onChange={campo('last_name')} required /></label>
          <label className={ui.wide}>Correo<input type="email" value={form.email} onChange={campo('email')} required /></label>
          <label>
            DNI
            <input value={form.dni} onChange={campo('dni')} inputMode="numeric" pattern="\d{8}" maxLength={8} title="8 dígitos" required />
          </label>
          <label>
            CUI
            <input value={form.cui} onChange={campo('cui')} inputMode="numeric" pattern="\d{8}" maxLength={8} title="8 dígitos"
              required={form.tipo_usuario === 'STUDENT'} />
            <span className={ui.hint}>Obligatorio para estudiantes.</span>
          </label>
          <label>
            Tipo de usuario
            <select value={form.tipo_usuario} onChange={campo('tipo_usuario')}>
              {Object.entries(TIPOS_USUARIO).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {usuarioId ? (
            <label>
              Estado
              <select value={form.status} onChange={campo('status')}>
                {Object.entries(ESTADOS_USUARIO).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          ) : <span />}
          <label className={ui.wide}>
            {usuarioId ? 'Contraseña nueva' : 'Contraseña'}
            <input type="password" value={form.password} onChange={campo('password')} autoComplete="new-password"
              required={!usuarioId} />
            {usuarioId && <span className={ui.hint}>Déjala vacía para no cambiarla. Si la cambias, se cierran sus sesiones.</span>}
          </label>
        </>
      )}
    </FormModal>
  )
}
