import { useEffect, useState } from 'react'
import { getProfile, logout } from './api/auth'
import Login from './components/Login'
import UsersList from './components/UsersList'
import Policies from './components/Policies'
import Resources from './components/Resources'
import Loans from './components/Loans'

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
  if (checkingSession) return <main className="login-page">Verificando sesión…</main>
  if (!authenticated) return <Login onLoginSuccess={() => setAuthenticated(true)} />
  const tabs = [['resources', 'Recursos'], ['policies', 'Políticas'], ['loans', 'Préstamos'], ['users', 'Usuarios']]
  return <div className="app-shell"><header className="topbar"><div><span className="eyebrow">LOAN SYSTEM</span><h1>Panel de administración</h1></div><button className="button secondary" onClick={signOut}>Cerrar sesión</button></header>
    <nav className="tabs" aria-label="Secciones">{tabs.map(([key, label]) => <button key={key} className={section === key ? 'tab active' : 'tab'} onClick={() => setSection(key)}>{label}</button>)}</nav>
    {section === 'users' ? <UsersList /> : section === 'loans' ? <Loans /> : section === 'policies' ? <Policies /> : <Resources />}
  </div>
}
