import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { useAuth } from '../context/AuthContext'
import { iniciales, nombreCompleto } from '../utils/format'
import styles from './Layout.module.css'

const NAV = [
  { to: '/admin/recursos', label: 'Recursos', icon: 'resources' },
  { to: '/admin/categorias', label: 'Categorías', icon: 'categories' },
  { to: '/admin/politicas', label: 'Políticas', icon: 'policies' },
  { to: '/admin/perfil', label: 'Mi perfil', icon: 'profile' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.adminShell}>
      <header className={styles.mobileBar}>
        <span className={styles.brandText}>LOAN SYSTEM</span>
        <button className={styles.iconButton} onClick={() => setOpen(!open)} aria-label="Abrir menú">
          <Icon name="menu" size={22} />
        </button>
      </header>

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>LS</span>
          <div>
            <span className={styles.brandText}>LOAN SYSTEM</span>
            <small>Administración</small>
          </div>
        </div>

        <nav className={styles.sideNav} aria-label="Secciones">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `${styles.sideLink} ${isActive ? styles.sideLinkActive : ''}`}
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.userCard}>
          <span className={styles.avatar}>{iniciales(user)}</span>
          <div className={styles.userInfo}>
            <strong>{nombreCompleto(user)}</strong>
            <small>{user?.email}</small>
          </div>
          <button className={styles.iconButton} onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      {open && <div className={styles.scrim} onClick={() => setOpen(false)} />}

      <div className={styles.adminContent}>
        <Outlet />
      </div>
    </div>
  )
}
