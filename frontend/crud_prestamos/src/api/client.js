const baseURL = import.meta.env.VITE_API_URL || window.location.origin

async function request(method, path, body, config = {}) {
  const url = new URL(`${baseURL}${path}`)
  Object.entries(config.params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })
  const token = localStorage.getItem('token')
  const response = await fetch(url, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`)
    error.response = { status: response.status, data }
    throw error
  }
  return { data, status: response.status }
}

const api = {
  get: (path, config) => request('GET', path, undefined, config),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: path => request('DELETE', path),
}

export default api
export function apiError(error) {
  const data = error?.response?.data
  if (!data) return 'No se pudo conectar con el servidor.'
  if (typeof data === 'string') return data
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' · ')
}
