import { useState } from 'react'
import { Link } from 'react-router-dom'
import { listColasAdmin } from '../../api/cola'
import { EmptyState, Loading } from '../../components/ui/Feedback'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'
import { usePaginatedList } from '../../hooks/useApiList'
import { formatearFechaHora } from '../../utils/format'
import ui from '../../styles/components.module.css'

const ESTADOS_COLA = { ESPERANDO: 'Esperando', ATENDIDO: 'Atendido', CANCELADO: 'Cancelado' }
export default function ColaEspera() {
  const [estado, setEstado] = useState('ESPERANDO')
  const [ficha, setFicha] = useState('')
  const lista = usePaginatedList(listColasAdmin, { estado, ficha_recurso: ficha.trim() })
  return (
    <main className={ui.page}>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>SOLICITUDES</span>
          <h2>Cola de espera</h2>
          <p>Seguimiento de recursos agotados</p>
        </div>
        <button className={`${ui.button} ${ui.secondary}`} onClick={lista.reload}>Actualizar</button>
      </div>
      <section className={`${ui.panel} ${ui.tablePanel}`}>
        <div className={ui.toolbar}>
          <label className={ui.filter}>Estado
            <select value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(ESTADOS_COLA).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className={`${ui.filter} ${ui.grow}`}>ID del recurso (opcional)
            <input placeholder="UUID de la ficha de recurso" value={ficha} onChange={e => setFicha(e.target.value)} />
          </label>
        </div>
        {lista.loading && !lista.results.length ? <Loading />
          : lista.error ? <p role="alert" className={`${ui.empty} ${ui.error}`}>{lista.error}</p>
            : !lista.results.length ? <EmptyState title="No hay solicitudes" message="Prueba otro estado o recurso." /> : (
              <div className={ui.tableWrap}><table><thead><tr>
                <th>Recurso</th><th>Usuario</th><th>Solicitud</th><th>Posición</th><th>Estado</th>
              </tr></thead><tbody>
                {lista.results.map(entrada => <tr key={entrada.id}>
                  <td><Link className={ui.rowLink} to={`/admin/recursos/${entrada.ficha_recurso}`}>
                    {entrada.ficha_recurso_nombre}</Link></td>
                  <td><Link className={ui.rowLink} to={`/admin/usuarios/${entrada.usuario}`}>{entrada.usuario_email}</Link></td>
                  <td className={ui.nowrap}>{formatearFechaHora(entrada.fecha_solicitud)}</td>
                  <td>{entrada.posicion ?? '—'}</td>
                  <td><StatusBadge value={entrada.estado} labels={ESTADOS_COLA} /></td>
                </tr>)}
              </tbody></table></div>
            )}
        <Pagination page={lista.page} count={lista.count} onChange={lista.setPage} />
      </section>
    </main>
  )
}
