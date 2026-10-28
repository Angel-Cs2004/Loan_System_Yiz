import { Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import PortalLayout from './layouts/PortalLayout'
import Login from './pages/auth/Login'
import OlvidePassword from './pages/auth/OlvidePassword'
import Registro from './pages/auth/Registro'
import RestablecerPassword from './pages/auth/RestablecerPassword'
import Categorias from './pages/admin/Categorias'
import Politicas from './pages/admin/Politicas'
import RecursoDetalle from './pages/admin/RecursoDetalle'
import Recursos from './pages/admin/Recursos'
import UsuarioDetalle from './pages/admin/UsuarioDetalle'
import Usuarios from './pages/admin/Usuarios'
import NotFound from './pages/NotFound'
import Perfil from './pages/Perfil'
import { GuestOnly, HomeRedirect, RequireAdmin, RequireAuth } from './routes/guards'

export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>
      <Route path="/olvide-password" element={<OlvidePassword />} />
      <Route path="/restablecer-password" element={<RestablecerPassword />} />

      <Route element={<RequireAuth />}>
        <Route index element={<HomeRedirect />} />

        <Route element={<PortalLayout />}>
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        <Route path="/admin" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="recursos" element={<Recursos />} />
            <Route path="recursos/:id" element={<RecursoDetalle />} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="politicas" element={<Politicas />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="usuarios/:id" element={<UsuarioDetalle />} />
            <Route path="perfil" element={<Perfil />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
