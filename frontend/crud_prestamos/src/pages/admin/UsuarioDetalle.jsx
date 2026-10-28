import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listPrestamos } from '../../api/prestamos'
import { getUsuario } from '../../api/users'
import UsuarioEstadoConfirm from '../../components/admin/UsuarioEstadoConfirm'
import UsuarioForm from '../../components/admin/UsuarioForm'
import { EmptyState, Loading } from '../../components/ui/Feedback'
import Icon from '../../components/ui/Icon'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import { usePaginatedList, useResource } from '../../hooks/useApiList'
import ui from '../../styles/components.module.css'
import {
  ESTADOS_PRESTAMO, ESTADOS_USUARIO, TIPOS_USUARIO, formatearFecha, nombreCompleto,
} from '../../utils/format'

const MENSAJES = {
  ACTIVO: 'Usuario activado.',
  SUSPENDIDO: 'Usuario suspendido.',
  INACTIVO: 'Usuario dado de baja.',
}

export default function UsuarioDetalle() {
  const { id } = useParams()
  const toast = useToast()
  const usuario = useResource(getUsuario, id)
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [editar, setEditar] = useState(false)
  const [cambio, setCambio] = useState(null)

  const fetchHistorial = useCallback(params => listPrestamos({ ...params, usuario: id }), [id])
  const historial = usePaginatedList(fetchHistorial, { estado: estadoFiltro })

  if (usuario.loading) return <main className={ui.page}><Loading /></main>
  if (usuario.error) {
    return (
      <main className={ui.page}>
        <EmptyState title="No se pudo cargar el usuario" message={usuario.error}>
          <Link className={ui.button} to="/admin/usuarios">Volver a usuarios</Link>
        </EmptyState>
      </main>
    )
  }

  const persona = usuario.data

  return (
    <main className={ui.page}>
      <Link className={ui.backLink} to="/admin/usuarios"><Icon name="back" size={14} /> Usuarios</Link>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>{TIPOS_USUARIO[persona.tipo_usuario]?.toUpperCase()}</span>
          <h2>{nombreCompleto(persona)}</h2>
          <p>{persona.email}</p>
        </div>
        <div className={ui.headingActions}>
          {persona.status === 'ACTIVO' && (
            <Link className={ui.button} to={`/admin/mostrador?usuario=${persona.id}`}>Registrar préstamo</Link>
          )}
          <button className={`${ui.button} ${ui.secondary}`} onClick={() => setEditar(true)}>Editar</button>
          {persona.status !== 'ACTIVO' && (
            <button className={ui.button} onClick={() => setCambio('ACTIVO')}>Activar</button>
          )}
          {persona.status === 'ACTIVO' && (
            <button className={`${ui.button} ${ui.ghostDanger}`} onClick={() => setCambio('SUSPENDIDO')}>Suspender</button>
          )}
          {persona.status !== 'INACTIVO' && (
            <button className={`${ui.button} ${ui.ghostDanger}`} onClick={() => setCambio('INACTIVO')}>Dar de baja</button>
          )}
        </div>
      </div>

      <section className={ui.panel}>
        <dl className={ui.detailGrid}>
          <div><dt>Estado</dt><dd><StatusBadge value={persona.status} labels={ESTADOS_USUARIO} /></dd></div>
          <div><dt>DNI</dt><dd>{persona.dni}</dd></div>
          <div><dt>CUI</dt><dd>{persona.cui || '—'}</dd></div>
          <div><dt>Tipo de usuario</dt><dd>{TIPOS_USUARIO[persona.tipo_usuario]}</dd></div>
        </dl>
      </section>

      <section className={`${ui.panel} ${ui.tablePanel}`}>
        <div className={ui.panelHeading}>
          <div>
            <h3>Préstamos</h3>
            <p>Historial completo de reservas y préstamos.</p>
          </div>
          <div className={ui.segmented}>
            {[['', 'Todos'], ['RESERVADO', 'Reservados'], ['ACTIVO', 'Activos'], ['VENCIDO', 'Vencidos'], ['DEVUELTO', 'Devueltos']]
              .map(([value, label]) => (
                <button key={value} className={estadoFiltro === value ? ui.segmentActive : ''} onClick={() => setEstadoFiltro(value)}>
                  {label}
                </button>
              ))}
          </div>
        </div>
        {historial.loading && !historial.results.length ? (
          <Loading />
        ) : historial.error ? (
          <p className={`${ui.empty} ${ui.error}`}>{historial.error}</p>
        ) : !historial.results.length ? (
          <p className={ui.empty}>No hay préstamos para mostrar.</p>
        ) : (
          <div className={ui.tableWrap}>
            <table>
              <thead>
                <tr><th>Recurso</th><th>Ejemplar</th><th>Solicitado</th><th>Límite</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {historial.results.map(prestamo => (
                  <tr key={prestamo.id}>
                    <td><Link className={ui.rowLink} to={`/admin/prestamos/${prestamo.id}`}>{prestamo.ficha_recurso_nombre}</Link></td>
                    <td>{prestamo.codigo_inventario}</td>
                    <td className={ui.nowrap}>{formatearFecha(prestamo.fecha_prestamo)}</td>
                    <td className={ui.nowrap}>{formatearFecha(prestamo.fecha_limite)}</td>
                    <td><StatusBadge value={prestamo.estado} labels={ESTADOS_PRESTAMO} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={historial.page} count={historial.count} onChange={historial.setPage} />
      </section>

      {editar && (
        <UsuarioForm
          usuarioId={persona.id}
          onClose={() => setEditar(false)}
          onSaved={data => {
            toast.success('Usuario actualizado.')
            usuario.setData(data)
          }}
        />
      )}
      {cambio && (
        <UsuarioEstadoConfirm
          usuario={persona}
          estado={cambio}
          onClose={() => setCambio(null)}
          onDone={estado => {
            toast.success(MENSAJES[estado])
            usuario.reload()
            historial.reload()
          }}
        />
      )}
    </main>
  )
}
