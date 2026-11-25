import { formatearFecha } from './format'

// suspendido_hasta es DateField: la suspensión también aplica el día indicado.
// Comparar YYYY-MM-DD evita el desplazamiento de zona horaria causado por new Date('YYYY-MM-DD').
export const fechaLocalPeru = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())

export const estaSancionado = usuario => Boolean(
  usuario?.suspendido_hasta && usuario.suspendido_hasta >= fechaLocalPeru()
)

export function restriccionPrestamo(usuario, pendientes) {
  if (!usuario) return 'Selecciona un usuario.'
  if (usuario.status !== 'ACTIVO') return 'La cuenta no está activa y no puede solicitar préstamos.'
  if (estaSancionado(usuario)) {
    return `Usuario sancionado hasta el ${formatearFecha(usuario.suspendido_hasta)} (inclusive). No puede pedir préstamos, reservar ni ingresar a colas.`
  }
  if (pendientes === null || pendientes === undefined) return 'Verificando préstamos pendientes…'
  if (!Array.isArray(pendientes)) return 'No se pudieron verificar las restricciones. Inténtalo de nuevo.'
  if (pendientes.some(p => p.estado === 'VENCIDO')) {
    return 'El usuario tiene préstamos vencidos; debe devolverlos antes de solicitar otro.'
  }
  return ''
}
