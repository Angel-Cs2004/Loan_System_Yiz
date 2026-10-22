import { useCallback, useEffect, useState } from 'react'
import { apiError } from '../api/client'
import {
  createCategory, createCopy, createResource, deleteCategory, deleteCopy,
  deleteResource, getCategories, getCopies, getResources, updateCategory,
  updateCopy, updateResource,
} from '../api/loans'
import styles from './Resources.module.css'
import ui from '../styles/components.module.css'

const emptyResource = { nombre: '', descripcion: '', categoria: '', estado_ficha: 'ACTIVA' }
const emptyCopy = { codigo_inventario: '', estado: 'DISPONIBLE', condicion: '' }

export default function Resources() {
  const [resources, setResources] = useState([])
  const [categories, setCategories] = useState([])
  const [resourceForm, setResourceForm] = useState(emptyResource)
  const [editingResource, setEditingResource] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [selectedResource, setSelectedResource] = useState('')
  const [copies, setCopies] = useState([])
  const [copyForm, setCopyForm] = useState(emptyCopy)
  const [editingCopy, setEditingCopy] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [{ data: resourcesData }, { data: categoryData }] = await Promise.all([getResources(), getCategories()])
      setResources(resourcesData)
      setCategories(categoryData)
    } catch (err) { setError(apiError(err)) }
  }, [])
  useEffect(() => { load() }, [load])

  const loadCopies = useCallback(async id => {
    if (!id) { setCopies([]); return }
    try { const { data } = await getCopies(id); setCopies(data) }
    catch (err) { setError(apiError(err)) }
  }, [])
  useEffect(() => { loadCopies(selectedResource) }, [selectedResource, loadCopies])

  const submitResource = async event => {
    event.preventDefault(); setSaving(true); setError('')
    const payload = { ...resourceForm, categoria: resourceForm.categoria || null }
    try {
      if (editingResource) await updateResource(editingResource, payload)
      else await createResource(payload)
      setResourceForm(emptyResource); setEditingResource(null); await load()
    } catch (err) { setError(apiError(err)) }
    finally { setSaving(false) }
  }
  const editResource = item => {
    setEditingResource(item.id)
    setResourceForm({ nombre: item.nombre, descripcion: item.descripcion || '', categoria: item.categoria || '', estado_ficha: item.estado_ficha })
    setError('')
  }
  const removeResource = async item => {
    if (!window.confirm(`¿Eliminar la ficha «${item.nombre}» y sus ejemplares?`)) return
    try { await deleteResource(item.id); if (selectedResource === item.id) setSelectedResource(''); await load() }
    catch (err) { setError(apiError(err)) }
  }

  const submitCategory = async event => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      if (editingCategory) await updateCategory(editingCategory, { nombre: categoryName.trim() })
      else await createCategory({ nombre: categoryName.trim() })
      setCategoryName(''); setEditingCategory(null); await load()
    } catch (err) { setError(apiError(err)) }
    finally { setSaving(false) }
  }
  const removeCategory = async category => {
    if (!window.confirm(`¿Eliminar la categoría «${category.nombre}»?`)) return
    try { await deleteCategory(category.id); await load() }
    catch (err) { setError(apiError(err)) }
  }

  const submitCopy = async event => {
    event.preventDefault(); if (!selectedResource) return
    setSaving(true); setError('')
    try {
      if (editingCopy) await updateCopy(editingCopy, { ...copyForm, ficha_recurso: selectedResource })
      else await createCopy(selectedResource, { ...copyForm, ficha_recurso: selectedResource })
      setCopyForm(emptyCopy); setEditingCopy(null); await loadCopies(selectedResource); await load()
    } catch (err) { setError(apiError(err)) }
    finally { setSaving(false) }
  }
  const removeCopy = async copy => {
    if (!window.confirm(`¿Eliminar el ejemplar ${copy.codigo_inventario}?`)) return
    try { await deleteCopy(copy.id); await loadCopies(selectedResource); await load() }
    catch (err) { setError(apiError(err)) }
  }

  const selected = resources.find(item => item.id === selectedResource)
  return <main className={ui.page}>
    <div className={ui.pageHeading}><div><span className={ui.eyebrow}>CATÁLOGO</span><h2>Recursos</h2><p>Administra categorías, fichas de recursos y ejemplares físicos.</p></div></div>

    <section className={`${ui.panel} ${ui.tablePanel}`}><div className={ui.panelHeading}><div><h3>1. Categorías</h3><p>Crea y administra las categorías del catálogo.</p></div></div>
      <form className={styles.inlineForm} onSubmit={submitCategory}><label>Nombre de categoría<input required maxLength="100" value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Ej. Libros, Dispositivos" /></label><div className={ui.actions}><button className={ui.button} disabled={saving}>{editingCategory ? 'Guardar categoría' : 'Crear categoría'}</button>{editingCategory && <button type="button" className={`${ui.button} ${ui.secondary}`} onClick={() => { setEditingCategory(null); setCategoryName('') }}>Cancelar</button>}</div></form>
      {categories.length ? <div className={ui.tableWrap}><table><thead><tr><th>Nombre</th><th>Acciones</th></tr></thead><tbody>{categories.map(category => <tr key={category.id}><td>{category.nombre}</td><td className={ui.nowrap}><button className={ui.link} onClick={() => { setEditingCategory(category.id); setCategoryName(category.nombre) }}>Editar</button><button className={`${ui.link} ${ui.danger}`} onClick={() => removeCategory(category)}>Eliminar</button></td></tr>)}</tbody></table></div> : <p className={ui.empty}>No hay categorías para mostrar.</p>}
    </section>

    <form className={ui.panel} onSubmit={submitResource}><h3>2. {editingResource ? 'Modificar ficha de recurso' : 'Nueva ficha de recurso'}</h3><div className={ui.formGrid}>
      <label>Nombre<input required maxLength="150" value={resourceForm.nombre} onChange={e => setResourceForm({ ...resourceForm, nombre: e.target.value })} /></label>
      <label>Categoría<select value={resourceForm.categoria} onChange={e => setResourceForm({ ...resourceForm, categoria: e.target.value })}><option value="">Sin categoría</option>{categories.map(category => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select></label>
      <label className={ui.wide}>Descripción<textarea rows="3" value={resourceForm.descripcion} onChange={e => setResourceForm({ ...resourceForm, descripcion: e.target.value })} /></label>
      <label>Estado<select value={resourceForm.estado_ficha} onChange={e => setResourceForm({ ...resourceForm, estado_ficha: e.target.value })}><option value="ACTIVA">Activa</option><option value="DADA_DE_BAJA">Dada de baja</option></select></label>
    </div><div className={ui.actions}><button className={ui.button} disabled={saving}>{saving ? 'Guardando…' : editingResource ? 'Guardar cambios' : 'Crear ficha recurso'}</button>{editingResource && <button type="button" className={`${ui.button} ${ui.secondary}`} onClick={() => { setEditingResource(null); setResourceForm(emptyResource) }}>Cancelar</button>}</div></form>

    <section className={`${ui.panel} ${ui.tablePanel}`}><div className={ui.panelHeading}><div><h3>Fichas de recursos registradas</h3></div><button className={`${ui.button} ${ui.secondary}`} onClick={load}>Actualizar</button></div>
      {resources.length ? <div className={ui.tableWrap}><table><thead><tr><th>Recurso</th><th>Categoría</th><th>Estado</th><th>Disponibles</th><th>Ejemplares</th><th>Acciones</th></tr></thead><tbody>{resources.map(item => <tr key={item.id}><td><strong>{item.nombre}</strong><small className={styles.cellSecondary}>{item.descripcion || 'Sin descripción'}</small></td><td>{item.categoria_nombre || 'Sin categoría'}</td><td><span className={styles.statePill}>{item.estado_ficha}</span></td><td>{item.disponibles}</td><td>{item.ejemplares?.length ?? 0}</td><td className={ui.nowrap}><button className={ui.link} onClick={() => editResource(item)}>Editar</button><button className={ui.link} onClick={() => setSelectedResource(item.id)}>Ejemplares</button><button className={`${ui.link} ${ui.danger}`} onClick={() => removeResource(item)}>Eliminar</button></td></tr>)}</tbody></table></div> : <p className={ui.empty}>No hay fichas de recursos registradas.</p>}
    </section>

    <section className={`${ui.panel} ${ui.tablePanel}`}><div className={ui.panelHeading}><div><h3>3. Ejemplares físicos</h3><p>Selecciona una ficha para consultar y administrar sus ejemplares físicos.</p></div></div>
      <div className={styles.inlineForm}><label>Recurso<select value={selectedResource} onChange={e => { setSelectedResource(e.target.value); setEditingCopy(null); setCopyForm(emptyCopy) }}><option value="">Selecciona una ficha de recurso</option>{resources.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label></div>
      {selectedResource && <><form className={styles.inlineForm} onSubmit={submitCopy}><h4>{editingCopy ? 'Modificar ejemplar' : `Agregar ejemplar${selected ? ` · ${selected.nombre}` : ''}`}</h4><div className={`${ui.formGrid} ${styles.threeCols}`}>
        <label>Código de inventario<input required maxLength="50" value={copyForm.codigo_inventario} onChange={e => setCopyForm({ ...copyForm, codigo_inventario: e.target.value })} /></label>
        <label>Estado<select value={copyForm.estado} onChange={e => setCopyForm({ ...copyForm, estado: e.target.value })}><option value="DISPONIBLE">Disponible</option><option value="PRESTADO">Prestado</option><option value="EN_MANTENIMIENTO">En mantenimiento</option></select></label>
        <label>Condición<input maxLength="100" value={copyForm.condicion} onChange={e => setCopyForm({ ...copyForm, condicion: e.target.value })} placeholder="Ej. Buen estado" /></label>
      </div><div className={ui.actions}><button className={ui.button} disabled={saving}>{saving ? 'Guardando…' : editingCopy ? 'Guardar ejemplar' : 'Agregar ejemplar'}</button>{editingCopy && <button type="button" className={`${ui.button} ${ui.secondary}`} onClick={() => { setEditingCopy(null); setCopyForm(emptyCopy) }}>Cancelar</button>}</div></form>
        {copies.length ? <div className={ui.tableWrap}><table><thead><tr><th>Código de inventario</th><th>Estado</th><th>Condición</th><th>Acciones</th></tr></thead><tbody>{copies.map(copy => <tr key={copy.id}><td>{copy.codigo_inventario}</td><td><span className={styles.statePill}>{copy.estado}</span></td><td>{copy.condicion || '—'}</td><td className={ui.nowrap}><button className={ui.link} onClick={() => { setEditingCopy(copy.id); setCopyForm({ codigo_inventario: copy.codigo_inventario, estado: copy.estado, condicion: copy.condicion || '' }) }}>Editar</button><button className={`${ui.link} ${ui.danger}`} onClick={() => removeCopy(copy)}>Eliminar</button></td></tr>)}</tbody></table></div> : <p className={ui.empty}>Esta ficha todavía no tiene ejemplares.</p>}</>}
    </section>
    {error && <p className={`${ui.notice} ${ui.error}`} role="alert">{error}</p>}
  </main>
}
