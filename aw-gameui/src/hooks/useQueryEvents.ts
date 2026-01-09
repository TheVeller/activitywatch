import { useQuery } from '@tanstack/react-query'
import { queryEvents, type Event } from '../lib/aw-api'

export function useQueryEvents(query: string, enabled = true) {
  return useQuery<Event[]>({
    queryKey: ['query-events', query],
    queryFn: () => queryEvents(query),
    enabled: enabled && !!query,
    staleTime: 30000, // 30 seconds
  })
}
