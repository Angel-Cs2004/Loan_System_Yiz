import { darDeBajaRecurso, deleteRecurso, reactivarRecurso } from '../../api/catalogo'
import ConfirmDialog from '../ui/ConfirmDialog'

const ACCIONES = {
  baja: {
    title: 'Dar de baja el recurso',
    message: nombre => `“${nombre}” dejará de aparecer en el catálogo y no se podrá reservar. Su historial se conserva y puedes reactivarlo cuando quieras.`,
    confirmLabel: 'Dar de baja',
    danger: true,
    run: darDeBajaRecurso,
  },
  reactivar: {
    title: 'Reactivar el recurso',
    message: nombre => `“${nombre}” volverá a mostrarse en el catálogo.`,
    confirmLabel: 'Reactivar',
    run: reactivarRecurso,
  },
  eliminar: {
    title: 'Eliminar el recurso',
    message: nombre => `Se borrará “${nombre}” junto con sus ejemplares. Solo es posible si nunca se prestó; si tiene historial, dalo de baja.`,
    confirmLabel: 'Eliminar',
    danger: true,
    run: deleteRecurso,
  },
}

export default function RecursoConfirm({ accion, recurso, onClose, onDone }) {
  const config = ACCIONES[accion]
  return (
    <ConfirmDialog
      title={config.title}
      message={config.message(recurso.nombre)}
      confirmLabel={config.confirmLabel}
      danger={config.danger}
      onConfirm={async () => {
        const { data } = await config.run(recurso.id)
        onDone(accion, data)
      }}
      onClose={onClose}
    />
  )
}
