import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loading } from '../components/ui/Feedback'
import { useAuth } from '../context/AuthContext'
import Forbidden from '../pages/Forbidden'

export const inicioDe = user => (user?.tipo_usuario === 'ADMINISTRATOR' ? '/admin' : '/catalogo')

export function RequireAuth() {
  const { user, checking } = useAuth()
  const location = useLocation()
  if (checking) return <Loading label="Verificando sesión…" fullscreen />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RequireAdmin() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Outlet /> : <Forbidden />
}

export function GuestOnly() {
  const { user, checking } = useAuth()
  if (checking) return <Loading label="Verificando sesión…" fullscreen />
  if (user) return <Navigate to={inicioDe(user)} replace />
  return <Outlet />
}

export function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={inicioDe(user)} replace />
}
