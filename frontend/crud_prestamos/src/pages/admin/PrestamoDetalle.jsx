import { Link, useParams } from 'react-router-dom'
import { getPrestamo } from '../../api/prestamos'
import PrestamoAcciones from '../../components/admin/PrestamoAcciones'
import { EmptyState, Loading } from '../../components/ui/Feedback'
import Icon from '../../components/ui/Icon'
import StatusBadge from '../../components/ui/StatusBadge'
import { useResource } from '../../hooks/useApiList'
import ui from '../../styles/components.module.css'
import {
  ESTADOS_PRESTAMO, TIPOS_USUARIO, formatearFecha, formatearFechaHora, tiempoRestante,
} from '../../utils/format'

export default function PrestamoDetalle() {
  const { id } = useParams()
  const prestamo = useResource(getPrestamo, id)

  if (prestamo.loading) return <main className={ui.page}><Loading /></main>
  if (prestamo.error) {
    return (
      <main className={ui.page}>
        <EmptyState title="No se pudo cargar el préstamo" message={prestamo.error}>
          <Link className={ui.button} to="/admin/prestamos">Volver a préstamos</Link>
        </EmptyState>
      </main>
    )
  }

  const p = prestamo.data

  return (
    <main className={ui.page}>
      <Link className={ui.backLink} to="/admin/prestamos"><Icon name="back" size={14} /> Préstamos</Link>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>PRÉSTAMO · {p.codigo_inventario}</span>
          <h2>{p.ficha_recurso_nombre}</h2>
          <p>Solicitado el {formatearFechaHora(p.fecha_prestamo)}</p>
        </div>
        <PrestamoAcciones prestamo={p} onDone={prestamo.setData} />
      </div>

      {p.estado === 'RESERVADO' && (
        <div className={ui.alert} role="status">
          Reserva pendiente de recoger en el mostrador antes del {formatearFechaHora(p.recoger_antes_de)}
          {' '}({tiempoRestante(p.recoger_antes_de).toLowerCase()}). Si no la recoge, se cancela sola.
        </div>
      )}
      {p.estado === 'VENCIDO' && (
        <div className={ui.alert} role="status">
          El plazo venció el {formatearFecha(p.fecha_limite)}. El usuario no podrá pedir otros recursos hasta devolverlo.
        </div>
      )}

      <section className={ui.panel}>
        <h3>Estado</h3>
        <dl className={ui.detailGrid}>
          <div><dt>Estado</dt><dd><StatusBadge value={p.estado} labels={ESTADOS_PRESTAMO} /></dd></div>
          <div><dt>Entregado</dt><dd>{formatearFechaHora(p.fecha_entrega)}</dd></div>
          <div><dt>Fecha límite</dt><dd>{formatearFecha(p.fecha_limite)}</dd></div>
          <div><dt>Devuelto</dt><dd>{formatearFecha(p.fecha_devolucion)}</dd></div>
          <div><dt>Renovaciones</dt><dd>{p.renovaciones}</dd></div>
          <div><dt>Con retraso</dt><dd>{p.con_retraso ? 'Sí' : 'No'}</dd></div>
        </dl>
      </section>

      <section className={ui.panel}>
        <h3>Partes</h3>
        <dl className={ui.detailGrid}>
          <div>
            <dt>Usuario</dt>
            <dd><Link className={ui.rowLink} to={`/admin/usuarios/${p.usuario}`}>{p.usuario_email}</Link></dd>
          </div>
          <div><dt>Tipo de usuario</dt><dd>{TIPOS_USUARIO[p.tipo_usuario]}</dd></div>
          <div><dt>Ejemplar</dt><dd>{p.codigo_inventario}</dd></div>
          <div><dt>Entregado por</dt><dd>{p.registrado_por_email || '—'}</dd></div>
        </dl>
      </section>
    </main>
  )
}
