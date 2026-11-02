import { QueryClient } from '@tanstack/react-query'
import { QUERY_STALE_TIME_MS } from '@/config/constants'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 0, staleTime: QUERY_STALE_TIME_MS },
  },
})
