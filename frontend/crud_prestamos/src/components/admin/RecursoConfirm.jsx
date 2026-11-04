import { darDeBajaRecurso, deleteRecurso, reactivarRecurso } from '../../api/catalogo'
import ConfirmDialog from '../ui/ConfirmDialog'

const ACCIONES = {
  baja: {
    title: 'Dar de baja la ficha de recurso',
    message: nombre => `La ficha “${nombre}” dejará de aparecer en el catálogo y no se podrá reservar. Su historial se conserva y puedes reactivarla cuando quieras.`,
    confirmLabel: 'Dar de baja',
    danger: true,
    run: darDeBajaRecurso,
  },
  reactivar: {
    title: 'Reactivar la ficha de recurso',
    message: nombre => `La ficha “${nombre}” volverá a mostrarse en el catálogo.`,
    confirmLabel: 'Reactivar',
    run: reactivarRecurso,
  },
  eliminar: {
    title: 'Eliminar la ficha de recurso',
    message: nombre => `Se borrará la ficha “${nombre}” junto con sus ejemplares. Solo es posible si nunca se prestó; si tiene historial, dala de baja.`,
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
