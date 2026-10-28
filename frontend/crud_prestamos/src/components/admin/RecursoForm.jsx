import { useEffect, useState } from 'react'
import { createRecurso, listCategorias, updateRecurso } from '../../api/catalogo'
import ui from '../../styles/components.module.css'
import FormModal from '../ui/FormModal'

export default function RecursoForm({ recurso, onClose, onSaved }) {
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState({
    nombre: recurso?.nombre || '',
    categoria: recurso?.categoria || '',
    descripcion: recurso?.descripcion || '',
  })

  useEffect(() => { listCategorias().then(setCategorias).catch(() => setCategorias([])) }, [])

  const campo = key => event => setForm({ ...form, [key]: event.target.value })

  const guardar = async () => {
    const { data } = recurso ? await updateRecurso(recurso.id, form) : await createRecurso(form)
    onSaved(data)
  }

  return (
    <FormModal
      title={recurso ? 'Editar recurso' : 'Nuevo recurso'}
      description={recurso ? null : 'Luego podrás registrar sus ejemplares físicos.'}
      submitLabel={recurso ? 'Guardar cambios' : 'Crear recurso'}
      onSubmit={guardar}
      onClose={onClose}
    >
      <label>Nombre<input value={form.nombre} onChange={campo('nombre')} maxLength={150} required autoFocus /></label>
      <label>
        Categoría
        <select value={form.categoria} onChange={campo('categoria')} required>
          <option value="">Selecciona una categoría</option>
          {categorias.map(categoria => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
        </select>
      </label>
      <label className={ui.wide}>
        Descripción
        <textarea value={form.descripcion} onChange={campo('descripcion')} rows={4} />
      </label>
    </FormModal>
  )
}
