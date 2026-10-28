import { tonoDe } from '../../utils/format'
import styles from './ui.module.css'

export default function StatusBadge({ value, labels, tone }) {
  return (
    <span className={`${styles.status} ${styles[tone || tonoDe(value)]}`}>
      {labels?.[value] || value}
    </span>
  )
}
