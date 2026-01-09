import { AWEvent, Session, AppStats, TimeRange } from './types'
import {
  mergeAppEvents,
  getAppIdFromWindowEvent,
  getAppIdFromBrowserEvent,
} from './app-normalization'
import {
  createAppSessions,
  SessionizationConfig,
  DEFAULT_CONFIG as DEFAULT_SESSION_CONFIG,
} from './sessionization'
import { calculateAppStats, getTopApps } from './stats'

export interface ProcessedData {
  sessions: Session[]
  appStats: AppStats[] // Array instead of Map for React state serialization
  appStatsMap: Map<string, AppStats> // Keep Map for internal use
  topApps: AppStats[]
}

/**
 * Processes raw AW events into sessions and stats
 */
export async function processActivityData(
  windowEvents: AWEvent[],
  browserEvents: AWEvent[],
  afkEvents: AWEvent[],
  timeRange?: TimeRange,
  sessionConfig: SessionizationConfig = DEFAULT_SESSION_CONFIG
): Promise<ProcessedData> {
  // Merge app events
  const appEventsMap = mergeAppEvents(windowEvents, browserEvents)
  
  // Create sessions for each app
  const allSessions: Session[] = []
  const appStatsMap = new Map<string, AppStats>()
  
  for (const [appId, events] of appEventsMap.entries()) {
    const appSessions = createAppSessions(
      appId,
      events,
      afkEvents,
      sessionConfig
    )
    
    allSessions.push(...appSessions)
    
    // Calculate stats for this app
    const stats = calculateAppStats(appId, appSessions, timeRange)
    appStatsMap.set(appId, stats)
  }
  
  // Get top apps
  const topApps = getTopApps(appStatsMap, 10)
  
  // Convert Map to array for React state serialization
  const appStatsArray = Array.from(appStatsMap.values())
  
  return {
    sessions: allSessions,
    appStats: appStatsArray,
    appStatsMap, // Keep Map for internal operations
    topApps,
  }
}

/**
 * Helper to extract events from buckets by type
 */
export function extractEventsByType(
  buckets: Array<{ id: string; type: string }>,
  eventsByBucket: Map<string, AWEvent[]>
): {
  windowEvents: AWEvent[]
  browserEvents: AWEvent[]
  afkEvents: AWEvent[]
} {
  const windowEvents: AWEvent[] = []
  const browserEvents: AWEvent[] = []
  const afkEvents: AWEvent[] = []
  
  for (const bucket of buckets) {
    const events = eventsByBucket.get(bucket.id) || []
    
    if (bucket.type === 'currentwindow' || bucket.id.includes('aw-watcher-window')) {
      windowEvents.push(...events)
    } else if (bucket.type === 'web.tab.current' || bucket.id.includes('aw-watcher-web')) {
      browserEvents.push(...events)
    } else if (bucket.type === 'afkstatus' || bucket.id.includes('aw-watcher-afk')) {
      afkEvents.push(...events)
    }
  }
  
  return { windowEvents, browserEvents, afkEvents }
}
