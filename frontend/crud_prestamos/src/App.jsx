import { useEffect, useState } from 'react'
import { getProfile, logout } from './api/auth'
import Login from './components/Login'
import UsersList from './components/UsersList'
import Policies from './components/Policies'
import Resources from './components/Resources'
import ResourceCatalog from './components/catalog/ResourceCatalog'
import Loans from './components/Loans'
import styles from './App.module.css'
import ui from './styles/components.module.css'
import loginStyles from './components/Login.module.css'

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [section, setSection] = useState('resources')
  useEffect(() => {
    let active = true
    const verifySession = async () => {
      if (!localStorage.getItem('token')) { setCheckingSession(false); return }
      try { await getProfile(); if (active) setAuthenticated(true) }
      catch { localStorage.removeItem('token'); localStorage.removeItem('refresh') }
      finally { if (active) setCheckingSession(false) }
    }
    verifySession()
    return () => { active = false }
  }, [])
  const signOut = async () => { try { await logout() } catch { /* El token local se elimina incluso si falla el cierre remoto. */ }; setAuthenticated(false) }
  if (checkingSession) return <main className={loginStyles['login-page']}>Verificando sesión…</main>
  if (!authenticated) return <Login onLoginSuccess={() => setAuthenticated(true)} />
  const tabs = [['resources', 'Recursos'], ['catalog', 'Catálogo'], ['policies', 'Políticas'], ['loans', 'Préstamos'], ['users', 'Usuarios']]
  return <div className={styles.appShell}><header className={styles.topbar}><div><span className={ui.eyebrow}>LOAN SYSTEM</span><h1>Panel de administración</h1></div><button className={`${ui.button} ${ui.secondary}`} onClick={signOut}>Cerrar sesión</button></header>
    <nav className={styles.tabs} aria-label="Secciones">{tabs.map(([key, label]) => <button key={key} className={`${styles.tab} ${section === key ? styles.active : ''}`} onClick={() => setSection(key)}>{label}</button>)}</nav>
    {section === 'users' ? <UsersList /> : section === 'loans' ? <Loans /> : section === 'policies' ? <Policies /> : section === 'catalog' ? <ResourceCatalog /> : <Resources />}
  </div>
}
