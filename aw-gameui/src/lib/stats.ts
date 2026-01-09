import { Session, AppStats, TimeRange } from './types'
import { format, startOfDay, isSameDay } from 'date-fns'

/**
 * Calculates stats for an app from sessions
 */
export function calculateAppStats(
  appId: string,
  sessions: Session[],
  timeRange?: TimeRange
): AppStats {
  // Filter sessions by time range if provided
  // Include any session that overlaps with the time range
  const filteredSessions = timeRange
    ? sessions.filter(
        (s) =>
          s.start < timeRange.end &&
          s.end > timeRange.start
      )
    : sessions
  
  if (filteredSessions.length === 0) {
    return {
      appId,
      totalTime: 0,
      sessionCount: 0,
      focusedSessionCount: 0,
      streakDays: 0,
    }
  }
  
  const totalTime = filteredSessions.reduce(
    (sum, s) => sum + s.duration,
    0
  )
  
  const focusedSessionCount = filteredSessions.filter((s) => s.isFocused).length
  
  const lastActive = filteredSessions.length > 0
    ? new Date(Math.max(...filteredSessions.map((s) => s.end.getTime())))
    : undefined
  
  // Calculate streak (consecutive days with activity)
  const streakDays = calculateStreak(filteredSessions)
  
  return {
    appId,
    totalTime,
    sessionCount: filteredSessions.length,
    focusedSessionCount,
    lastActive,
    streakDays,
  }
}

/**
 * Calculates consecutive days streak from sessions
 */
function calculateStreak(sessions: Session[]): number {
  if (sessions.length === 0) {
    return 0
  }
  
  // Get unique days with activity
  const activeDays = new Set<string>()
  for (const session of sessions) {
    const dayKey = format(startOfDay(session.start), 'yyyy-MM-dd')
    activeDays.add(dayKey)
  }
  
  // Sort days descending
  // Parse date strings as local dates, not UTC
  const sortedDays = Array.from(activeDays)
    .map((d) => {
      const [year, month, day] = d.split('-').map(Number)
      return new Date(year, month - 1, day) // Local date constructor
    })
    .sort((a, b) => b.getTime() - a.getTime())
  
  if (sortedDays.length === 0) {
    return 0
  }
  
  // Check if today or yesterday is included (streak is from most recent)
  const today = startOfDay(new Date())
  const yesterday = startOfDay(
    new Date(today.getTime() - 24 * 60 * 60 * 1000)
  )
  
  // Streak must include today or yesterday
  const mostRecentDay = sortedDays[0]
  if (
    !isSameDay(mostRecentDay, today) &&
    !isSameDay(mostRecentDay, yesterday)
  ) {
    return 0 // Streak broken
  }
  
  // Count consecutive days
  let streak = 1
  for (let i = 1; i < sortedDays.length; i++) {
    const expectedDay = startOfDay(
      new Date(sortedDays[i - 1].getTime() - 24 * 60 * 60 * 1000)
    )
    if (isSameDay(sortedDays[i], expectedDay)) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

/**
 * Gets top apps by total time
 */
export function getTopApps(
  appStats: Map<string, AppStats>,
  limit: number = 10
): AppStats[] {
  return Array.from(appStats.values())
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, limit)
}

/**
 * Creates time range helpers
 */
export function getTimeRange(range: 'today' | '7d' | '14d' | '30d' | 'custom', customStart?: Date, customEnd?: Date): TimeRange {
  const now = new Date()
  
  switch (range) {
    case 'today':
      return {
        start: startOfDay(now),
        end: now,
      }
    case '7d':
      return {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now,
      }
    case '14d':
      return {
        start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        end: now,
      }
    case '30d':
      return {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
      }
    case 'custom':
      if (customStart && customEnd) {
        return { start: customStart, end: customEnd }
      }
      return { start: startOfDay(now), end: now }
    default:
      return { start: startOfDay(now), end: now }
  }
}
