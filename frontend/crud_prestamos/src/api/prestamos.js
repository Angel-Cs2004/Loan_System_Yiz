import api, { todos } from './client'

export const listPoliticas = () => todos('/prestamos/admin/politicas/')
export const getPolitica = id => api.get(`/prestamos/admin/politicas/${id}/`)
export const updatePolitica = (id, data) => api.patch(`/prestamos/admin/politicas/${id}/`, data)

export const reservar = fichaId => api.post('/prestamos/reservar/', { ficha_recurso: fichaId })
export const listMisPrestamos = params => api.get('/prestamos/mis-reservas/', params)
export const cancelarMiPrestamo = id => api.post(`/prestamos/mis-reservas/${id}/cancelar/`)

export const listPrestamos = params => api.get('/prestamos/admin/reservas/', params)
export const registrarPrestamo = data => api.post('/prestamos/admin/reservas/', data)
export const getPrestamo = id => api.get(`/prestamos/admin/reservas/${id}/`)
export const entregarPrestamo = id => api.post(`/prestamos/admin/reservas/${id}/entregar/`)
export const cancelarPrestamo = id => api.post(`/prestamos/admin/reservas/${id}/cancelar/`)
export const devolverPrestamo = (id, condicion) =>
  api.post(`/prestamos/admin/reservas/${id}/devolver/`, condicion ? { condicion } : {})
export const marcarPerdido = (id, observaciones) =>
  api.post(`/prestamos/admin/reservas/${id}/perdido/`, observaciones ? { observaciones } : {})
export const renovarPrestamo = id => api.post(`/prestamos/admin/reservas/${id}/renovar/`)
