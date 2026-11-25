import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { listUsuarios } from '../../api/users'
import UsuarioEstadoConfirm from '../../components/admin/UsuarioEstadoConfirm'
import UsuarioForm from '../../components/admin/UsuarioForm'
import SuspensionForm from '../../components/admin/SuspensionForm'
import { estaSancionado } from '../../utils/sanciones'
import { EmptyState, Loading } from '../../components/ui/Feedback'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import { useDebounced, usePaginatedList } from '../../hooks/useApiList'
import ui from '../../styles/components.module.css'
import { ESTADOS_USUARIO, TIPOS_USUARIO, formatearFecha, nombreCompleto } from '../../utils/format'

export default function Usuarios() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('')
  const [status, setStatus] = useState('')
  const [sancionado, setSancionado] = useState(params.get('sancionado') || '')
  const [suspension, setSuspension] = useState(null)
  const [form, setForm] = useState(null)
  const [baja, setBaja] = useState(null)
  const busqueda = useDebounced(q)
  const lista = usePaginatedList(listUsuarios, { q: busqueda.trim(), tipo_usuario: tipo, status, sancionado })

  return (
    <main className={ui.page}>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>PERSONAS</span>
          <h2>Usuarios</h2>
          <p>Estudiantes, docentes, personal y administradores del sistema.</p>
        </div>
        <button className={ui.button} onClick={() => setForm({})}>+ Nuevo usuario</button>
      </div>

      <section className={`${ui.panel} ${ui.tablePanel}`}>
        <div className={ui.toolbar}>
          <label className={`${ui.filter} ${ui.grow}`}>
            Buscar
            <input type="search" value={q} onChange={event => setQ(event.target.value)}
              placeholder="DNI o CUI exacto, nombre, apellido o correo" />
          </label>
          <label className={ui.filter}>
            Tipo
            <select value={tipo} onChange={event => setTipo(event.target.value)}>
              <option value="">Todos</option>
              {Object.entries(TIPOS_USUARIO).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className={ui.filter}>
            Estado
            <select value={status} onChange={event => setStatus(event.target.value)}>
              <option value="">Todos</option>
              {Object.entries(ESTADOS_USUARIO).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className={ui.filter}>
            Sanción por préstamo
            <select value={sancionado} onChange={event => setSancionado(event.target.value)}>
              <option value="">Todos</option>
              <option value="si">Sancionados</option>
              <option value="no">Sin sanción vigente</option>
            </select>
          </label>
        </div>

        {lista.loading && !lista.results.length ? (
          <Loading />
        ) : lista.error ? (
          <p className={`${ui.empty} ${ui.error}`}>{lista.error}</p>
        ) : !lista.results.length ? (
          <EmptyState title="No se encontraron usuarios" message="Prueba con otro término o quita los filtros." />
        ) : (
          <div className={ui.tableWrap}>
            <table>
              <thead>
                <tr><th>Usuario</th><th>DNI</th><th>CUI</th><th>Tipo</th><th>Estado de cuenta</th><th>Sanción</th><th /></tr>
              </thead>
              <tbody>
                {lista.results.map(usuario => (
                  <tr key={usuario.id}>
                    <td>
                      <Link className={ui.rowLink} to={`/admin/usuarios/${usuario.id}`}>{nombreCompleto(usuario)}</Link>
                      <span className={ui.cellSecondary}>{usuario.email}</span>
                    </td>
                    <td>{usuario.dni}</td>
                    <td>{usuario.cui || '—'}</td>
                    <td>{TIPOS_USUARIO[usuario.tipo_usuario]}</td>
                    <td><StatusBadge value={usuario.status} labels={ESTADOS_USUARIO} /></td>
                    <td>{estaSancionado(usuario) ? <><StatusBadge value="SUSPENDIDO" labels={{ SUSPENDIDO: 'Sancionado' }} /><span className={ui.cellSecondary}>Hasta {formatearFecha(usuario.suspendido_hasta)}</span></> : 'Sin sanción'}</td>
                    <td>
                      <div className={ui.rowActions}>
                        <button className={ui.link} onClick={() => setForm({ id: usuario.id })}>Editar</button>
                        <button className={ui.link} onClick={() => setSuspension(usuario)}>Sanción</button>
                        {usuario.status !== 'INACTIVO' && (
                          <button className={`${ui.link} ${ui.danger}`} onClick={() => setBaja(usuario)}>Dar de baja</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={lista.page} count={lista.count} onChange={lista.setPage} />
      </section>

      {form && (
        <UsuarioForm
          usuarioId={form.id}
          onClose={() => setForm(null)}
          onSaved={data => {
            if (form.id) {
              toast.success('Usuario actualizado.')
              lista.reload()
            } else {
              toast.success('Usuario creado.')
              navigate(`/admin/usuarios/${data.id}`)
            }
          }}
        />
      )}
      {suspension && (
        <SuspensionForm usuario={suspension} onClose={() => setSuspension(null)}
          onSaved={() => { toast.success('Sanción actualizada.'); lista.reload() }} />
      )}
      {baja && (
        <UsuarioEstadoConfirm
          usuario={baja}
          estado="INACTIVO"
          onClose={() => setBaja(null)}
          onDone={() => {
            toast.success('Usuario dado de baja.')
            lista.reload()
          }}
        />
      )}
    </main>
  )
}
