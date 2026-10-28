import { Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import PortalLayout from './layouts/PortalLayout'
import Login from './pages/auth/Login'
import OlvidePassword from './pages/auth/OlvidePassword'
import Registro from './pages/auth/Registro'
import RestablecerPassword from './pages/auth/RestablecerPassword'
import Categorias from './pages/admin/Categorias'
import Inicio from './pages/admin/Inicio'
import Mostrador from './pages/admin/Mostrador'
import PrestamoDetalle from './pages/admin/PrestamoDetalle'
import Prestamos from './pages/admin/Prestamos'
import Politicas from './pages/admin/Politicas'
import RecursoDetalle from './pages/admin/RecursoDetalle'
import Recursos from './pages/admin/Recursos'
import UsuarioDetalle from './pages/admin/UsuarioDetalle'
import Usuarios from './pages/admin/Usuarios'
import Catalogo from './pages/portal/Catalogo'
import MisPrestamos from './pages/portal/MisPrestamos'
import RecursoPortal from './pages/portal/RecursoPortal'
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
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/catalogo/:id" element={<RecursoPortal />} />
          <Route path="/mis-prestamos" element={<MisPrestamos />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        <Route path="/admin" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Inicio />} />
            <Route path="prestamos" element={<Prestamos />} />
            <Route path="prestamos/:id" element={<PrestamoDetalle />} />
            <Route path="mostrador" element={<Mostrador />} />
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
