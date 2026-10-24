import { useCallback, useEffect, useState } from 'react'
import { apiError } from '../api/client'
import { createUser, deleteUser, getUsers, updateUser } from '../api/users'
import styles from './UsersList.module.css'
import ui from '../styles/components.module.css'

const initialForm = {
  email: '', password: '', cui: '', first_name: '', last_name: '',
  tipo_usuario: 'STUDENT', status: 'ACTIVO',
}

export default function UsersList() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getUsers()
      if (!Array.isArray(data)) throw new Error('La API no devolvió una lista de usuarios.')
      setUsers(data)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId !== null) {
        const payload = { ...form }
        delete payload.password
        await updateUser(editingId, payload)
      } else {
        await createUser(form)
      }
      resetForm()
      await loadUsers()
    } catch (err) {
      setError(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (user) => {
    setEditingId(user.id)
    setForm({
      email: user.email || '', password: '', cui: user.cui || '',
      first_name: user.first_name || '', last_name: user.last_name || '',
      tipo_usuario: user.tipo_usuario || 'STUDENT', status: user.status || 'ACTIVO',
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const removeUser = async (user) => {
    const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    if (!window.confirm(`¿Eliminar a ${displayName}? Esta acción no se puede deshacer.`)) return
    setError('')
    try {
      await deleteUser(user.id)
      if (editingId === user.id) resetForm()
      await loadUsers()
    } catch (err) {
      setError(apiError(err))
    }
  }

  const visibleUsers = users.filter(user =>
    `${user.first_name || ''} ${user.last_name || ''} ${user.email || ''} ${user.cui || ''}`
      .toLowerCase().includes(search.toLowerCase()),
  )

  let submitLabel = 'Crear usuario'
  if (editingId !== null) {
    submitLabel = 'Guardar cambios'
  }
  if (saving) {
    submitLabel = 'Guardando…'
  }

  let userListContent
  if (loading) {
    userListContent = <p className={ui.empty} role="status">Cargando usuarios…</p>
  } else if (visibleUsers.length > 0) {
    userListContent = (
      <div className={ui.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>CUI</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map(user => (
              <tr key={user.id}>
                <td>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Sin nombre'}</td>
                <td>{user.email}</td>
                <td>{user.cui}</td>
                <td>{user.tipo_usuario}</td>
                <td>{user.status}</td>
                <td className={ui.nowrap}>
                  <button
                    type="button"
                    className={ui.link}
                    onClick={() => startEdit(user)}
                  >
                    Modificar
                  </button>
                  <button
                    type="button"
                    className={`${ui.link} ${ui.danger}`}
                    onClick={() => removeUser(user)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  } else {
    let emptyMessage = 'No hay usuarios registrados.'
    if (error) {
      emptyMessage = 'No se pudo cargar la lista.'
    } else if (users.length > 0) {
      emptyMessage = 'No hay coincidencias.'
    }
    userListContent = <p className={ui.empty}>{emptyMessage}</p>
  }

  return (
    <main className={ui.page}>
      <div className={ui.pageHeading}>
        <div><span className={ui.eyebrow}>CUENTAS DEL SISTEMA</span><h2>Usuarios</h2><p>Registra, modifica y elimina cuentas.</p></div>
        <span className={ui.badge}>{users.length} usuarios</span>
      </div>

      <form className={ui.panel} onSubmit={handleSubmit}>
        <h3>{editingId !== null ? 'Modificar usuario' : 'Crear usuario'}</h3>
        <div className={ui.formGrid}>
          <label>Correo electrónico<input name="email" type="email" required value={form.email} onChange={updateField} /></label>
          {editingId === null && <label>Contraseña<input name="password" type="password" required minLength="8" value={form.password} onChange={updateField} /></label>}
          <label>CUI (8 dígitos)<input name="cui" required pattern="[0-9]{8}" maxLength="8" value={form.cui} onChange={updateField} /></label>
          <label>Tipo de usuario<select name="tipo_usuario" value={form.tipo_usuario} onChange={updateField}>
            <option value="STUDENT">Estudiante</option><option value="TEACHER">Docente</option>
            <option value="ADMINISTRATIVE_STAFF">Administrativo</option><option value="ADMINISTRATOR">Administrador</option>
          </select></label>
          <label>Nombre<input name="first_name" value={form.first_name} onChange={updateField} /></label>
          <label>Apellido<input name="last_name" value={form.last_name} onChange={updateField} /></label>
          <label>Estado<select name="status" value={form.status} onChange={updateField}>
            <option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option><option value="SUSPENDIDO">Suspendido</option>
          </select></label>
        </div>
        <div className={ui.actions}>
          <button className={ui.button} disabled={saving}>{submitLabel}</button>
          {editingId !== null && <button type="button" className={`${ui.button} ${ui.secondary}`} onClick={resetForm}>Cancelar</button>}
        </div>
        {error && <p className={`${ui.notice} ${ui.error}`} role="alert">{error}</p>}
      </form>

      <section className={`${ui.panel} ${ui.tablePanel}`}>
        <div className={ui.panelHeading}><div><h3>Usuarios registrados</h3><p>Correo, CUI, nombre, tipo y estado.</p></div><button type="button" className={`${ui.button} ${ui.secondary}`} onClick={loadUsers}>Actualizar</button></div>
        <div className={styles.toolbar}><input type="search" placeholder="Buscar por nombre, correo o CUI" value={search} onChange={event => setSearch(event.target.value)} /></div>
        {userListContent}
      </section>
    </main>
  )
}
