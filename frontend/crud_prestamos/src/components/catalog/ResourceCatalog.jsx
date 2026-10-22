import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiError } from '../../api/client'
import { getResources } from '../../api/loans'
import ui from '../../styles/components.module.css'
import ResourceCard from './ResourceCard'
import styles from './ResourceCatalog.module.css'

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()

export default function ResourceCatalog({ loadResources = getResources }) {
  const [resources, setResources] = useState([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await loadResources()
      setResources(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [loadResources])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const visibleResources = useMemo(() => {
    const term = normalize(debouncedQuery.trim())
    return resources.filter(resource => resource.estado_ficha === 'ACTIVA' && Number(resource.disponibles) > 0)
      .filter(resource => !term || normalize(resource.nombre).includes(term))
  }, [resources, debouncedQuery])

  return <main className={`${ui.page} ${styles.catalog}`}>
    <div className={ui.pageHeading}><div><span className={ui.eyebrow}>CATÃLOGO</span><h2>Catálogo de Recursos</h2><p>Explora los recursos disponibles para prÃ©stamo.</p></div></div>
    <div className={styles.searchWrap}>
      <label className={styles.searchLabel} htmlFor="resource-catalog-search">Buscar recursos por nombre</label>
      <div className={styles.searchControl}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input id="resource-catalog-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ej. Libro, proyectorâ€¦" /></div>
    </div>
    {loading ? <div className={styles.grid} aria-label="Cargando recursos" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div className={styles.skeleton} key={index}><div /><span /><span /></div>)}</div>
      : error ? <div className={`${ui.panel} ${styles.message}`} role="alert"><p>{error}</p><button className={ui.button} onClick={load}>Reintentar</button></div>
        : visibleResources.length ? <div className={styles.grid}>{visibleResources.map(resource => <ResourceCard key={resource.id} resource={resource} />)}</div>
          : <p className={`${ui.panel} ${styles.message}`}>No se encontraron recursos disponibles</p>}
  </main>
}
