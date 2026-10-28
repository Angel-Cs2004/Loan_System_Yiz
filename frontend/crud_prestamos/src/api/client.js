const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export const tokens = {
  get access() { return localStorage.getItem('token') },
  get refresh() { return localStorage.getItem('refresh') },
  save({ access, refresh }) {
    if (access) localStorage.setItem('token', access)
    if (refresh) localStorage.setItem('refresh', refresh)
  },
  clear() {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh')
  },
}

let refreshing = null

async function renovarAcceso() {
  if (!tokens.refresh) return false
  refreshing ??= fetch(`${baseURL}/login/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: tokens.refresh }),
  })
    .then(async response => {
      if (!response.ok) return false
      tokens.save(await response.json())
      return true
    })
    .catch(() => false)
    .finally(() => { refreshing = null })
  return refreshing
}

function construirURL(path, params) {
  const url = new URL(`${baseURL}${path}`, window.location.origin)
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })
  return url
}

async function request(method, path, { body, params, auth = true } = {}, reintento = true) {
  const headers = body === undefined ? {} : { 'Content-Type': 'application/json' }
  if (auth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`

  const response = await fetch(construirURL(path, params), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 401 && auth && reintento && tokens.refresh) {
    if (await renovarAcceso()) return request(method, path, { body, params, auth }, false)
    tokens.clear()
    window.dispatchEvent(new Event('auth:expired'))
  }

  const data = [204, 205].includes(response.status) ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`)
    error.response = { status: response.status, data }
    throw error
  }
  return { data, status: response.status }
}

const api = {
  get: (path, params, options) => request('GET', path, { params, ...options }),
  post: (path, body, options) => request('POST', path, { body, ...options }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: path => request('DELETE', path),
}

export default api

export const resultados = data => (Array.isArray(data) ? data : data?.results ?? [])

export const pagina = data => ({
  results: resultados(data),
  count: Array.isArray(data) ? data.length : data?.count ?? 0,
})

export async function todos(path, params = {}) {
  const items = []
  let page = 1
  for (;;) {
    const { data } = await api.get(path, { ...params, page, page_size: 100 })
    items.push(...resultados(data))
    if (Array.isArray(data) || !data?.next) return items
    page += 1
  }
}

const CAMPOS = {
  email: 'Correo',
  password: 'Contraseña',
  password_actual: 'Contraseña actual',
  password_nueva: 'Contraseña nueva',
  first_name: 'Nombres',
  last_name: 'Apellidos',
  dni: 'DNI',
  cui: 'CUI',
  tipo_usuario: 'Tipo de usuario',
  status: 'Estado',
  nombre: 'Nombre',
  descripcion: 'Descripción',
  categoria: 'Categoría',
  codigo_inventario: 'Código de inventario',
  estado: 'Estado',
  condicion: 'Condición',
  observaciones: 'Observaciones',
  dias_maximo_prestamo: 'Días máximos',
  max_prestamos_simultaneos: 'Préstamos simultáneos',
  usuario: 'Usuario',
  ficha_recurso: 'Recurso',
  refresh: 'Sesión',
}

const aTexto = valor => {
  if (Array.isArray(valor)) return valor.map(aTexto).join(' ')
  if (valor && typeof valor === 'object') return Object.values(valor).map(aTexto).join(' ')
  return String(valor)
}

export function apiError(error) {
  const status = error?.response?.status
  const data = error?.response?.data
  if (!error?.response) return 'No se pudo conectar con el servidor.'
  if (status === 403 && !data?.detail) return 'No tienes permiso para realizar esta acción.'
  if (status === 404 && !data?.detail) return 'No se encontró lo que buscabas.'
  if (!data) return `El servidor respondió con un error (${status}).`
  if (typeof data === 'string') return data
  if (Array.isArray(data)) return aTexto(data)
  return Object.entries(data)
    .map(([key, value]) => (['detail', 'non_field_errors'].includes(key) ? aTexto(value) : `${CAMPOS[key] || key}: ${aTexto(value)}`))
    .join(' · ')
}
