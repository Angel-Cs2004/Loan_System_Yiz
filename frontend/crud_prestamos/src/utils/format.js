export const TIPOS_USUARIO = {
  STUDENT: 'Estudiante',
  TEACHER: 'Docente',
  ADMINISTRATIVE_STAFF: 'Personal administrativo',
  ADMINISTRATOR: 'Administrador',
}

export const ESTADOS_USUARIO = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  SUSPENDIDO: 'Suspendido',
}

export const ESTADOS_PRESTAMO = {
  RESERVADO: 'Reservado',
  ACTIVO: 'Activo',
  VENCIDO: 'Vencido',
  DEVUELTO: 'Devuelto',
  PERDIDO: 'Perdido',
  CANCELADO: 'Cancelado',
}

export const ESTADOS_EJEMPLAR = {
  DISPONIBLE: 'Disponible',
  RESERVADO: 'Reservado',
  PRESTADO: 'Prestado',
  EN_MANTENIMIENTO: 'En mantenimiento',
  DADO_DE_BAJA: 'Dado de baja',
}

export const ESTADOS_EJEMPLAR_MANUALES = ['DISPONIBLE', 'EN_MANTENIMIENTO', 'DADO_DE_BAJA']
export const ESTADOS_EJEMPLAR_INICIALES = ['DISPONIBLE', 'EN_MANTENIMIENTO']

export const CONDICIONES = {
  BUENO: 'Bueno',
  REGULAR: 'Regular',
  DANADO: 'Dañado',
}

export const ESTADOS_FICHA = {
  ACTIVA: 'Activa',
  DADA_DE_BAJA: 'Dada de baja',
}

export const DISPONIBILIDAD = {
  DISPONIBLE: 'Disponible',
  AGOTADO: 'Agotado',
  SIN_EJEMPLARES: 'Sin ejemplares',
}

const TONOS = {
  ACTIVO: 'success',
  ACTIVA: 'success',
  DISPONIBLE: 'success',
  DEVUELTO: 'neutral',
  BUENO: 'success',
  RESERVADO: 'info',
  PRESTADO: 'info',
  REGULAR: 'warning',
  EN_MANTENIMIENTO: 'warning',
  SUSPENDIDO: 'warning',
  AGOTADO: 'warning',
  VENCIDO: 'danger',
  PERDIDO: 'danger',
  DANADO: 'danger',
  CANCELADO: 'neutral',
  INACTIVO: 'neutral',
  DADO_DE_BAJA: 'neutral',
  DADA_DE_BAJA: 'neutral',
  SIN_EJEMPLARES: 'neutral',
}

export const tonoDe = valor => TONOS[valor] || 'neutral'

const fechaCorta = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
const fechaHora = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

const aFecha = valor => {
  if (!valor) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [anio, mes, dia] = valor.split('-').map(Number)
    return new Date(anio, mes - 1, dia)
  }
  return new Date(valor)
}

export const formatearFecha = valor => {
  const fecha = aFecha(valor)
  return fecha ? fechaCorta.format(fecha) : '—'
}

export const formatearFechaHora = valor => {
  const fecha = aFecha(valor)
  return fecha ? fechaHora.format(fecha) : '—'
}

export const tiempoRestante = valor => {
  const fecha = aFecha(valor)
  if (!fecha) return ''
  const minutos = Math.round((fecha.getTime() - Date.now()) / 60000)
  if (minutos <= 0) return 'Plazo vencido'
  const horas = Math.floor(minutos / 60)
  if (horas >= 1) return `Quedan ${horas} h ${minutos % 60} min`
  return `Quedan ${minutos} min`
}

export const nombreCompleto = usuario =>
  [usuario?.first_name, usuario?.last_name].filter(Boolean).join(' ') || usuario?.email || ''

export const iniciales = usuario => {
  const nombre = nombreCompleto(usuario)
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0].toUpperCase()).join('')
}
