import api from './client'

export const listUsuarios = params => api.get('/users/admin/usuarios/', params)
export const getUsuario = id => api.get(`/users/admin/usuarios/${id}/`)
export const createUsuario = data => api.post('/users/admin/usuarios/', data)
export const updateUsuario = (id, data) => api.patch(`/users/admin/usuarios/${id}/`, data)
export const deleteUsuario = id => api.delete(`/users/admin/usuarios/${id}/`)
