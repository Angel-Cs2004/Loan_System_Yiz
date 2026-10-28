import { Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import PortalLayout from './layouts/PortalLayout'
import Login from './pages/auth/Login'
import NotFound from './pages/NotFound'
import Perfil from './pages/Perfil'
import { GuestOnly, HomeRedirect, RequireAdmin, RequireAuth } from './routes/guards'

export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route index element={<HomeRedirect />} />

        <Route element={<PortalLayout />}>
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        <Route path="/admin" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="perfil" element={<Perfil />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
