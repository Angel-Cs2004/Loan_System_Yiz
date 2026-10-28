import { useEffect, useState } from 'react'
import { apiError } from '../../api/client'
import { createCategoria, getCategoria, updateCategoria } from '../../api/catalogo'
import ui from '../../styles/components.module.css'
import { Loading } from '../ui/Feedback'
import FormModal from '../ui/FormModal'

export default function CategoriaForm({ categoriaId, onClose, onSaved }) {
  const [nombre, setNombre] = useState(categoriaId ? null : '')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!categoriaId) return
    getCategoria(categoriaId)
      .then(({ data }) => setNombre(data.nombre))
      .catch(err => setError(apiError(err)))
  }, [categoriaId])

  const guardar = async () => {
    const { data } = categoriaId
      ? await updateCategoria(categoriaId, { nombre })
      : await createCategoria({ nombre })
    onSaved(data)
  }

  return (
    <FormModal
      title={categoriaId ? 'Editar categoría' : 'Nueva categoría'}
      size="sm"
      submitLabel={categoriaId ? 'Guardar cambios' : 'Crear categoría'}
      onSubmit={guardar}
      onClose={onClose}
      disabled={nombre === null}
    >
      {nombre === null ? (
        error ? <p className={`${ui.wide} ${ui.error}`}>{error}</p> : <div className={ui.wide}><Loading /></div>
      ) : (
        <label className={ui.wide}>
          Nombre
          <input value={nombre} onChange={event => setNombre(event.target.value)} maxLength={100} required autoFocus />
        </label>
      )}
    </FormModal>
  )
}
