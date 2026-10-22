import styles from './ResourceCard.module.css'
import ui from '../../styles/components.module.css'

export default function ResourceCard({ resource }) {
  const available = Number(resource.disponibles) || 0
  return <article className={styles.card}>
    <div className={styles.imagePlaceholder} role="img" aria-label={`Imagen no disponible para ${resource.nombre}`}>
      <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 10.5A3.5 3.5 0 0 1 12.5 7h23a3.5 3.5 0 0 1 3.5 3.5v27a3.5 3.5 0 0 1-3.5 3.5h-23A3.5 3.5 0 0 1 9 37.5v-27Z"/><path d="m13 33 8-9 5 5 4-4 6 7M17 16.5h.01"/></svg>
      <span>Imagen no disponible</span>
    </div>
    <div className={styles.cardBody}>
      <div className={styles.cardMeta}><span className={styles.category}>{resource.categoria_nombre || 'Sin categoría'}</span><span className={`${ui.badge} ${styles.availability}`}>{available} {available === 1 ? 'disponible' : 'disponibles'}</span></div>
      <h3 className={styles.title}>{resource.nombre}</h3>
      <p className={styles.description}>{resource.descripcion || 'Consulta este recurso en nuestro catálogo.'}</p>
    </div>
  </article>
}
