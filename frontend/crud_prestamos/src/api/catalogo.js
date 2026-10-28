import api, { todos } from './client'

export const listRecursos = params => api.get('/catalogo/recursos/', params)
export const getRecurso = id => api.get(`/catalogo/recursos/${id}/`)
export const listCategorias = () => todos('/catalogo/categorias/')

export const listRecursosAdmin = params => api.get('/catalogo/admin/recursos/', params)
export const getRecursoAdmin = id => api.get(`/catalogo/admin/recursos/${id}/`)
export const createRecurso = data => api.post('/catalogo/admin/recursos/', data)
export const updateRecurso = (id, data) => api.patch(`/catalogo/admin/recursos/${id}/`, data)
export const deleteRecurso = id => api.delete(`/catalogo/admin/recursos/${id}/`)
export const darDeBajaRecurso = id => api.post(`/catalogo/admin/recursos/${id}/baja/`)
export const reactivarRecurso = id => api.post(`/catalogo/admin/recursos/${id}/reactivar/`)

export const listEjemplares = fichaId => todos(`/catalogo/admin/recursos/${fichaId}/ejemplares/`)
export const createEjemplar = (fichaId, data) => api.post(`/catalogo/admin/recursos/${fichaId}/ejemplares/`, data)
export const getEjemplar = id => api.get(`/catalogo/admin/ejemplares/${id}/`)
export const updateEjemplar = (id, data) => api.patch(`/catalogo/admin/ejemplares/${id}/`, data)
export const deleteEjemplar = id => api.delete(`/catalogo/admin/ejemplares/${id}/`)

export const listCategoriasAdmin = params => api.get('/catalogo/admin/categorias/', params)
export const getCategoria = id => api.get(`/catalogo/admin/categorias/${id}/`)
export const createCategoria = data => api.post('/catalogo/admin/categorias/', data)
export const updateCategoria = (id, data) => api.patch(`/catalogo/admin/categorias/${id}/`, data)
export const deleteCategoria = id => api.delete(`/catalogo/admin/categorias/${id}/`)
