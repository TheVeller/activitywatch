import { AWEvent, Session, TimeRange } from './types'

export interface SessionizationConfig {
  gapToleranceMinutes: number // Merge sessions if gap <= this
  minSessionMinutes: number // Drop sessions shorter than this
  focusedSessionMinutes: number // Sessions >= this are "focused"
}

export const DEFAULT_CONFIG: SessionizationConfig = {
  gapToleranceMinutes: 5,
  minSessionMinutes: 2,
  focusedSessionMinutes: 25,
}

/**
 * Converts events into sessions, excluding AFK time
 */
export function sessionizeEvents(
  events: AWEvent[],
  afkEvents: AWEvent[],
  config: SessionizationConfig = DEFAULT_CONFIG
): Session[] {
  if (events.length === 0) {
    return []
  }
  
  // Sort events by timestamp
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  
  // Create AFK intervals - only include periods when user is AFK
  // ActivityWatch AFK events have status: 'afk' or 'not-afk' in data.status (always a string)
  const afkIntervals: TimeRange[] = afkEvents
    .filter((e) => {
      const status = e.data.status
      // Status is always a string in ActivityWatch: 'afk' or 'not-afk'
      return typeof status === 'string' && status.toLowerCase() === 'afk'
    })
    .map((e) => ({
      start: new Date(e.timestamp),
      end: new Date(new Date(e.timestamp).getTime() + (e.duration || 0) * 1000),
    }))
    .filter((interval) => !isNaN(interval.start.getTime()) && !isNaN(interval.end.getTime()))
  
  const sessions: Session[] = []
  let currentSession: Session | null = null
  
  for (const event of sortedEvents) {
    // Validate event has required fields
    if (!event.timestamp || typeof event.duration !== 'number' || isNaN(event.duration)) {
      continue
    }
    
    const eventStart = new Date(event.timestamp)
    const eventEnd = new Date(eventStart.getTime() + (event.duration || 0) * 1000)
    
    // Skip invalid dates
    if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
      continue
    }
    
    // Check if event overlaps with AFK
    const activeDuration = calculateActiveDuration(
      eventStart,
      eventEnd,
      afkIntervals
    )
    
    if (activeDuration < config.minSessionMinutes * 60 * 1000) {
      continue // Skip sessions shorter than minimum
    }
    
    // Check if we should merge with current session
    if (
      currentSession &&
      eventStart.getTime() - currentSession.end.getTime() <=
        config.gapToleranceMinutes * 60 * 1000
    ) {
      // Merge: extend current session
      // Calculate gap duration (time between sessions, minus AFK)
      const gapStart = currentSession.end
      const gapEnd = eventStart
      const gapDuration = calculateActiveDuration(gapStart, gapEnd, afkIntervals)
      
      currentSession.end = eventEnd
      // Include both gap time and new event's active duration
      currentSession.duration += gapDuration + activeDuration
      // Recalculate isFocused after merging (duration may have crossed threshold)
      currentSession.isFocused =
        currentSession.duration >= config.focusedSessionMinutes * 60 * 1000
    } else {
      // Start new session
      if (currentSession) {
        sessions.push(currentSession)
      }
      
      const sessionDuration = activeDuration
      const isFocused =
        sessionDuration >= config.focusedSessionMinutes * 60 * 1000
      
      currentSession = {
        appId: '', // Will be set by caller
        start: eventStart,
        end: eventEnd,
        duration: sessionDuration,
        isFocused,
      }
    }
  }
  
  // Add final session
  if (currentSession) {
    sessions.push(currentSession)
  }
  
  return sessions
}

/**
 * Calculates active (non-AFK) duration within a time range
 */
function calculateActiveDuration(
  start: Date,
  end: Date,
  afkIntervals: TimeRange[]
): number {
  let activeDuration = end.getTime() - start.getTime()
  
  for (const afk of afkIntervals) {
    const overlapStart = Math.max(start.getTime(), afk.start.getTime())
    const overlapEnd = Math.min(end.getTime(), afk.end.getTime())
    
    if (overlapStart < overlapEnd) {
      activeDuration -= overlapEnd - overlapStart
    }
  }
  
  return Math.max(0, activeDuration)
}

/**
 * Creates sessions for a specific app from events
 */
export function createAppSessions(
  appId: string,
  events: AWEvent[],
  afkEvents: AWEvent[],
  config: SessionizationConfig = DEFAULT_CONFIG
): Session[] {
  const sessions = sessionizeEvents(events, afkEvents, config)
  
  // Set appId on all sessions
  return sessions.map((s) => ({ ...s, appId }))
}
