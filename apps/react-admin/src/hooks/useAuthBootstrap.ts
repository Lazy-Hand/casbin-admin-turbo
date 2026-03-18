import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { bootstrapAuth } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

export function useAuthBootstrap(enabled: boolean) {
  const setBootstrapData = useAuthStore((state) => state.setBootstrapData)
  const clearSession = useAuthStore((state) => state.clearSession)

  const query = useQuery({
    queryKey: ['auth', 'bootstrap'],
    queryFn: bootstrapAuth,
    enabled,
    retry: 0,
  })

  useEffect(() => {
    if (query.data) {
      setBootstrapData(query.data)
    }
  }, [query.data, setBootstrapData])

  useEffect(() => {
    if (query.isError) {
      clearSession()
    }
  }, [clearSession, query.isError])

  return query
}
