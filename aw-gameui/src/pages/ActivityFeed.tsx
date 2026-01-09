import { useMemo, useState, useEffect, useRef } from 'react'
import { useActivityData } from '../hooks/useActivityData'
import { getRecentlyUnlockedTrophies } from '../lib/trophies'
import { format } from 'date-fns'

export default function ActivityFeed() {
  const { data: activityData, isLoading, error } = useActivityData('30d')
  
  // Track localStorage changes for trophy unlocks
  const [trophyUnlockKey, setTrophyUnlockKey] = useState(0)
  const previousValueRef = useRef<string | null>(null)
  
  useEffect(() => {
    // Initialize previous value
    previousValueRef.current = localStorage.getItem('aw-trophy-unlocks')
    
    // Listen for storage events (when localStorage changes in other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aw-trophy-unlocks') {
        previousValueRef.current = e.newValue
        setTrophyUnlockKey((prev) => prev + 1)
      }
    }
    
    // Also poll localStorage periodically to catch changes in same tab
    // Only update if the value actually changed
    const interval = setInterval(() => {
      const current = localStorage.getItem('aw-trophy-unlocks')
      if (current !== previousValueRef.current) {
        previousValueRef.current = current
        setTrophyUnlockKey((prev) => prev + 1)
      }
    }, 1000) // Check every second
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])
  
  const recentTrophies = useMemo(() => getRecentlyUnlockedTrophies(10), [trophyUnlockKey])
  
  const recentSessions = useMemo(() => {
    if (!activityData) return []
    return [...activityData.sessions]
      .sort((a, b) => b.start.getTime() - a.start.getTime())
      .slice(0, 20)
  }, [activityData])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="glass-panel p-6">
        <h1 className="text-3xl font-bold mb-4">Activity Feed</h1>
        <p className="text-red-400">Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h1 className="text-3xl font-bold mb-6">Activity Feed</h1>
        
        {/* Recent Trophy Unlocks */}
        {recentTrophies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Recent Trophy Unlocks</h2>
            <div className="space-y-3">
              {recentTrophies.map((trophy) => (
                <div
                  key={trophy.trophy.id}
                  className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg"
                >
                  <div className="text-3xl">🏆</div>
                  <div className="flex-1">
                    <div className="font-semibold">{trophy.trophy.name}</div>
                    <div className="text-sm text-gray-400">
                      {trophy.unlockedAt
                        ? format(trophy.unlockedAt, 'MMM d, yyyy h:mm a')
                        : 'Recently'}
                    </div>
                  </div>
                  <div className="text-green-400">✓</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recent Sessions */}
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Sessions</h2>
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => {
                const durationHours = session.duration / (1000 * 60 * 60)
                // Use stable unique key: appId + start timestamp
                const sessionKey = `${session.appId}-${session.start.getTime()}`
                return (
                  <div
                    key={sessionKey}
                    className="flex items-center gap-4 p-4 bg-black/30 border border-white/10 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-lg">
                      {session.appId.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{session.appId}</div>
                      <div className="text-sm text-gray-400">
                        {format(session.start, 'MMM d, h:mm a')} - {format(session.end, 'h:mm a')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{durationHours.toFixed(2)}h</div>
                      {session.isFocused && (
                        <div className="text-xs text-green-400">Focused</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No recent sessions found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
