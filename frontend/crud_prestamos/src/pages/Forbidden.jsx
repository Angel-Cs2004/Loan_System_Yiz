import ErrorPage from './ErrorPage'

export default function Forbidden() {
  return (
    <ErrorPage
      code="403"
      title="No tienes acceso a esta sección"
      message="Esta parte del sistema es solo para administradores."
    />
  )
}
