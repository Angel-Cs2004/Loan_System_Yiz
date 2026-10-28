import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { useAuth } from '../context/AuthContext'
import ui from '../styles/components.module.css'
import { TIPOS_USUARIO, iniciales, nombreCompleto } from '../utils/format'
import styles from './Layout.module.css'

const TABS = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/perfil', label: 'Mi perfil' },
]

export default function PortalLayout() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.appShell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>LS</span>
          <div>
            <span className={styles.brandText}>LOAN SYSTEM</span>
            <small>Préstamo de recursos</small>
          </div>
        </div>
        <div className={styles.topbarUser}>
          {isAdmin && (
            <NavLink to="/admin" className={`${ui.button} ${ui.secondary} ${ui.small}`}>Panel admin</NavLink>
          )}
          <span className={styles.avatar}>{iniciales(user)}</span>
          <div className={styles.userInfo}>
            <strong>{nombreCompleto(user)}</strong>
            <small>{TIPOS_USUARIO[user?.tipo_usuario]}</small>
          </div>
          <button className={styles.iconButton} onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <nav className={styles.tabs} aria-label="Secciones">
        {TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
