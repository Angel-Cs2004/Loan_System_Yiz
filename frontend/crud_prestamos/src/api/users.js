import api from './client'

export const getUsers = () => api.get('/users/admin/usuarios/')
export const createUser = data => api.post('/users/admin/usuarios/', data)
export const updateUser = (id, data) => api.put(`/users/admin/usuarios/${id}/`, data)
export const deleteUser = id => api.delete(`/users/admin/usuarios/${id}/`)
