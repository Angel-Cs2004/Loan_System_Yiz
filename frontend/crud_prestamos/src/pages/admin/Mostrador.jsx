import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiError, resultados } from '../../api/client'
import { listRecursos } from '../../api/catalogo'
import { listPrestamos, registrarPrestamo } from '../../api/prestamos'
import { getUsuario, listUsuarios } from '../../api/users'
import PrestamoAcciones from '../../components/admin/PrestamoAcciones'
import { Loading } from '../../components/ui/Feedback'
import Icon from '../../components/ui/Icon'
import StatusBadge from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import { useDebounced } from '../../hooks/useApiList'
import ui from '../../styles/components.module.css'
import {
  DISPONIBILIDAD, ESTADOS_PRESTAMO, ESTADOS_USUARIO, TIPOS_USUARIO, formatearFecha, formatearFechaHora, nombreCompleto,
} from '../../utils/format'
import styles from './Mostrador.module.css'

const PENDIENTES = ['RESERVADO', 'ACTIVO', 'VENCIDO']

function useBusqueda(fetcher, termino, extra) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!termino) {
      setItems([])
      return
    }
    let activo = true
    setLoading(true)
    fetcher({ q: termino, page_size: 8, ...extra })
      .then(({ data }) => { if (activo) setItems(resultados(data)) })
      .catch(() => { if (activo) setItems([]) })
      .finally(() => { if (activo) setLoading(false) })
    return () => { activo = false }
  }, [fetcher, termino, extra])
  return { items, loading }
}

const SOLO_ACTIVOS = { status: 'ACTIVO' }
const SOLO_DISPONIBLES = { solo_disponibles: 'true' }

export default function Mostrador() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const [usuario, setUsuario] = useState(null)
  const [qUsuario, setQUsuario] = useState('')
  const [pendientes, setPendientes] = useState(null)
  const [modo, setModo] = useState('codigo')
  const [codigo, setCodigo] = useState('')
  const [qRecurso, setQRecurso] = useState('')
  const [recurso, setRecurso] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const usuarios = useBusqueda(listUsuarios, useDebounced(qUsuario.trim()), SOLO_ACTIVOS)
  const recursos = useBusqueda(listRecursos, useDebounced(qRecurso.trim()), SOLO_DISPONIBLES)

  useEffect(() => {
    const id = params.get('usuario')
    if (id) getUsuario(id).then(({ data }) => setUsuario(data)).catch(() => {})
  }, [params])

  const cargarPendientes = useCallback(async () => {
    if (!usuario) return
    setPendientes(null)
    try {
      const { data } = await listPrestamos({ usuario: usuario.id, page_size: 100 })
      setPendientes(resultados(data).filter(prestamo => PENDIENTES.includes(prestamo.estado)))
    } catch {
      setPendientes([])
    }
  }, [usuario])

  useEffect(() => { cargarPendientes() }, [cargarPendientes])

  const elegirUsuario = persona => {
    setUsuario(persona)
    setQUsuario('')
    setError('')
  }

  const listo = usuario && (modo === 'codigo' ? codigo.trim() : recurso)

  const registrar = async () => {
    setEnviando(true)
    setError('')
    try {
      const datos = modo === 'codigo'
        ? { usuario: usuario.id, codigo_inventario: codigo.trim() }
        : { usuario: usuario.id, ficha_recurso: recurso.id }
      const { data } = await registrarPrestamo(datos)
      toast.success(`Préstamo registrado: ${data.ficha_recurso_nombre} (${data.codigo_inventario}).`)
      navigate(`/admin/prestamos/${data.id}`)
    } catch (err) {
      setError(apiError(err))
      setEnviando(false)
    }
  }

  const vencidos = pendientes?.filter(prestamo => prestamo.estado === 'VENCIDO').length || 0

  return (
    <main className={ui.page}>
      <Link className={ui.backLink} to="/admin/prestamos"><Icon name="back" size={14} /> Préstamos</Link>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>MOSTRADOR</span>
          <h2>Registrar préstamo</h2>
          <p>Para quien llega al mostrador sin reserva: el préstamo queda activo de inmediato.</p>
        </div>
      </div>

      <section className={ui.panel}>
        <h3><span className={styles.step}>1</span> ¿Quién se lo lleva?</h3>
        {usuario ? (
          <div className={styles.selected}>
            <div>
              <strong>{nombreCompleto(usuario)}</strong>
              <span>{usuario.email} · DNI {usuario.dni}{usuario.cui ? ` · CUI ${usuario.cui}` : ''}</span>
              <span>{TIPOS_USUARIO[usuario.tipo_usuario]}</span>
            </div>
            <StatusBadge value={usuario.status} labels={ESTADOS_USUARIO} />
            <button className={`${ui.button} ${ui.secondary} ${ui.small}`} onClick={() => setUsuario(null)}>Cambiar</button>
          </div>
        ) : (
          <>
            <label className={ui.filter}>
              Buscar persona activa
              <input type="search" value={qUsuario} onChange={event => setQUsuario(event.target.value)}
                placeholder="DNI o CUI exacto, nombre o correo" autoFocus />
            </label>
            {usuarios.loading && <Loading label="Buscando…" />}
            {!usuarios.loading && qUsuario.trim() && !usuarios.items.length && (
              <p className={ui.notice}>No hay personas activas que coincidan.</p>
            )}
            {!!usuarios.items.length && (
              <ul className={styles.results}>
                {usuarios.items.map(persona => (
                  <li key={persona.id}>
                    <button onClick={() => elegirUsuario(persona)}>
                      <strong>{nombreCompleto(persona)}</strong>
                      <span>{persona.email} · DNI {persona.dni} · {TIPOS_USUARIO[persona.tipo_usuario]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {usuario && (
        <section className={`${ui.panel} ${ui.tablePanel}`}>
          <div className={ui.panelHeading}>
            <div>
              <h3><span className={styles.step}>2</span> Lo que tiene pendiente</h3>
              <p>Si viene a recoger una reserva, entrégala desde aquí.</p>
            </div>
          </div>
          {vencidos > 0 && (
            <p className={`${ui.alert} ${styles.inlineAlert}`}>
              Tiene {vencidos} préstamo(s) vencido(s): debe devolverlos antes de llevarse otro recurso.
            </p>
          )}
          {pendientes === null ? (
            <Loading />
          ) : !pendientes.length ? (
            <p className={ui.empty}>No tiene préstamos ni reservas pendientes.</p>
          ) : (
            <div className={ui.tableWrap}>
              <table>
                <thead><tr><th>Recurso</th><th>Plazo</th><th>Estado</th><th /></tr></thead>
                <tbody>
                  {pendientes.map(prestamo => (
                    <tr key={prestamo.id}>
                      <td>
                        <Link className={ui.rowLink} to={`/admin/prestamos/${prestamo.id}`}>{prestamo.ficha_recurso_nombre}</Link>
                        <span className={ui.cellSecondary}>{prestamo.codigo_inventario}</span>
                      </td>
                      <td className={ui.nowrap}>
                        {prestamo.estado === 'RESERVADO'
                          ? `Recoger antes de ${formatearFechaHora(prestamo.recoger_antes_de)}`
                          : `Hasta ${formatearFecha(prestamo.fecha_limite)}`}
                      </td>
                      <td><StatusBadge value={prestamo.estado} labels={ESTADOS_PRESTAMO} /></td>
                      <td><PrestamoAcciones prestamo={prestamo} compact onDone={cargarPendientes} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {usuario && (
        <section className={ui.panel}>
          <h3><span className={styles.step}>3</span> ¿Qué se lleva?</h3>
          <div className={ui.segmented}>
            <button className={modo === 'codigo' ? ui.segmentActive : ''} onClick={() => setModo('codigo')}>Por código de etiqueta</button>
            <button className={modo === 'recurso' ? ui.segmentActive : ''} onClick={() => setModo('recurso')}>Buscar recurso</button>
          </div>

          {modo === 'codigo' ? (
            <label className={`${ui.filter} ${styles.field}`}>
              Código de inventario
              <input value={codigo} onChange={event => setCodigo(event.target.value)} placeholder="Ej. LAP-002" />
              <span className={ui.hint}>Se presta exactamente ese ejemplar.</span>
            </label>
          ) : recurso ? (
            <div className={`${styles.selected} ${styles.field}`}>
              <div>
                <strong>{recurso.nombre}</strong>
                <span>{recurso.categoria_nombre} · {recurso.disponibles} libres</span>
                <span>Se asigna cualquier ejemplar disponible.</span>
              </div>
              <button className={`${ui.button} ${ui.secondary} ${ui.small}`} onClick={() => setRecurso(null)}>Cambiar</button>
            </div>
          ) : (
            <>
              <label className={`${ui.filter} ${styles.field}`}>
                Recurso con unidades libres
                <input type="search" value={qRecurso} onChange={event => setQRecurso(event.target.value)} placeholder="Nombre del recurso" />
              </label>
              {recursos.loading && <Loading label="Buscando…" />}
              {!recursos.loading && qRecurso.trim() && !recursos.items.length && (
                <p className={ui.notice}>No hay recursos disponibles con ese nombre.</p>
              )}
              {!!recursos.items.length && (
                <ul className={styles.results}>
                  {recursos.items.map(item => (
                    <li key={item.id}>
                      <button onClick={() => setRecurso(item)}>
                        <strong>{item.nombre}</strong>
                        <span>{item.categoria_nombre} · {item.disponibles} libres · {DISPONIBILIDAD[item.disponibilidad]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {error && <p className={`${ui.notice} ${ui.error}`} role="alert">{error}</p>}
          <div className={ui.actions}>
            <button className={ui.button} disabled={!listo || enviando} onClick={registrar}>
              {enviando ? 'Registrando…' : 'Registrar préstamo'}
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
