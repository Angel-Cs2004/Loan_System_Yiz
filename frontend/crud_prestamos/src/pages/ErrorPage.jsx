import { Link } from 'react-router-dom'
import ui from '../styles/components.module.css'
import styles from './auth/Auth.module.css'

export default function ErrorPage({ code, title, message }) {
  return (
    <main className={styles['login-page']}>
      <div className={`${styles['login-decoration']} ${styles['decoration-one']}`} />
      <div className={`${styles['login-decoration']} ${styles['decoration-two']}`} />
      <section className={`${styles['login-card']} ${styles['login-heading']}`}>
        <span className={styles['error-code']}>{code}</span>
        <h1>{title}</h1>
        <p>{message}</p>
        <div className={styles['error-actions']}>
          <Link to="/" className={ui.button}>Ir al inicio</Link>
        </div>
      </section>
    </main>
  )
}
