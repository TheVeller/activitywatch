import { AppStats, Session } from './types'

export type TrophyRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Trophy {
  id: string
  name: string
  description: string
  appId: string
  rarity: TrophyRarity
  rule: TrophyRule
  unlockedAt?: Date
}

export interface TrophyRule {
  type: 'time' | 'streak' | 'sessions'
  threshold: number
  unit?: 'hours' | 'days' | 'sessions'
}

export interface TrophyProgress {
  trophy: Trophy
  current: number
  target: number
  progress: number // 0-100
  unlocked: boolean
  unlockedAt?: Date
}

/**
 * MVP Notion Trophy Pack
 */
export const NOTION_TROPHIES: Trophy[] = [
  {
    id: 'notion-hello',
    name: 'Hello, Notion',
    description: 'Spend 1 hour total in Notion',
    appId: 'notion',
    rarity: 'common',
    rule: {
      type: 'time',
      threshold: 1,
      unit: 'hours',
    },
  },
  {
    id: 'notion-daily-builder',
    name: 'Daily Builder',
    description: 'Use Notion 5 days in a row',
    appId: 'notion',
    rarity: 'rare',
    rule: {
      type: 'streak',
      threshold: 5,
      unit: 'days',
    },
  },
  {
    id: 'notion-deep-work-i',
    name: 'Deep Work I',
    description: 'Complete 5 focused sessions (≥25 min) in Notion',
    appId: 'notion',
    rarity: 'rare',
    rule: {
      type: 'sessions',
      threshold: 5,
      unit: 'sessions',
    },
  },
  {
    id: 'notion-deep-work-ii',
    name: 'Deep Work II',
    description: 'Complete 25 focused sessions (≥25 min) in Notion',
    appId: 'notion',
    rarity: 'epic',
    rule: {
      type: 'sessions',
      threshold: 25,
      unit: 'sessions',
    },
  },
  {
    id: 'notion-workspace-legend',
    name: 'Workspace Legend',
    description: 'Spend 50 hours total in Notion',
    appId: 'notion',
    rarity: 'legendary',
    rule: {
      type: 'time',
      threshold: 50,
      unit: 'hours',
    },
  },
]

/**
 * Evaluates trophy progress from app stats and sessions
 */
export function evaluateTrophyProgress(
  trophy: Trophy,
  appStats: AppStats | undefined,
  appSessions: Session[]
): TrophyProgress {
  if (!appStats) {
    return {
      trophy,
      current: 0,
      target: trophy.rule.threshold,
      progress: 0,
      unlocked: false,
    }
  }
  
  let current = 0
  
  switch (trophy.rule.type) {
    case 'time':
      // Convert milliseconds to hours
      current = appStats.totalTime / (1000 * 60 * 60)
      break
    case 'streak':
      current = appStats.streakDays
      break
    case 'sessions':
      current = appStats.focusedSessionCount
      break
  }
  
  const target = trophy.rule.threshold
  const progress = Math.min(100, (current / target) * 100)
  const unlocked = current >= target
  
  // Check if already unlocked (from localStorage)
  // Note: Persistence should be handled in useEffect, not during render
  const unlockedAt = getTrophyUnlockTime(trophy.id)
  const isUnlocked = unlocked || !!unlockedAt
  
  return {
    trophy,
    current,
    target,
    progress,
    unlocked: isUnlocked,
    unlockedAt: unlockedAt || undefined,
  }
}

/**
 * Gets all trophy progress for an app
 */
export function getAppTrophyProgress(
  appId: string,
  appStats: AppStats | undefined,
  appSessions: Session[]
): TrophyProgress[] {
  const appTrophies = NOTION_TROPHIES.filter((t) => t.appId === appId)
  
  return appTrophies.map((trophy) =>
    evaluateTrophyProgress(trophy, appStats, appSessions)
  )
}

/**
 * Gets all trophy progress
 */
export function getAllTrophyProgress(
  appStats: AppStats[] | Map<string, AppStats>,
  sessionsByApp: Map<string, Session[]>
): TrophyProgress[] {
  const allProgress: TrophyProgress[] = []
  
  // Convert appStats to Map if it's an array
  const appStatsMap = appStats instanceof Map 
    ? appStats 
    : new Map(appStats.map(stats => [stats.appId, stats]))
  
  // Group trophies by app
  const trophiesByApp = new Map<string, Trophy[]>()
  for (const trophy of NOTION_TROPHIES) {
    if (!trophiesByApp.has(trophy.appId)) {
      trophiesByApp.set(trophy.appId, [])
    }
    trophiesByApp.get(trophy.appId)!.push(trophy)
  }
  
  // Evaluate each app's trophies
  for (const [appId, trophies] of trophiesByApp.entries()) {
    const stats = appStatsMap.get(appId)
    const sessions = sessionsByApp.get(appId) || []
    
    for (const trophy of trophies) {
      allProgress.push(evaluateTrophyProgress(trophy, stats, sessions))
    }
  }
  
  return allProgress
}

/**
 * Saves trophy unlock time to localStorage
 */
export function saveTrophyUnlock(trophyId: string): void {
  const unlocks = getTrophyUnlocks()
  if (!unlocks[trophyId]) {
    unlocks[trophyId] = new Date().toISOString()
    localStorage.setItem('aw-trophy-unlocks', JSON.stringify(unlocks))
  }
}

/**
 * Gets trophy unlock time from localStorage
 */
export function getTrophyUnlockTime(trophyId: string): Date | undefined {
  const unlocks = getTrophyUnlocks()
  const unlockTime = unlocks[trophyId]
  return unlockTime ? new Date(unlockTime) : undefined
}

/**
 * Gets all trophy unlocks from localStorage
 */
function getTrophyUnlocks(): Record<string, string> {
  const stored = localStorage.getItem('aw-trophy-unlocks')
  if (!stored) return {}
  
  try {
    return JSON.parse(stored)
  } catch (error) {
    // Handle corrupted or invalid JSON data
    console.warn('Failed to parse trophy unlocks from localStorage:', error)
    // Clear corrupted data and return empty object
    localStorage.removeItem('aw-trophy-unlocks')
    return {}
  }
}

/**
 * Gets recently unlocked trophies
 */
export function getRecentlyUnlockedTrophies(
  limit: number = 10
): TrophyProgress[] {
  const allUnlocks = getTrophyUnlocks()
  const unlocked = Object.entries(allUnlocks)
    .map(([trophyId, unlockTime]) => {
      const trophy = NOTION_TROPHIES.find((t) => t.id === trophyId)
      if (!trophy) return null
      
      const target = trophy.rule.threshold
      // Since trophy is unlocked, current must be >= target
      // We'll set current to target (minimum value for unlock)
      const current = target
      const progress = 100 // Fully unlocked
      
      return {
        trophy,
        current,
        target,
        progress,
        unlocked: true,
        unlockedAt: new Date(unlockTime),
      } as TrophyProgress
    })
    .filter((p): p is TrophyProgress => p !== null)
    .sort((a, b) => {
      const timeA = a.unlockedAt?.getTime() || 0
      const timeB = b.unlockedAt?.getTime() || 0
      return timeB - timeA // Most recent first
    })
    .slice(0, limit)
  
  return unlocked
}
