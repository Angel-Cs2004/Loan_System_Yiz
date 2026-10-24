import { useCallback, useEffect, useState } from 'react'
import { apiError } from '../api/client'
import { getPolicies, updatePolicy } from '../api/loans'
import ui from '../styles/components.module.css'

export default function Policies() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ tipo_usuario: '', dias_maximo_prestamo: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    setError('')
    try {
      const { data } = await getPolicies()
      setItems(data)
    } catch (e) {
      setError(apiError(e))
    }
  }, [])
  useEffect(() => { load() }, [load])
  const edit = item => {
    setEditing(item.id)
    setForm({ tipo_usuario: item.tipo_usuario, dias_maximo_prestamo: item.dias_maximo_prestamo })
    setError('')
  }
  const save = async event => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await updatePolicy(editing, { ...form, dias_maximo_prestamo: Number(form.dias_maximo_prestamo) })
      setEditing(null)
      await load()
    } catch (err) {
      setError(apiError(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className={ui.page}>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>REGLAS DE PRÉSTAMO</span>
          <h2>Políticas</h2>
          <p>Configura la duración máxima por tipo de usuario.</p>
        </div>
        <span className={ui.badge}>{items.length} políticas</span>
      </div>

      <section className={`${ui.panel} ${ui.tablePanel}`}>
        <div className={ui.panelHeading}>
          <div><h3>Políticas configuradas</h3></div>
          <button
            className={`${ui.button} ${ui.secondary}`}
            onClick={load}
          >
            Actualizar
          </button>
        </div>
        {error && <p className={`${ui.notice} ${ui.error}`} role="alert">{error}</p>}
        {items.length ? (
          <div className={ui.tableWrap}>
            <table>
              <thead>
                <tr><th>Tipo de usuario</th><th>Días máximos</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.tipo_usuario}</td>
                    <td>{item.dias_maximo_prestamo} días</td>
                    <td className={ui.nowrap}>
                      <button className={ui.link} onClick={() => edit(item)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !error && (
          <p className={ui.empty}>No hay políticas para mostrar.</p>
        )}
      </section>

      {editing && (
        <form className={ui.panel} onSubmit={save}>
          <h3>Editar política</h3>
          <div className={ui.formGrid}>
            <label>
              Tipo de usuario
              <select
                required
                value={form.tipo_usuario}
                onChange={event => setForm({ ...form, tipo_usuario: event.target.value })}
              >
                <option value="TEACHER">Profesor</option>
                <option value="STUDENT">Estudiante</option>
                <option value="ADMINISTRATIVE_STAFF">Personal administrativo</option>
                <option value="ADMINISTRATOR">Administrador</option>
              </select>
            </label>
            <label>
              Días máximos
              <input
                required
                min="1"
                type="number"
                value={form.dias_maximo_prestamo}
                onChange={event => setForm({
                  ...form,
                  dias_maximo_prestamo: event.target.value,
                })}
              />
            </label>
          </div>
          <div className={ui.actions}>
            <button className={ui.button} disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              className={`${ui.button} ${ui.secondary}`}
              onClick={() => setEditing(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </main>
  )
}
