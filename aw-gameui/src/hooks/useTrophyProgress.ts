import { useMemo, useEffect, useState, useRef } from 'react'
import { getAllTrophyProgress, saveTrophyUnlock, getTrophyUnlockTime, type TrophyProgress } from '../lib/trophies'
import type { AppStats, Session } from '../lib/types'

/**
 * Hook that evaluates trophy progress and persists newly unlocked trophies
 * Separates evaluation (pure) from persistence (side effect)
 */
export function useTrophyProgress(
  appStats: AppStats[] | Map<string, AppStats> | undefined,
  sessionsByApp: Map<string, Session[]>
) {
  // Track persisted unlocks to update unlockedAt timestamps
  const [persistedUnlocks, setPersistedUnlocks] = useState<Record<string, Date>>({})
  // Track which trophy IDs have been persisted to avoid circular dependency
  const persistedIdsRef = useRef<Set<string>>(new Set())
  
  // Pure evaluation - no side effects (evaluate before merging persisted unlocks)
  const evaluatedProgress = useMemo(() => {
    if (!appStats) return []
    return getAllTrophyProgress(appStats, sessionsByApp)
  }, [appStats, sessionsByApp])
  
  // Merge with persisted unlock timestamps
  const trophyProgress = useMemo(() => {
    return evaluatedProgress.map((p) => {
      const persistedAt = persistedUnlocks[p.trophy.id]
      if (persistedAt) {
        return { ...p, unlockedAt: persistedAt }
      }
      return p
    })
  }, [evaluatedProgress, persistedUnlocks])
  
  // Persist newly unlocked trophies in useEffect (side effect)
  // Use evaluatedProgress instead of trophyProgress to avoid circular dependency
  useEffect(() => {
    const newlyPersisted: Record<string, Date> = {}
    let hasNewUnlocks = false
    
    for (const progress of evaluatedProgress) {
      const trophyId = progress.trophy.id
      // Check if trophy is newly unlocked (unlocked but not in localStorage and not already persisted)
      if (
        progress.unlocked &&
        !getTrophyUnlockTime(trophyId) &&
        !persistedIdsRef.current.has(trophyId)
      ) {
        saveTrophyUnlock(trophyId)
        const unlockTime = getTrophyUnlockTime(trophyId)
        if (unlockTime) {
          newlyPersisted[trophyId] = unlockTime
          persistedIdsRef.current.add(trophyId)
          hasNewUnlocks = true
        }
      }
    }
    
    if (hasNewUnlocks) {
      setPersistedUnlocks((prev) => ({ ...prev, ...newlyPersisted }))
    }
  }, [evaluatedProgress]) // Only depend on evaluatedProgress, not trophyProgress or persistedUnlocks
  
  return trophyProgress
}
