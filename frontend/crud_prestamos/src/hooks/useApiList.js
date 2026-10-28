import { useCallback, useEffect, useRef, useState } from 'react'
import { apiError, pagina } from '../api/client'

export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function usePaginatedList(fetcher, filters = {}) {
  const key = JSON.stringify(filters)
  const [page, setPage] = useState(1)
  const [lastKey, setLastKey] = useState(key)
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const request = useRef(0)

  if (key !== lastKey) {
    setLastKey(key)
    setPage(1)
  }

  const reload = useCallback(async () => {
    const id = ++request.current
    setLoading(true)
    setError('')
    try {
      const response = await fetcher({ ...JSON.parse(key), page })
      if (id === request.current) setData(pagina(response.data))
    } catch (err) {
      if (id !== request.current) return
      if (err?.response?.status === 404 && page > 1) setPage(1)
      else setError(apiError(err))
    } finally {
      if (id === request.current) setLoading(false)
    }
  }, [fetcher, key, page])

  useEffect(() => { reload() }, [reload])

  return { ...data, page, setPage, loading, error, reload }
}

export function useResource(fetcher, id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setError('')
    try {
      const response = await fetcher(id)
      setData(response.data)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [fetcher, id])

  useEffect(() => { reload() }, [reload])

  return { data, setData, loading, error, reload }
}
