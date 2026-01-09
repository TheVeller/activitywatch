import { useQuery } from '@tanstack/react-query'
import type { AWEvent } from '../lib/types'
import {
  processActivityData,
  extractEventsByType,
  type ProcessedData,
} from '../lib/data-processor'
import { getTimeRange } from '../lib/stats'
import { getBuckets, getEvents } from '../lib/aw-api'

export function useActivityData(range: 'today' | '7d' | '14d' | '30d' = '14d') {
  const timeRange = getTimeRange(range)
  // Use toISOString() to format as UTC ISO string for ActivityWatch API
  const start = timeRange.start.toISOString()
  const end = timeRange.end.toISOString()
  
  // Fetch buckets
  const { data: buckets, isLoading: bucketsLoading, error: bucketsError } = useQuery({
    queryKey: ['buckets'],
    queryFn: getBuckets,
    staleTime: 60000,
    retry: 2,
  })
  
  // Process data
  const processedData = useQuery<ProcessedData>({
    queryKey: ['processed-data', range, start, end],
    queryFn: async () => {
      if (!buckets) return { sessions: [], appStats: [], appStatsMap: new Map(), topApps: [] }
      
      // Fetch events for all buckets
      const eventsByBucket = new Map<string, AWEvent[]>()
      await Promise.all(
        buckets.map(async (bucket) => {
          try {
            const events = await getEvents(bucket.id, { start, end })
            eventsByBucket.set(bucket.id, events)
          } catch (error) {
            console.warn(`Failed to fetch events for bucket ${bucket.id}:`, error)
            eventsByBucket.set(bucket.id, [])
          }
        })
      )
      
      // Extract by type
      const { windowEvents, browserEvents, afkEvents } = extractEventsByType(
        buckets,
        eventsByBucket
      )
      
      // Process
      return processActivityData(
        windowEvents,
        browserEvents,
        afkEvents,
        timeRange
      )
    },
    enabled: !bucketsLoading && buckets !== undefined,
    staleTime: 30000,
  })
  
  return {
    ...processedData,
    isLoading: bucketsLoading || processedData.isLoading,
    error: bucketsError || processedData.error,
  }
}
