import ui from '../../styles/components.module.css'
import styles from './ui.module.css'

export default function Pagination({ page, count, pageSize = 20, onChange }) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  if (count <= pageSize) return null

  return (
    <nav className={styles.pagination} aria-label="Paginación">
      <span>Página {page} de {pages} · {count} registros</span>
      <div>
        <button className={`${ui.button} ${ui.secondary} ${ui.small}`} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </button>
        <button className={`${ui.button} ${ui.secondary} ${ui.small}`} disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Siguiente
        </button>
      </div>
    </nav>
  )
}
