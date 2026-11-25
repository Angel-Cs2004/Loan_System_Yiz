import api, { todos } from './client'

// Rutas y payload verificados con prestamos/urls.py y prestamos/serializers.py de integracion.
export const listMisColas = () => todos('/prestamos/cola/')
export const ingresarCola = fichaId => api.post('/prestamos/cola/', { ficha_recurso: fichaId })
export const salirCola = id => api.delete(`/prestamos/cola/${id}/`)
export const listColasAdmin = params => api.get('/prestamos/admin/cola/', params)
