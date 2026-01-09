import { AppStats, Session } from './types'
import { TrophyProgress } from './trophies'

/**
 * XP constants
 */
export const XP_PER_HOUR = 10
export const XP_PER_TROPHY: Record<string, number> = {
  common: 50,
  rare: 100,
  epic: 250,
  legendary: 500,
}

/**
 * Level calculation: XP required for level N = 100 * N^1.5
 */
export function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

/**
 * Gets level from total XP
 */
export function getLevelFromXP(totalXP: number): number {
  // Check if user has enough XP for level 1
  if (totalXP < getXPForLevel(1)) {
    return 0
  }
  
  let level = 1
  while (getXPForLevel(level + 1) <= totalXP) {
    level++
  }
  return level
}

/**
 * Gets XP progress within current level
 */
export function getXPProgress(totalXP: number): {
  level: number
  currentLevelXP: number
  nextLevelXP: number
  progress: number // 0-100
} {
  const level = getLevelFromXP(totalXP)
  const currentLevelXP = level === 0 ? 0 : getXPForLevel(level)
  const nextLevelXP = getXPForLevel(level + 1)
  const progress =
    level === 0
      ? (totalXP / nextLevelXP) * 100
      : ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
  
  return {
    level,
    currentLevelXP,
    nextLevelXP,
    progress: Math.max(0, Math.min(100, progress)),
  }
}

/**
 * Calculates total XP from stats and trophies
 */
export function calculateTotalXP(
  appStats: AppStats[] | Map<string, AppStats>,
  trophyProgress: TrophyProgress[]
): number {
  let xp = 0
  
  // XP from time spent (all apps)
  const statsArray = appStats instanceof Map ? Array.from(appStats.values()) : appStats
  for (const stats of statsArray) {
    const hours = stats.totalTime / (1000 * 60 * 60)
    xp += hours * XP_PER_HOUR
  }
  
  // XP from unlocked trophies
  for (const progress of trophyProgress) {
    if (progress.unlocked) {
      const trophyXP = XP_PER_TROPHY[progress.trophy.rarity] || 0
      xp += trophyXP
    }
  }
  
  return Math.floor(xp)
}

/**
 * Gets featured trophy (most recent unlock or closest to unlock)
 */
export function getFeaturedTrophy(
  trophyProgress: TrophyProgress[]
): TrophyProgress | null {
  // First, try to find most recent unlock
  const unlocked = trophyProgress
    .filter((p) => p.unlocked && p.unlockedAt)
    .sort((a, b) => {
      const timeA = a.unlockedAt?.getTime() || 0
      const timeB = b.unlockedAt?.getTime() || 0
      return timeB - timeA
    })
  
  if (unlocked.length > 0) {
    return unlocked[0]
  }
  
  // Otherwise, find closest to unlock (highest progress, not unlocked)
  const inProgress = trophyProgress
    .filter((p) => !p.unlocked && p.progress > 0)
    .sort((a, b) => b.progress - a.progress)
  
  return inProgress.length > 0 ? inProgress[0] : null
}
