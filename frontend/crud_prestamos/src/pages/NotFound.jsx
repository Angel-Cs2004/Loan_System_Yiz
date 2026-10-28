import ErrorPage from './ErrorPage'

export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      title="Página no encontrada"
      message="La dirección que buscas no existe o fue movida."
    />
  )
}
