import { useCallback, useEffect, useState } from 'react'
import { apiError } from '../../api/client'
import { getPolitica, listPoliticas, updatePolitica } from '../../api/prestamos'
import { EmptyState, Loading } from '../../components/ui/Feedback'
import FormModal from '../../components/ui/FormModal'
import { useToast } from '../../components/ui/Toast'
import ui from '../../styles/components.module.css'
import { TIPOS_USUARIO } from '../../utils/format'

function PoliticaForm({ politicaId, onClose, onSaved }) {
  const [form, setForm] = useState(null)
  const [tipo, setTipo] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getPolitica(politicaId)
      .then(({ data }) => {
        setTipo(data.tipo_usuario)
        setForm({
          dias_maximo_prestamo: data.dias_maximo_prestamo,
          max_prestamos_simultaneos: data.max_prestamos_simultaneos,
        })
      })
      .catch(err => setError(apiError(err)))
  }, [politicaId])

  const campo = key => event => setForm({ ...form, [key]: event.target.value })

  const guardar = async () => {
    await updatePolitica(politicaId, {
      dias_maximo_prestamo: Number(form.dias_maximo_prestamo),
      max_prestamos_simultaneos: Number(form.max_prestamos_simultaneos),
    })
    onSaved()
  }

  return (
    <FormModal
      title="Editar política"
      description={tipo ? `Se aplica a: ${TIPOS_USUARIO[tipo]}` : null}
      submitLabel="Guardar cambios"
      onSubmit={guardar}
      onClose={onClose}
      disabled={!form}
    >
      {!form ? (
        error ? <p className={`${ui.wide} ${ui.error}`}>{error}</p> : <div className={ui.wide}><Loading /></div>
      ) : (
        <>
          <label>
            Días máximos de préstamo
            <input type="number" min={1} value={form.dias_maximo_prestamo} onChange={campo('dias_maximo_prestamo')} required />
          </label>
          <label>
            Préstamos simultáneos
            <input type="number" min={1} value={form.max_prestamos_simultaneos}
              onChange={campo('max_prestamos_simultaneos')} required />
          </label>
          <span className={`${ui.wide} ${ui.hint}`}>
            Los cambios valen para los préstamos nuevos; los que ya están en curso conservan su fecha límite.
          </span>
        </>
      )}
    </FormModal>
  )
}

export default function Politicas() {
  const toast = useToast()
  const [politicas, setPoliticas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editar, setEditar] = useState(null)

  const cargar = useCallback(async () => {
    try {
      setPoliticas(await listPoliticas())
      setError('')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return (
    <main className={ui.page}>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>REGLAS</span>
          <h2>Políticas de préstamo</h2>
          <p>Cuántos días dura un préstamo y cuántos puede tener a la vez cada tipo de usuario.</p>
        </div>
      </div>

      <section className={`${ui.panel} ${ui.tablePanel}`}>
        {loading ? (
          <Loading />
        ) : error ? (
          <p className={`${ui.empty} ${ui.error}`}>{error}</p>
        ) : !politicas.length ? (
          <EmptyState title="No hay políticas registradas" />
        ) : (
          <div className={ui.tableWrap}>
            <table>
              <thead>
                <tr><th>Tipo de usuario</th><th>Días máximos</th><th>Préstamos simultáneos</th><th /></tr>
              </thead>
              <tbody>
                {politicas.map(politica => (
                  <tr key={politica.id}>
                    <td><strong>{TIPOS_USUARIO[politica.tipo_usuario] || politica.tipo_usuario}</strong></td>
                    <td>{politica.dias_maximo_prestamo} días</td>
                    <td>{politica.max_prestamos_simultaneos}</td>
                    <td>
                      <div className={ui.rowActions}>
                        <button className={ui.link} onClick={() => setEditar(politica.id)}>Editar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editar && (
        <PoliticaForm
          politicaId={editar}
          onClose={() => setEditar(null)}
          onSaved={() => {
            toast.success('Política actualizada.')
            cargar()
          }}
        />
      )}
    </main>
  )
}
