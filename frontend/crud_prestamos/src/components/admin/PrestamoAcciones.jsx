import { useState } from 'react'
import {
  cancelarPrestamo, devolverPrestamo, entregarPrestamo, marcarPerdido, renovarPrestamo,
} from '../../api/prestamos'
import ui from '../../styles/components.module.css'
import { CONDICIONES } from '../../utils/format'
import ConfirmDialog from '../ui/ConfirmDialog'
import FormModal from '../ui/FormModal'
import { useToast } from '../ui/Toast'

const DISPONIBLES = {
  RESERVADO: ['entregar', 'cancelar'],
  ACTIVO: ['devolver', 'renovar', 'perdido'],
  VENCIDO: ['devolver', 'perdido'],
}

const ETIQUETAS = {
  entregar: 'Entregar',
  cancelar: 'Cancelar',
  devolver: 'Registrar devolución',
  renovar: 'Renovar',
  perdido: 'Marcar perdido',
}

const PELIGROSAS = ['cancelar', 'perdido']

export const accionesDe = prestamo => DISPONIBLES[prestamo.estado] || []

function DevolucionForm({ prestamo, onClose, onDone }) {
  const [condicion, setCondicion] = useState('')
  return (
    <FormModal
      title="Registrar devolución"
      description={`${prestamo.ficha_recurso_nombre} · ${prestamo.codigo_inventario}`}
      submitLabel="Registrar devolución"
      onSubmit={async () => onDone((await devolverPrestamo(prestamo.id, condicion)).data)}
      onClose={onClose}
    >
      <label className={ui.wide}>
        Condición en que se devuelve
        <select value={condicion} onChange={event => setCondicion(event.target.value)}>
          <option value="">Sin cambios</option>
          {Object.entries(CONDICIONES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <span className={ui.hint}>Si vuelve dañado, el ejemplar pasa a mantenimiento y no queda disponible.</span>
      </label>
    </FormModal>
  )
}

function PerdidaForm({ prestamo, onClose, onDone }) {
  const [observaciones, setObservaciones] = useState('')
  return (
    <FormModal
      title="Marcar como perdido"
      description={`${prestamo.ficha_recurso_nombre} · ${prestamo.codigo_inventario}`}
      submitLabel="Marcar perdido"
      onSubmit={async () => onDone((await marcarPerdido(prestamo.id, observaciones)).data)}
      onClose={onClose}
    >
      <p className={`${ui.wide} ${ui.muted}`}>
        El préstamo se cierra y el ejemplar queda dado de baja. Esta acción no se puede deshacer.
      </p>
      <label className={ui.wide}>
        Observaciones
        <textarea value={observaciones} onChange={event => setObservaciones(event.target.value)} maxLength={500} rows={3}
          placeholder="Qué pasó, acuerdos de reposición, etc." />
      </label>
    </FormModal>
  )
}

const CONFIRMACIONES = {
  entregar: {
    title: 'Entregar reserva',
    message: p => `Confirma que ${p.usuario_email} recoge ${p.ficha_recurso_nombre} (${p.codigo_inventario}). Desde ahora corren los días del préstamo.`,
    run: entregarPrestamo,
  },
  cancelar: {
    title: 'Cancelar reserva',
    message: p => `Se cancelará la reserva de ${p.usuario_email} y el ejemplar ${p.codigo_inventario} quedará libre.`,
    run: cancelarPrestamo,
    danger: true,
  },
  renovar: {
    title: 'Renovar préstamo',
    message: p => `La nueva fecha límite de ${p.ficha_recurso_nombre} se contará desde hoy según la política del usuario. Solo se puede renovar una vez.`,
    run: renovarPrestamo,
  },
}

const EXITO = {
  entregar: 'Reserva entregada. El préstamo está activo.',
  cancelar: 'Reserva cancelada.',
  devolver: 'Devolución registrada.',
  renovar: 'Préstamo renovado.',
  perdido: 'Préstamo marcado como perdido.',
}

export default function PrestamoAcciones({ prestamo, onDone, compact = false, only }) {
  const toast = useToast()
  const [accion, setAccion] = useState(null)
  const acciones = accionesDe(prestamo).filter(item => !only || only.includes(item))
  if (!acciones.length) return null

  const terminar = data => {
    toast.success(EXITO[accion])
    onDone?.(data)
  }

  const claseBoton = item => {
    if (compact) return `${ui.link} ${PELIGROSAS.includes(item) ? ui.danger : ''}`
    if (PELIGROSAS.includes(item)) return `${ui.button} ${ui.ghostDanger}`
    return item === acciones[0] ? ui.button : `${ui.button} ${ui.secondary}`
  }

  const confirmacion = CONFIRMACIONES[accion]

  return (
    <>
      <div className={compact ? ui.rowActions : ui.headingActions}>
        {acciones.map(item => (
          <button key={item} className={claseBoton(item)} onClick={() => setAccion(item)}>{ETIQUETAS[item]}</button>
        ))}
      </div>
      {accion === 'devolver' && <DevolucionForm prestamo={prestamo} onClose={() => setAccion(null)} onDone={terminar} />}
      {accion === 'perdido' && <PerdidaForm prestamo={prestamo} onClose={() => setAccion(null)} onDone={terminar} />}
      {confirmacion && (
        <ConfirmDialog
          title={confirmacion.title}
          message={confirmacion.message(prestamo)}
          confirmLabel={ETIQUETAS[accion]}
          danger={confirmacion.danger}
          onConfirm={async () => terminar((await confirmacion.run(prestamo.id)).data)}
          onClose={() => setAccion(null)}
        />
      )}
    </>
  )
}
