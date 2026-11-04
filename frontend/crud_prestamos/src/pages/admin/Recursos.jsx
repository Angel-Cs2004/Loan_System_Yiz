import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listCategorias, listRecursosAdmin } from '../../api/catalogo'
import EjemplarForm from '../../components/admin/EjemplarForm'
import RecursoConfirm from '../../components/admin/RecursoConfirm'
import RecursoForm from '../../components/admin/RecursoForm'
import { EmptyState, Loading } from '../../components/ui/Feedback'
import Pagination from '../../components/ui/Pagination'
import FormModal from '../../components/ui/FormModal'
import StatusBadge from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import { useDebounced, usePaginatedList } from '../../hooks/useApiList'
import ui from '../../styles/components.module.css'
import { DISPONIBILIDAD, ESTADOS_FICHA } from '../../utils/format'

const MENSAJES = {
  baja: 'Ficha de recurso dada de baja.',
  reactivar: 'Ficha de recurso reactivada.',
  eliminar: 'Ficha de recurso eliminada.',
}

export default function Recursos() {
  const navigate = useNavigate()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [categoria, setCategoria] = useState('')
  const [estado, setEstado] = useState('')
  const [soloDisponibles, setSoloDisponibles] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState(null)
  const [ejemplarForm, setEjemplarForm] = useState(null)
  const [seleccionarFicha, setSeleccionarFicha] = useState(false)
  const [fichaSeleccionada, setFichaSeleccionada] = useState('')
  const [confirm, setConfirm] = useState(null)
  const busqueda = useDebounced(q)

  const lista = usePaginatedList(listRecursosAdmin, {
    q: busqueda, categoria, estado_ficha: estado, solo_disponibles: soloDisponibles ? 'true' : '',
  })

  useEffect(() => { listCategorias().then(setCategorias).catch(() => {}) }, [])

  return (
    <main className={ui.page}>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>CATÁLOGO</span>
          <h2>Fichas de recursos</h2>
          <p>Fichas del catálogo con sus ejemplares físicos.</p>
        </div>
        <div className={ui.headingActions}>
          <button className={ui.button} onClick={() => setForm({})}>+ Crear ficha de recurso</button>
          <button
            className={`${ui.button} ${ui.secondary}`}
            disabled={!lista.results.some(item => item.estado_ficha === 'ACTIVA')}
            onClick={() => setSeleccionarFicha(true)}
          >+ Crear ejemplar</button>
        </div>
      </div>

      <section className={`${ui.panel} ${ui.tablePanel}`}>
        <div className={ui.toolbar}>
          <label className={`${ui.filter} ${ui.grow}`}>
            Buscar
            <input type="search" value={q} onChange={event => setQ(event.target.value)} placeholder="Nombre o descripción" />
          </label>
          <label className={ui.filter}>
            Categoría
            <select value={categoria} onChange={event => setCategoria(event.target.value)}>
              <option value="">Todas</option>
              {categorias.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </label>
          <label className={ui.filter}>
            Estado
            <select value={estado} onChange={event => setEstado(event.target.value)}>
              <option value="">Todos</option>
              {Object.entries(ESTADOS_FICHA).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className={ui.checkbox}>
            <input type="checkbox" checked={soloDisponibles} onChange={event => setSoloDisponibles(event.target.checked)} />
            Solo con unidades libres
          </label>
        </div>

        {lista.loading && !lista.results.length ? (
          <Loading />
        ) : lista.error ? (
          <p className={`${ui.empty} ${ui.error}`}>{lista.error}</p>
        ) : !lista.results.length ? (
          <EmptyState title="No hay fichas de recursos" message="Prueba con otros filtros o crea una ficha de recurso." />
        ) : (
          <div className={ui.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Ficha de recurso</th>
                  <th>Categoría</th>
                  <th>Ejemplares</th>
                  <th>Disponibilidad</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.results.map(recurso => (
                  <tr key={recurso.id}>
                    <td>
                      <Link className={ui.rowLink} to={`/admin/recursos/${recurso.id}`}>{recurso.nombre}</Link>
                      <span className={ui.cellSecondary}>{recurso.descripcion || 'Sin descripción'}</span>
                    </td>
                    <td>{recurso.categoria_nombre || '—'}</td>
                    <td className={ui.nowrap}>{recurso.disponibles} libres / {recurso.total_ejemplares}</td>
                    <td><StatusBadge value={recurso.disponibilidad} labels={DISPONIBILIDAD} /></td>
                    <td><StatusBadge value={recurso.estado_ficha} labels={ESTADOS_FICHA} /></td>
                    <td>
                      <div className={ui.rowActions}>
                        <button className={ui.link} onClick={() => setForm({ recurso })}>Editar</button>
                        {recurso.estado_ficha === 'ACTIVA' ? (
                          <button className={`${ui.link} ${ui.danger}`} onClick={() => setConfirm({ accion: 'baja', recurso })}>
                            Dar de baja
                          </button>
                        ) : (
                          <button className={ui.link} onClick={() => setConfirm({ accion: 'reactivar', recurso })}>
                            Reactivar
                          </button>
                        )}
                        <button className={`${ui.link} ${ui.danger}`} onClick={() => setConfirm({ accion: 'eliminar', recurso })}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={lista.page} count={lista.count} onChange={lista.setPage} />
      </section>

      {form && (
        <RecursoForm
          recurso={form.recurso}
          onClose={() => setForm(null)}
          onSaved={data => {
            if (form.recurso) {
              toast.success('Ficha de recurso actualizada.')
              lista.reload()
            } else {
              toast.success('Ficha de recurso creada. Ahora registra sus ejemplares.')
              navigate(`/admin/recursos/${data.id}`)
            }
          }}
        />
      )}
      {ejemplarForm && (
        <EjemplarForm
          fichaId={ejemplarForm.id}
          onClose={() => setEjemplarForm(null)}
          onSaved={() => {
            toast.success('Ejemplar registrado.')
            setEjemplarForm(null)
            lista.reload()
          }}
        />
      )}
      {seleccionarFicha && (
        <FormModal
          title="Crear ejemplar"
          description="Selecciona una ficha activa de esta página para asociar el ejemplar."
          submitLabel="Continuar"
          disabled={!fichaSeleccionada}
          onSubmit={() => {
            const ficha = lista.results.find(item => String(item.id) === fichaSeleccionada)
            if (ficha) setEjemplarForm(ficha)
            setFichaSeleccionada('')
          }}
          onClose={() => {
            setSeleccionarFicha(false)
            setFichaSeleccionada('')
          }}
        >
          <label className={ui.wide}>
            Ficha de recurso
            <select value={fichaSeleccionada} onChange={event => setFichaSeleccionada(event.target.value)} required>
              <option value="">Selecciona una ficha activa</option>
              {lista.results.filter(item => item.estado_ficha === 'ACTIVA').map(item => (
                <option key={item.id} value={item.id}>{item.nombre}</option>
              ))}
            </select>
          </label>
        </FormModal>
      )}
      {confirm && (
        <RecursoConfirm
          {...confirm}
          onClose={() => setConfirm(null)}
          onDone={accion => {
            toast.success(MENSAJES[accion])
            lista.reload()
          }}
        />
      )}
    </main>
  )
}
