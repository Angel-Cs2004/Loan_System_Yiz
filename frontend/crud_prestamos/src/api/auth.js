import api, { tokens } from './client'

export async function login(email, password) {
  const { data } = await api.post('/login/', { email, password }, { auth: false })
  if (!data?.access || !data?.refresh) throw new Error('El servidor no devolvió los tokens de acceso.')
  tokens.save(data)
  return data
}

export async function logout() {
  try {
    if (tokens.refresh) await api.post('/users/logout/', { refresh: tokens.refresh })
  } finally {
    tokens.clear()
  }
}

export const registrar = data => api.post('/users/registro/', data, { auth: false })

export const getPerfil = () => api.get('/users/perfil/')
export const updatePerfil = data => api.patch('/users/perfil/', data)

export async function cambiarPassword(password_actual, password_nueva) {
  const { data } = await api.post('/users/perfil/password/', { password_actual, password_nueva })
  tokens.save(data)
  return data
}

export const solicitarRestablecimiento = email =>
  api.post('/users/password/olvide/', { email }, { auth: false })

export const restablecerPassword = (uid, token, password_nueva) =>
  api.post('/users/password/restablecer/', { uid, token, password_nueva }, { auth: false })
