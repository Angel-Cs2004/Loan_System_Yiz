import { useCallback, useEffect, useState } from 'react'
import { apiError } from '../api/client'
import { getLoans, returnLoan } from '../api/loans'
import ui from '../styles/components.module.css'

export default function Loans() {
  const [items, setItems] = useState([])
  const [state, setState] = useState('')
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setError('')
    try {
      const { data } = await getLoans(state)
      setItems(data)
    } catch (err) {
      setError(apiError(err))
    }
  }, [state])
  useEffect(() => { load() }, [load])
  const markReturned = async loan => {
    if (!window.confirm(`¿Registrar devolución de ${loan.ficha_recurso_nombre}?`)) {
      return
    }
    try {
      await returnLoan(loan.id)
      await load()
    } catch (err) {
      setError(apiError(err))
    }
  }
  return <main className={ui.page}>
    <div className={ui.pageHeading}><div><span className={ui.eyebrow}>CIRCULACIÓN</span><h2>Préstamos</h2><p>Consulta las reservas y registra devoluciones.</p></div><span className={ui.badge}>{items.length} registros</span></div>
    <section className={`${ui.panel} ${ui.tablePanel}`}><div className={ui.panelHeading}><div><h3>Historial de préstamos</h3><p>Filtra por estado de préstamo.</p></div><label className={ui.filter}>Estado<select value={state} onChange={event => setState(event.target.value)}><option value="">Todos</option><option value="ACTIVO">Activo</option><option value="DEVUELTO">Devuelto</option><option value="VENCIDO">Vencido</option></select></label></div>
      {error && <p className={`${ui.notice} ${ui.error}`} role="alert">{error}</p>}
      {items.length ? <div className={ui.tableWrap}><table><thead><tr><th>Usuario</th><th>Recurso</th><th>Ejemplar</th><th>Préstamo</th><th>Fecha límite</th><th>Devolución</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{items.map(loan => <tr key={loan.id}><td>{loan.usuario_email}</td><td>{loan.ficha_recurso_nombre}</td><td>{loan.codigo_inventario}</td><td>{new Date(loan.fecha_prestamo).toLocaleDateString()}</td><td>{loan.fecha_limite}</td><td>{loan.fecha_devolucion || '—'}</td><td>{loan.estado}</td><td>{loan.estado === 'ACTIVO' && <button className={ui.link} onClick={() => markReturned(loan)}>Registrar devolución</button>}</td></tr>)}</tbody></table></div> : <p className={ui.empty}>No hay préstamos para mostrar.</p>}
    </section>
  </main>
}
