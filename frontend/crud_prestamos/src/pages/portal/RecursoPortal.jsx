import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiError } from '../../api/client'
import { getRecurso } from '../../api/catalogo'
import { reservar, listMisPrestamos } from '../../api/prestamos'
import { getPerfil } from '../../api/auth'
import { ingresarCola, listMisColas } from '../../api/cola'
import { useAuth } from '../../context/AuthContext'
import { restriccionPrestamo } from '../../utils/sanciones'
import SuspensionAlert from '../../components/SuspensionAlert'
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
  const { user, setUser } = useAuth()
  const [prestamos, setPrestamos] = useState(null)
  const [colas, setColas] = useState(null)
  const [entradaCola, setEntradaCola] = useState(null)
  const [errorRestricciones, setErrorRestricciones] = useState('')

  const verificar = useCallback(async () => {
    const [{ data: perfil }, misPrestamos, misColas] = await Promise.all([
      getPerfil(), listMisPrestamos(), listMisColas(),
    ])
    setUser(perfil)
    setPrestamos(misPrestamos)
    setColas(misColas)
    return { perfil, misPrestamos }
  }, [setUser])

  useEffect(() => {
    verificar().catch(() => setErrorRestricciones('No se pudieron comprobar las restricciones de tu cuenta.'))
  }, [verificar])
  const [reserva, setReserva] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const hacerReserva = async () => {
    if (enviando) return
    setEnviando(true)
    setError('')
    try {
      // El usuario pudo haber sido sancionado después de abrir el catálogo.
      const { perfil, misPrestamos } = await verificar()
      const restriccion = restriccionPrestamo(perfil, misPrestamos)
      if (restriccion) { setError(restriccion); return }
      if (recurso.data?.disponibles > 0) {
        const { data } = await reservar(id)
        setReserva(data)
        recurso.reload()
      } else {
        const { data } = await ingresarCola(id)
        setEntradaCola(data)
        setColas(prev => [...(prev || []), data])
      }
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
  const agotado = ficha.disponibilidad === 'AGOTADO'
  const yaEnCola = colas?.find(entrada => entrada.ficha_recurso === id)
  const restriccion = errorRestricciones || restriccionPrestamo(user, prestamos)

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

          <SuspensionAlert mensaje={restriccion} />
          {reserva ? (
            <div className={styles.success} role="status">
              <strong>¡Reserva registrada!</strong>
              <p>
                Te apartamos el ejemplar <b>{reserva.codigo_inventario}</b>. Recógelo en el mostrador antes del
                {' '}<b>{formatearFechaHora(reserva.recoger_antes_de)}</b>; si no, la reserva se cancela sola.
              </p>
              <Link className={ui.button} to="/mis-prestamos">Ver mis préstamos</Link>
            </div>
          ) : entradaCola || yaEnCola ? (
            <div className={styles.success} role="status">
              <strong>Ya estás en la cola de espera</strong>
              <p>Posición: {(entradaCola || yaEnCola)?.posicion ?? 'Pendiente de confirmar'}. Cuando se libere un ejemplar, el sistema reservará automáticamente para el primer usuario elegible y le enviará un correo.</p>
              <Link className={ui.button} to="/mis-prestamos">Ver mis solicitudes</Link>
            </div>
          ) : (
            <div className={styles.reserve}>
              <button className={ui.button} disabled={Boolean(restriccion) || enviando || (!disponible && !agotado)} onClick={hacerReserva}>
                {enviando ? 'Procesando…' : disponible ? 'Reservar' : agotado ? 'Unirme a la cola' : 'No hay ejemplares'}
              </button>
              <span className={ui.hint}>{disponible ? 'Recoge tu reserva hasta el final del siguiente día hábil (se consideran feriados).' : agotado ? 'Te avisaremos por correo cuando la cola te asigne una reserva.' : 'Este recurso no tiene ejemplares prestables.'}</span>
            </div>
          )}
          {error && <p className={`${ui.notice} ${ui.error}`} role="alert">{error}</p>}
        </div>
      </section>
    </main>
  )
}
