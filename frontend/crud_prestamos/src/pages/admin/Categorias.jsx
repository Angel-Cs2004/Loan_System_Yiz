import { useState } from 'react'
import { deleteCategoria, listCategoriasAdmin } from '../../api/catalogo'
import CategoriaForm from '../../components/admin/CategoriaForm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { EmptyState, Loading } from '../../components/ui/Feedback'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../components/ui/Toast'
import { usePaginatedList } from '../../hooks/useApiList'
import ui from '../../styles/components.module.css'

export default function Categorias() {
  const toast = useToast()
  const lista = usePaginatedList(listCategoriasAdmin)
  const [form, setForm] = useState(null)
  const [borrar, setBorrar] = useState(null)

  return (
    <main className={ui.page}>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>CATÁLOGO</span>
          <h2>Categorías</h2>
          <p>Agrupan los recursos del catálogo para filtrarlos fácilmente.</p>
        </div>
        <button className={ui.button} onClick={() => setForm({})}>+ Nueva categoría</button>
      </div>

      <section className={`${ui.panel} ${ui.tablePanel}`}>
        <div className={ui.panelHeading}>
          <div>
            <h3>Listado</h3>
            <p>{lista.count} categorías registradas.</p>
          </div>
        </div>
        {lista.loading && !lista.results.length ? (
          <Loading />
        ) : lista.error ? (
          <p className={`${ui.empty} ${ui.error}`}>{lista.error}</p>
        ) : !lista.results.length ? (
          <EmptyState title="No hay categorías" message="Crea la primera para poder registrar recursos." />
        ) : (
          <div className={ui.tableWrap}>
            <table>
              <thead><tr><th>Nombre</th><th /></tr></thead>
              <tbody>
                {lista.results.map(categoria => (
                  <tr key={categoria.id}>
                    <td><strong>{categoria.nombre}</strong></td>
                    <td>
                      <div className={ui.rowActions}>
                        <button className={ui.link} onClick={() => setForm({ id: categoria.id })}>Editar</button>
                        <button className={`${ui.link} ${ui.danger}`} onClick={() => setBorrar(categoria)}>Eliminar</button>
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
        <CategoriaForm
          categoriaId={form.id}
          onClose={() => setForm(null)}
          onSaved={() => {
            toast.success(form.id ? 'Categoría actualizada.' : 'Categoría creada.')
            lista.reload()
          }}
        />
      )}
      {borrar && (
        <ConfirmDialog
          title="Eliminar categoría"
          message={`Se eliminará “${borrar.nombre}”. Si tiene recursos asociados, primero muévelos a otra categoría.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={async () => {
            await deleteCategoria(borrar.id)
            toast.success('Categoría eliminada.')
            lista.reload()
          }}
          onClose={() => setBorrar(null)}
        />
      )}
    </main>
  )
}
