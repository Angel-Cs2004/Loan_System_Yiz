import api from './client'

export async function login(email, password) {
  const { data } = await api.post('/login/', { email, password })
  if (!data?.access || !data?.refresh) throw new Error('El servidor no devolvió los tokens de acceso.')
  localStorage.setItem('token', data.access)
  localStorage.setItem('refresh', data.refresh)
  return data
}

export const getProfile = () => api.get('/users/perfil/')

export async function logout() {
  const refresh = localStorage.getItem('refresh')
  try { if (refresh) await api.post('/users/logout/', { refresh }) }
  finally { localStorage.removeItem('token'); localStorage.removeItem('refresh') }
}
