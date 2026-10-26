import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Filters, search, page and tabs live in the URL so a refresh keeps the view. */
export function useUrlParams<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams()

  const values = Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [key, searchParams.get(key) ?? fallback]),
  ) as T

  const setParams = useCallback(
    (patch: Partial<T>, { resetPage = true }: { resetPage?: boolean } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(patch).forEach(([key, value]) => {
            if (value === undefined || value === '' || value === defaults[key]) next.delete(key)
            else next.set(key, value)
          })
          if (resetPage && !('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    // eslint-disable-next-line
    [setSearchParams],
  )

  return [values, setParams] as const
}
