import { useQuery } from '@tanstack/react-query'
import { getBuckets, type Bucket } from '../lib/aw-api'

export function useBuckets() {
  return useQuery<Bucket[]>({
    queryKey: ['buckets'],
    queryFn: getBuckets,
    staleTime: 60000, // 1 minute
  })
}
