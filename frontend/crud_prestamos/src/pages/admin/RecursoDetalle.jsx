import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiError } from '../../api/client'
import { deleteEjemplar, getRecursoAdmin, listEjemplares } from '../../api/catalogo'
import { listPrestamos } from '../../api/prestamos'
import EjemplarForm from '../../components/admin/EjemplarForm'
import RecursoConfirm from '../../components/admin/RecursoConfirm'
import RecursoForm from '../../components/admin/RecursoForm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { EmptyState, Loading } from '../../components/ui/Feedback'
import Icon from '../../components/ui/Icon'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import { usePaginatedList, useResource } from '../../hooks/useApiList'
import ui from '../../styles/components.module.css'
import {
  CONDICIONES, DISPONIBILIDAD, ESTADOS_EJEMPLAR, ESTADOS_FICHA, ESTADOS_PRESTAMO, formatearFecha,
} from '../../utils/format'

export default function RecursoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const recurso = useResource(getRecursoAdmin, id)
  const [ejemplares, setEjemplares] = useState([])
  const [errorEjemplares, setErrorEjemplares] = useState('')
  const [editar, setEditar] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [ejemplarForm, setEjemplarForm] = useState(null)
  const [borrarEjemplar, setBorrarEjemplar] = useState(null)

  const filtroHistorial = useCallback(params => listPrestamos({ ...params, ficha_recurso: id }), [id])
  const historial = usePaginatedList(filtroHistorial)

  const cargarEjemplares = useCallback(async () => {
    try {
      setEjemplares(await listEjemplares(id))
      setErrorEjemplares('')
    } catch (err) {
      setErrorEjemplares(apiError(err))
    }
  }, [id])

  useEffect(() => { cargarEjemplares() }, [cargarEjemplares])

  const refrescar = () => {
    recurso.reload()
    cargarEjemplares()
  }

  if (recurso.loading) return <main className={ui.page}><Loading /></main>
  if (recurso.error) {
    return (
      <main className={ui.page}>
        <EmptyState title="No se pudo cargar el recurso" message={recurso.error}>
          <Link className={ui.button} to="/admin/recursos">Volver a recursos</Link>
        </EmptyState>
      </main>
    )
  }

  const ficha = recurso.data
  const activa = ficha.estado_ficha === 'ACTIVA'

  return (
    <main className={ui.page}>
      <Link className={ui.backLink} to="/admin/recursos"><Icon name="back" size={14} /> Recursos</Link>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>{(ficha.categoria_nombre || 'SIN CATEGORÍA').toUpperCase()}</span>
          <h2>{ficha.nombre}</h2>
          <p>{ficha.descripcion || 'Sin descripción.'}</p>
        </div>
        <div className={ui.headingActions}>
          <button className={`${ui.button} ${ui.secondary}`} onClick={() => setEditar(true)}>Editar</button>
          {activa ? (
            <button className={`${ui.button} ${ui.ghostDanger}`} onClick={() => setConfirm('baja')}>Dar de baja</button>
          ) : (
            <button className={ui.button} onClick={() => setConfirm('reactivar')}>Reactivar</button>
          )}
          <button className={`${ui.button} ${ui.ghostDanger}`} onClick={() => setConfirm('eliminar')}>Eliminar</button>
        </div>
      </div>

      <section className={ui.panel}>
        <dl className={ui.detailGrid}>
          <div><dt>Estado</dt><dd><StatusBadge value={ficha.estado_ficha} labels={ESTADOS_FICHA} /></dd></div>
          <div><dt>Disponibilidad</dt><dd><StatusBadge value={ficha.disponibilidad} labels={DISPONIBILIDAD} /></dd></div>
          <div><dt>Ejemplares activos</dt><dd>{ficha.total_ejemplares}</dd></div>
          <div><dt>Libres para préstamo</dt><dd>{ficha.disponibles}</dd></div>
        </dl>
      </section>

      <section className={`${ui.panel} ${ui.tablePanel}`}>
        <div className={ui.panelHeading}>
          <div>
            <h3>Ejemplares físicos</h3>
            <p>{activa ? 'Unidades con etiqueta de inventario.' : 'El recurso está dado de baja: no se pueden agregar ejemplares.'}</p>
          </div>
          <button className={ui.button} disabled={!activa} onClick={() => setEjemplarForm({})}>+ Nuevo ejemplar</button>
        </div>
        {errorEjemplares ? (
          <p className={`${ui.empty} ${ui.error}`}>{errorEjemplares}</p>
        ) : !ejemplares.length ? (
          <EmptyState title="Sin ejemplares" message="Registra la primera unidad física para que se pueda prestar." />
        ) : (
          <div className={ui.tableWrap}>
            <table>
              <thead>
                <tr><th>Código</th><th>Estado</th><th>Condición</th><th>Observaciones</th><th /></tr>
              </thead>
              <tbody>
                {ejemplares.map(ejemplar => (
                  <tr key={ejemplar.id}>
                    <td><strong>{ejemplar.codigo_inventario}</strong></td>
                    <td><StatusBadge value={ejemplar.estado} labels={ESTADOS_EJEMPLAR} /></td>
                    <td><StatusBadge value={ejemplar.condicion} labels={CONDICIONES} /></td>
                    <td><span className={ui.cellSecondary}>{ejemplar.observaciones || '—'}</span></td>
                    <td>
                      <div className={ui.rowActions}>
                        <button className={ui.link} onClick={() => setEjemplarForm({ id: ejemplar.id })}>Editar</button>
                        <button className={`${ui.link} ${ui.danger}`} onClick={() => setBorrarEjemplar(ejemplar)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={`${ui.panel} ${ui.tablePanel}`}>
        <div className={ui.panelHeading}>
          <div>
            <h3>Historial de préstamos</h3>
            <p>Todos los préstamos y reservas de este recurso.</p>
          </div>
        </div>
        {historial.loading && !historial.results.length ? (
          <Loading />
        ) : historial.error ? (
          <p className={`${ui.empty} ${ui.error}`}>{historial.error}</p>
        ) : !historial.results.length ? (
          <p className={ui.empty}>Este recurso todavía no se ha prestado.</p>
        ) : (
          <div className={ui.tableWrap}>
            <table>
              <thead>
                <tr><th>Usuario</th><th>Ejemplar</th><th>Solicitado</th><th>Límite</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {historial.results.map(prestamo => (
                  <tr key={prestamo.id}>
                    <td><Link className={ui.rowLink} to={`/admin/prestamos/${prestamo.id}`}>{prestamo.usuario_email}</Link></td>
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
        <RecursoForm
          recurso={ficha}
          onClose={() => setEditar(false)}
          onSaved={() => {
            toast.success('Recurso actualizado.')
            recurso.reload()
          }}
        />
      )}
      {confirm && (
        <RecursoConfirm
          accion={confirm}
          recurso={ficha}
          onClose={() => setConfirm(null)}
          onDone={accion => {
            if (accion === 'eliminar') {
              toast.success('Recurso eliminado.')
              navigate('/admin/recursos', { replace: true })
              return
            }
            toast.success(accion === 'baja' ? 'Recurso dado de baja.' : 'Recurso reactivado.')
            refrescar()
          }}
        />
      )}
      {ejemplarForm && (
        <EjemplarForm
          fichaId={id}
          ejemplarId={ejemplarForm.id}
          onClose={() => setEjemplarForm(null)}
          onSaved={() => {
            toast.success(ejemplarForm.id ? 'Ejemplar actualizado.' : 'Ejemplar registrado.')
            refrescar()
          }}
        />
      )}
      {borrarEjemplar && (
        <ConfirmDialog
          title="Eliminar ejemplar"
          message={`Se borrará el ejemplar ${borrarEjemplar.codigo_inventario}. Solo es posible si nunca se prestó; si tiene historial, cámbialo a “Dado de baja”.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={async () => {
            await deleteEjemplar(borrarEjemplar.id)
            toast.success('Ejemplar eliminado.')
            refrescar()
          }}
          onClose={() => setBorrarEjemplar(null)}
        />
      )}
    </main>
  )
}
