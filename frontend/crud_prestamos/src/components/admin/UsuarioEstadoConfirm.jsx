import { deleteUsuario, updateUsuario } from '../../api/users'
import { nombreCompleto } from '../../utils/format'
import ConfirmDialog from '../ui/ConfirmDialog'

const ACCIONES = {
  ACTIVO: {
    title: 'Activar usuario',
    message: nombre => `${nombre} podrá iniciar sesión y pedir préstamos otra vez.`,
    confirmLabel: 'Activar',
  },
  SUSPENDIDO: {
    title: 'Suspender usuario',
    message: nombre => `${nombre} no podrá iniciar sesión ni pedir préstamos mientras esté suspendido. Sus reservas sin recoger se cancelan; lo que tenga prestado lo devuelve en el mostrador.`,
    confirmLabel: 'Suspender',
    danger: true,
  },
  INACTIVO: {
    title: 'Dar de baja al usuario',
    message: nombre => `${nombre} quedará inactivo y no podrá iniciar sesión. No se puede dar de baja a alguien con recursos sin devolver; sus reservas sin recoger se cancelan.`,
    confirmLabel: 'Dar de baja',
    danger: true,
  },
}

export default function UsuarioEstadoConfirm({ usuario, estado, onClose, onDone }) {
  const config = ACCIONES[estado]
  return (
    <ConfirmDialog
      title={config.title}
      message={config.message(nombreCompleto(usuario))}
      confirmLabel={config.confirmLabel}
      danger={config.danger}
      onConfirm={async () => {
        if (estado === 'INACTIVO') await deleteUsuario(usuario.id)
        else await updateUsuario(usuario.id, { status: estado })
        onDone(estado)
      }}
      onClose={onClose}
    />
  )
}
