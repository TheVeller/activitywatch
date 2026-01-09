import { useQuery } from '@tanstack/react-query'
import { getEvents, type Event, type QueryParams } from '../lib/aw-api'

export function useEvents(bucketId: string, params: QueryParams) {
  return useQuery<Event[]>({
    queryKey: ['events', bucketId, params.start, params.end],
    queryFn: () => getEvents(bucketId, params),
    enabled: !!bucketId && !!params.start && !!params.end,
    staleTime: 30000, // 30 seconds
  })
}
