import { useState } from 'react'
import { updateUsuario } from '../../api/users'
import { formatearFecha, nombreCompleto } from '../../utils/format'
import FormModal from '../ui/FormModal'
import ui from '../../styles/components.module.css'
import { estaSancionado } from '../../utils/sanciones'

export default function SuspensionForm({ usuario, onClose, onSaved }) {
  const [fecha, setFecha] = useState(usuario.suspendido_hasta || '')
  const [levantar, setLevantar] = useState(false)
  const guardar = async () => {
    const { data } = await updateUsuario(usuario.id, { suspendido_hasta: levantar ? null : fecha })
    onSaved(data)
  }
  return (
    <FormModal
      title="Gestionar sanción por préstamo"
      description={`${nombreCompleto(usuario)} · ${usuario.email}`}
      submitLabel={levantar ? 'Levantar sanción' : 'Guardar fecha'}
      onSubmit={guardar}
      onClose={onClose}
      disabled={!levantar && !fecha}
    >
      <p className={ui.wide}>
        {estaSancionado(usuario)
          ? `Actualmente sancionado hasta el ${formatearFecha(usuario.suspendido_hasta)} (inclusive).`
          : 'El usuario no tiene una sanción vigente.'}
      </p>
      <label className={ui.wide}>
        <span>Fecha final de sanción (inclusive)</span>
        <input type="date" value={fecha} disabled={levantar} required={!levantar}
          onChange={event => setFecha(event.target.value)} />
      </label>
      <label className={ui.wide}>
        <span><input type="checkbox" checked={levantar} onChange={event => setLevantar(event.target.checked)} /> Levantar sanción ahora</span>
      </label>
      <p className={`${ui.wide} ${ui.hint}`}>
        Esta acción modifica suspendido_hasta y queda registrada en auditoría. El estado de la cuenta (ACTIVO/INACTIVO) no cambia.
      </p>
    </FormModal>
  )
}
