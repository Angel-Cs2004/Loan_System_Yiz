import ui from '../styles/components.module.css'
import { estaSancionado } from '../utils/sanciones'
import { formatearFecha } from '../utils/format'

export default function SuspensionAlert({ usuario, mensaje }) {
  if (!mensaje && !estaSancionado(usuario)) return null
  const texto = mensaje || `Tu cuenta está sancionada hasta el ${formatearFecha(usuario.suspendido_hasta)} (inclusive). Puedes consultar el catálogo y tus préstamos, pero no solicitar nuevos recursos ni entrar a la cola.`
  return <p className={ui.alert} role="alert">{texto}</p>
}
