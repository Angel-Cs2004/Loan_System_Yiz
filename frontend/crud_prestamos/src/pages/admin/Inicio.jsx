import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pagina } from '../../api/client'
import { listRecursosAdmin } from '../../api/catalogo'
import { listPrestamos } from '../../api/prestamos'
import { listUsuarios } from '../../api/users'
import PrestamoAcciones from '../../components/admin/PrestamoAcciones'
import { Loading } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import ui from '../../styles/components.module.css'
import { formatearFecha, tiempoRestante } from '../../utils/format'

const contar = async (fetcher, params) => pagina((await fetcher({ ...params, page_size: 1 })).data).count

const TARJETAS = [
  { key: 'reservados', label: 'Reservas por entregar', hint: 'Esperan en el mostrador', to: '/admin/prestamos?estado=RESERVADO' },
  { key: 'activos', label: 'Préstamos activos', hint: 'Recursos fuera, dentro del plazo', to: '/admin/prestamos?estado=ACTIVO' },
  { key: 'vencidos', label: 'Préstamos vencidos', hint: 'Pasaron su fecha límite', to: '/admin/prestamos?estado=VENCIDO' },
  { key: 'recursos', label: 'Recursos activos', hint: 'Fichas en el catálogo', to: '/admin/recursos' },
  { key: 'usuarios', label: 'Usuarios activos', hint: 'Pueden pedir préstamos', to: '/admin/usuarios' },
]

function ListaCorta({ titulo, descripcion, prestamos, vacio, plazo, onDone, verTodo }) {
  return (
    <section className={`${ui.panel} ${ui.tablePanel}`}>
      <div className={ui.panelHeading}>
        <div>
          <h3>{titulo}</h3>
          <p>{descripcion}</p>
        </div>
        <Link className={`${ui.button} ${ui.secondary} ${ui.small}`} to={verTodo}>Ver todos</Link>
      </div>
      {!prestamos.length ? (
        <p className={ui.empty}>{vacio}</p>
      ) : (
        <div className={ui.tableWrap}>
          <table>
            <tbody>
              {prestamos.map(prestamo => (
                <tr key={prestamo.id}>
                  <td>
                    <Link className={ui.rowLink} to={`/admin/prestamos/${prestamo.id}`}>{prestamo.ficha_recurso_nombre}</Link>
                    <span className={ui.cellSecondary}>{prestamo.usuario_email} · {prestamo.codigo_inventario}</span>
                  </td>
                  <td className={ui.nowrap}>{plazo(prestamo)}</td>
                  <td><PrestamoAcciones prestamo={prestamo} compact only={['entregar', 'devolver']} onDone={onDone} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function Inicio() {
  const { user } = useAuth()
  const [conteos, setConteos] = useState(null)
  const [reservas, setReservas] = useState([])
  const [vencidos, setVencidos] = useState([])
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      const [reservados, activos, totalVencidos, recursos, usuarios, ultimasReservas, ultimosVencidos] = await Promise.all([
        contar(listPrestamos, { estado: 'RESERVADO' }),
        contar(listPrestamos, { estado: 'ACTIVO' }),
        contar(listPrestamos, { estado: 'VENCIDO' }),
        contar(listRecursosAdmin, { estado_ficha: 'ACTIVA' }),
        contar(listUsuarios, { status: 'ACTIVO' }),
        listPrestamos({ estado: 'RESERVADO', page_size: 5 }),
        listPrestamos({ estado: 'VENCIDO', page_size: 5 }),
      ])
      setConteos({ reservados, activos, vencidos: totalVencidos, recursos, usuarios })
      setReservas(pagina(ultimasReservas.data).results)
      setVencidos(pagina(ultimosVencidos.data).results)
    } catch {
      setError('No se pudo cargar el resumen.')
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return (
    <main className={ui.page}>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>PANEL DE ADMINISTRACIÓN</span>
          <h2>Hola, {user?.first_name || 'administrador'}</h2>
          <p>Esto es lo que está pasando hoy en el sistema de préstamos.</p>
        </div>
        <Link className={ui.button} to="/admin/mostrador">+ Registrar en mostrador</Link>
      </div>

      {error ? (
        <p className={`${ui.panel} ${ui.error}`}>{error}</p>
      ) : !conteos ? (
        <Loading />
      ) : (
        <>
          <div className={ui.stats}>
            {TARJETAS.map(tarjeta => (
              <Link key={tarjeta.key} className={ui.stat} to={tarjeta.to}>
                <span>{tarjeta.label}</span>
                <strong>{conteos[tarjeta.key]}</strong>
                <small>{tarjeta.hint}</small>
              </Link>
            ))}
          </div>

          <ListaCorta
            titulo="Reservas por entregar"
            descripcion="Tienen 24 horas para recogerse; luego se cancelan solas."
            prestamos={reservas}
            vacio="No hay reservas esperando."
            plazo={prestamo => tiempoRestante(prestamo.recoger_antes_de)}
            onDone={cargar}
            verTodo="/admin/prestamos?estado=RESERVADO"
          />
          <ListaCorta
            titulo="Préstamos vencidos"
            descripcion="Recursos que debieron devolverse."
            prestamos={vencidos}
            vacio="No hay préstamos vencidos."
            plazo={prestamo => `Venció el ${formatearFecha(prestamo.fecha_limite)}`}
            onDone={cargar}
            verTodo="/admin/prestamos?estado=VENCIDO"
          />
        </>
      )}
    </main>
  )
}
