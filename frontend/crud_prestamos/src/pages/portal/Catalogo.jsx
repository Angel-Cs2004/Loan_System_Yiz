import { useEffect, useState } from 'react'
import { listCategorias, listRecursos } from '../../api/catalogo'
import ResourceCard from '../../components/portal/ResourceCard'
import Pagination from '../../components/ui/Pagination'
import { useDebounced, usePaginatedList } from '../../hooks/useApiList'
import ui from '../../styles/components.module.css'
import styles from './Catalogo.module.css'

export default function Catalogo() {
  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState('')
  const [soloDisponibles, setSoloDisponibles] = useState(true)
  const [categorias, setCategorias] = useState([])
  const busqueda = useDebounced(query.trim())
  const lista = usePaginatedList(listRecursos, {
    q: busqueda, categoria, solo_disponibles: soloDisponibles ? 'true' : '',
  })

  useEffect(() => { listCategorias().then(setCategorias).catch(() => {}) }, [])

  let contenido
  if (lista.loading && !lista.results.length) {
    contenido = (
      <div className={styles.grid} aria-label="Cargando recursos" aria-busy="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div className={styles.skeleton} key={index}>
            <div />
            <span />
            <span />
          </div>
        ))}
      </div>
    )
  } else if (lista.error) {
    contenido = (
      <div className={`${ui.panel} ${styles.message}`} role="alert">
        <p>{lista.error}</p>
        <button className={ui.button} onClick={lista.reload}>Reintentar</button>
      </div>
    )
  } else if (lista.results.length) {
    contenido = (
      <>
        <div className={styles.grid}>
          {lista.results.map(recurso => <ResourceCard key={recurso.id} resource={recurso} />)}
        </div>
        <Pagination page={lista.page} count={lista.count} onChange={lista.setPage} />
      </>
    )
  } else {
    contenido = (
      <p className={`${ui.panel} ${styles.message}`}>
        No se encontraron recursos{soloDisponibles ? ' disponibles' : ''} con estos filtros.
      </p>
    )
  }

  return (
    <main className={`${ui.page} ${styles.catalog}`}>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>CATÁLOGO</span>
          <h2>Catálogo de recursos</h2>
          <p>Explora los recursos y resérvalos para recogerlos en el mostrador.</p>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <label className={styles.searchLabel} htmlFor="resource-catalog-search">Buscar recursos</label>
          <div className={styles.searchControl}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              id="resource-catalog-search"
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Ej. laptop, proyector, libro…"
            />
          </div>
        </div>
        <label className={ui.checkbox}>
          <input type="checkbox" checked={soloDisponibles} onChange={event => setSoloDisponibles(event.target.checked)} />
          Solo disponibles
        </label>
      </div>

      {!!categorias.length && (
        <div className={styles.chips} role="group" aria-label="Filtrar por categoría">
          <button className={!categoria ? styles.chipActive : ''} onClick={() => setCategoria('')}>Todas</button>
          {categorias.map(item => (
            <button key={item.id} className={categoria === item.id ? styles.chipActive : ''} onClick={() => setCategoria(item.id)}>
              {item.nombre}
            </button>
          ))}
        </div>
      )}

      {contenido}
    </main>
  )
}
