import { useEffect, useState } from 'react'
import { apiError } from '../../api/client'
import { createEjemplar, getEjemplar, updateEjemplar } from '../../api/catalogo'
import ui from '../../styles/components.module.css'
import {
  CONDICIONES, ESTADOS_EJEMPLAR, ESTADOS_EJEMPLAR_INICIALES, ESTADOS_EJEMPLAR_MANUALES,
} from '../../utils/format'
import { Loading } from '../ui/Feedback'
import FormModal from '../ui/FormModal'

const VACIO = { codigo_inventario: '', estado: 'DISPONIBLE', condicion: 'BUENO', observaciones: '' }

export default function EjemplarForm({ fichaId, ejemplarId, onClose, onSaved }) {
  const [form, setForm] = useState(ejemplarId ? null : VACIO)
  const [original, setOriginal] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ejemplarId) return
    getEjemplar(ejemplarId)
      .then(({ data }) => {
        setOriginal(data)
        setForm({
          codigo_inventario: data.codigo_inventario,
          estado: data.estado,
          condicion: data.condicion,
          observaciones: data.observaciones,
        })
      })
      .catch(err => setError(apiError(err)))
  }, [ejemplarId])

  const bloqueadoPorSistema = ['PRESTADO', 'RESERVADO'].includes(original?.estado)
  const estados = ejemplarId ? ESTADOS_EJEMPLAR_MANUALES : ESTADOS_EJEMPLAR_INICIALES

  const campo = key => event => setForm({ ...form, [key]: event.target.value })

  const guardar = async () => {
    const datos = bloqueadoPorSistema ? { ...form, estado: undefined } : form
    const { data } = ejemplarId ? await updateEjemplar(ejemplarId, datos) : await createEjemplar(fichaId, datos)
    onSaved(data)
  }

  return (
    <FormModal
      title={ejemplarId ? 'Editar ejemplar' : 'Nuevo ejemplar'}
      description="Cada ejemplar es una unidad física con su propia etiqueta de inventario."
      submitLabel={ejemplarId ? 'Guardar cambios' : 'Registrar ejemplar'}
      onSubmit={guardar}
      onClose={onClose}
      disabled={!form}
    >
      {!form ? (
        error ? <p className={`${ui.wide} ${ui.error}`}>{error}</p> : <div className={ui.wide}><Loading /></div>
      ) : (
        <>
          <label>
            Código de inventario
            <input value={form.codigo_inventario} onChange={campo('codigo_inventario')} maxLength={50}
              placeholder="Ej. LAP-002" required autoFocus />
          </label>
          <label>
            Estado
            {bloqueadoPorSistema ? (
              <>
                <select value={form.estado} disabled>
                  <option value={form.estado}>{ESTADOS_EJEMPLAR[form.estado]}</option>
                </select>
                <span className={ui.hint}>Cambia solo al entregar, devolver o cancelar el préstamo.</span>
              </>
            ) : (
              <select value={form.estado} onChange={campo('estado')}>
                {estados.map(estado => <option key={estado} value={estado}>{ESTADOS_EJEMPLAR[estado]}</option>)}
              </select>
            )}
          </label>
          <label>
            Condición
            <select value={form.condicion} onChange={campo('condicion')}>
              {Object.entries(CONDICIONES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {form.condicion === 'DANADO' && form.estado === 'DISPONIBLE' && (
              <span className={ui.hint}>Un ejemplar dañado no puede quedar disponible.</span>
            )}
          </label>
          <label className={ui.wide}>
            Observaciones
            <textarea value={form.observaciones} onChange={campo('observaciones')} rows={3} />
          </label>
        </>
      )}
    </FormModal>
  )
}
