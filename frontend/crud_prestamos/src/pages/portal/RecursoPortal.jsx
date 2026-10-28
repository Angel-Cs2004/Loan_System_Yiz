import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiError } from '../../api/client'
import { getRecurso } from '../../api/catalogo'
import { reservar } from '../../api/prestamos'
import { EmptyState, Loading } from '../../components/ui/Feedback'
import Icon from '../../components/ui/Icon'
import StatusBadge from '../../components/ui/StatusBadge'
import { useResource } from '../../hooks/useApiList'
import ui from '../../styles/components.module.css'
import { DISPONIBILIDAD, formatearFechaHora } from '../../utils/format'
import styles from './RecursoPortal.module.css'

export default function RecursoPortal() {
  const { id } = useParams()
  const recurso = useResource(getRecurso, id)
  const [reserva, setReserva] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const hacerReserva = async () => {
    setEnviando(true)
    setError('')
    try {
      const { data } = await reservar(id)
      setReserva(data)
      recurso.reload()
    } catch (err) {
      setError(apiError(err))
    } finally {
      setEnviando(false)
    }
  }

  if (recurso.loading) return <main className={ui.page}><Loading /></main>
  if (recurso.error) {
    return (
      <main className={ui.page}>
        <EmptyState title="Recurso no disponible" message="Puede que ya no esté en el catálogo.">
          <Link className={ui.button} to="/catalogo">Volver al catálogo</Link>
        </EmptyState>
      </main>
    )
  }

  const ficha = recurso.data
  const disponible = ficha.disponibles > 0

  return (
    <main className={ui.page}>
      <Link className={ui.backLink} to="/catalogo"><Icon name="back" size={14} /> Catálogo</Link>

      <section className={styles.layout}>
        <div className={styles.media} aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <path d="M9 10.5A3.5 3.5 0 0 1 12.5 7h23a3.5 3.5 0 0 1 3.5 3.5v27a3.5 3.5 0 0 1-3.5 3.5h-23A3.5 3.5 0 0 1 9 37.5v-27Z" />
            <path d="m13 33 8-9 5 5 4-4 6 7M17 16.5h.01" />
          </svg>
        </div>

        <div className={styles.info}>
          <span className={ui.eyebrow}>{(ficha.categoria_nombre || 'SIN CATEGORÍA').toUpperCase()}</span>
          <h2>{ficha.nombre}</h2>
          <StatusBadge value={ficha.disponibilidad} labels={DISPONIBILIDAD} />
          <p className={styles.description}>{ficha.descripcion || 'Este recurso no tiene descripción.'}</p>

          <dl className={ui.detailGrid}>
            <div><dt>Unidades libres</dt><dd>{ficha.disponibles}</dd></div>
            <div><dt>Unidades en total</dt><dd>{ficha.total_ejemplares}</dd></div>
          </dl>

          {reserva ? (
            <div className={styles.success} role="status">
              <strong>¡Reserva registrada!</strong>
              <p>
                Te apartamos el ejemplar <b>{reserva.codigo_inventario}</b>. Recógelo en el mostrador antes del
                {' '}<b>{formatearFechaHora(reserva.recoger_antes_de)}</b>; si no, la reserva se cancela sola.
              </p>
              <Link className={ui.button} to="/mis-prestamos">Ver mis préstamos</Link>
            </div>
          ) : (
            <div className={styles.reserve}>
              <button className={ui.button} disabled={!disponible || enviando} onClick={hacerReserva}>
                {enviando ? 'Reservando…' : disponible ? 'Reservar' : 'Sin unidades libres'}
              </button>
              <span className={ui.hint}>Tendrás 24 horas para recogerlo. Los días del préstamo empiezan al recogerlo.</span>
            </div>
          )}
          {error && <p className={`${ui.notice} ${ui.error}`} role="alert">{error}</p>}
        </div>
      </section>
    </main>
  )
}
