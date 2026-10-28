import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiError } from '../../api/client'
import { cancelarMiPrestamo, listMisPrestamos } from '../../api/prestamos'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { EmptyState, Loading } from '../../components/ui/Feedback'
import StatusBadge from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import ui from '../../styles/components.module.css'
import { ESTADOS_PRESTAMO, formatearFecha, formatearFechaHora, tiempoRestante } from '../../utils/format'
import styles from './MisPrestamos.module.css'

const PENDIENTES = ['RESERVADO', 'ACTIVO', 'VENCIDO']

const diasRestantes = fecha => {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((new Date(anio, mes - 1, dia) - hoy) / 86400000)
}

function Plazo({ prestamo }) {
  if (prestamo.estado === 'RESERVADO') {
    return (
      <>
        <strong>Recógelo antes del {formatearFechaHora(prestamo.recoger_antes_de)}</strong>
        <span>{tiempoRestante(prestamo.recoger_antes_de)} · en el mostrador</span>
      </>
    )
  }
  if (prestamo.estado === 'VENCIDO') {
    return (
      <>
        <strong>Venció el {formatearFecha(prestamo.fecha_limite)}</strong>
        <span>Devuélvelo cuanto antes; mientras tanto no puedes pedir otros recursos.</span>
      </>
    )
  }
  const dias = diasRestantes(prestamo.fecha_limite)
  return (
    <>
      <strong>Devuélvelo hasta el {formatearFecha(prestamo.fecha_limite)}</strong>
      <span>{dias === 0 ? 'Vence hoy' : `Quedan ${dias} día${dias === 1 ? '' : 's'}`}{prestamo.renovaciones ? ' · renovado' : ''}</span>
    </>
  )
}

export default function MisPrestamos() {
  const toast = useToast()
  const [prestamos, setPrestamos] = useState(null)
  const [error, setError] = useState('')
  const [vista, setVista] = useState('pendientes')
  const [cancelar, setCancelar] = useState(null)

  const cargar = useCallback(async () => {
    try {
      setPrestamos(await listMisPrestamos())
      setError('')
    } catch (err) {
      setError(apiError(err))
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const pendientes = prestamos?.filter(prestamo => PENDIENTES.includes(prestamo.estado)) || []
  const historial = prestamos?.filter(prestamo => !PENDIENTES.includes(prestamo.estado)) || []

  return (
    <main className={ui.page}>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>MI CUENTA</span>
          <h2>Mis préstamos</h2>
          <p>Tus reservas, lo que tienes prestado y tu historial.</p>
        </div>
        <Link className={ui.button} to="/catalogo">Explorar catálogo</Link>
      </div>

      <div className={`${ui.segmented} ${styles.tabs}`}>
        <button className={vista === 'pendientes' ? ui.segmentActive : ''} onClick={() => setVista('pendientes')}>
          En curso ({pendientes.length})
        </button>
        <button className={vista === 'historial' ? ui.segmentActive : ''} onClick={() => setVista('historial')}>
          Historial ({historial.length})
        </button>
      </div>

      {error ? (
        <p className={`${ui.panel} ${ui.error}`}>{error}</p>
      ) : !prestamos ? (
        <Loading />
      ) : vista === 'pendientes' ? (
        pendientes.length ? (
          <div className={styles.list}>
            {pendientes.map(prestamo => (
              <article key={prestamo.id} className={`${styles.card} ${styles[prestamo.estado.toLowerCase()] || ''}`}>
                <div className={styles.cardMain}>
                  <StatusBadge value={prestamo.estado} labels={ESTADOS_PRESTAMO} />
                  <h3>{prestamo.ficha_recurso_nombre}</h3>
                  <span className={styles.code}>Ejemplar {prestamo.codigo_inventario}</span>
                </div>
                <div className={styles.deadline}><Plazo prestamo={prestamo} /></div>
                {prestamo.estado === 'RESERVADO' && (
                  <button className={`${ui.button} ${ui.ghostDanger} ${ui.small}`} onClick={() => setCancelar(prestamo)}>
                    Cancelar reserva
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <section className={ui.panel}>
            <EmptyState title="No tienes préstamos en curso" message="Reserva un recurso del catálogo y recógelo en el mostrador.">
              <Link className={ui.button} to="/catalogo">Ir al catálogo</Link>
            </EmptyState>
          </section>
        )
      ) : (
        <section className={`${ui.panel} ${ui.tablePanel}`}>
          {historial.length ? (
            <div className={ui.tableWrap}>
              <table>
                <thead>
                  <tr><th>Recurso</th><th>Solicitado</th><th>Entregado</th><th>Devuelto</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {historial.map(prestamo => (
                    <tr key={prestamo.id}>
                      <td>
                        <strong>{prestamo.ficha_recurso_nombre}</strong>
                        <span className={ui.cellSecondary}>{prestamo.codigo_inventario}</span>
                      </td>
                      <td className={ui.nowrap}>{formatearFecha(prestamo.fecha_prestamo)}</td>
                      <td className={ui.nowrap}>{formatearFecha(prestamo.fecha_entrega)}</td>
                      <td className={ui.nowrap}>{formatearFecha(prestamo.fecha_devolucion)}</td>
                      <td>
                        <StatusBadge value={prestamo.estado} labels={ESTADOS_PRESTAMO} />
                        {prestamo.con_retraso && <span className={ui.cellSecondary}>Con retraso</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={ui.empty}>Todavía no tienes préstamos cerrados.</p>
          )}
        </section>
      )}

      {cancelar && (
        <ConfirmDialog
          title="Cancelar reserva"
          message={`Se cancelará tu reserva de ${cancelar.ficha_recurso_nombre} y el ejemplar quedará libre para otra persona.`}
          confirmLabel="Cancelar reserva"
          danger
          onConfirm={async () => {
            await cancelarMiPrestamo(cancelar.id)
            toast.success('Reserva cancelada.')
            cargar()
          }}
          onClose={() => setCancelar(null)}
        />
      )}
    </main>
  )
}
