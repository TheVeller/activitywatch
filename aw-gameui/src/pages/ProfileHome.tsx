import { useMemo } from 'react'
import { useActivityData } from '../hooks/useActivityData'
import { useTrophyProgress } from '../hooks/useTrophyProgress'
import { calculateTotalXP, getXPProgress, getFeaturedTrophy } from '../lib/xp-level'

export default function ProfileHome() {
  const { data: activityData, isLoading, error } = useActivityData('14d')
  
  // Build sessionsByApp map
  const sessionsByApp = useMemo(() => {
    if (!activityData) return new Map()
    
    const map = new Map<string, typeof activityData.sessions>()
    for (const session of activityData.sessions) {
      if (!map.has(session.appId)) {
        map.set(session.appId, [])
      }
      map.get(session.appId)!.push(session)
    }
    return map
  }, [activityData])
  
  // Stabilize appStatsMap reference to avoid unnecessary recalculations
  const appStatsMap = useMemo(() => {
    return activityData?.appStatsMap || new Map()
  }, [activityData?.appStatsMap])
  
  // Use hook that handles trophy evaluation and persistence
  const trophyProgress = useTrophyProgress(
    appStatsMap,
    sessionsByApp
  )
  
  const totalXP = useMemo(() => {
    if (!activityData) return 0
    return calculateTotalXP(activityData.appStatsMap || new Map(), trophyProgress)
  }, [activityData, trophyProgress])
  
  const xpProgress = useMemo(() => getXPProgress(totalXP), [totalXP])
  
  const featuredTrophy = useMemo(() => getFeaturedTrophy(trophyProgress), [trophyProgress])
  
  const totalHours = useMemo(() => {
    if (!activityData) return 0
    let total = 0
    for (const stats of activityData.appStats) {
      total += stats.totalTime
    }
    return total / (1000 * 60 * 60)
  }, [activityData])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading activity data...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass-panel p-6 max-w-md">
          <h2 className="text-xl font-bold mb-2 text-red-400">Error Loading Data</h2>
          <p className="text-gray-400 text-sm">
            {error instanceof Error ? error.message : 'Failed to connect to ActivityWatch server'}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Make sure ActivityWatch server is running on port 5600
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="glass-panel p-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-4xl">
            👤
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
            <div className="flex items-center gap-4 mt-4">
              <div className="px-4 py-2 bg-neon-purple/20 border border-neon-purple/50 rounded-lg">
                <span className="text-sm text-gray-400">Level</span>
                <div className="text-2xl font-bold neon-purple">{xpProgress.level}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">XP</span>
                  <span className="text-sm text-gray-400">
                    {totalXP.toLocaleString()} / {xpProgress.nextLevelXP.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-neon-purple to-neon-pink transition-all duration-300"
                    style={{ width: `${xpProgress.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Featured Trophy */}
      {featuredTrophy && (
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-4">Featured Trophy</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-3xl">
              🏆
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{featuredTrophy.trophy.name}</h3>
              <p className="text-sm text-gray-400">{featuredTrophy.trophy.description}</p>
              {featuredTrophy.unlocked ? (
                <div className="text-sm text-green-400 mt-2">✓ Unlocked</div>
              ) : (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">
                      {featuredTrophy.current.toFixed(1)} / {featuredTrophy.target}
                    </span>
                    <span className="text-xs text-gray-500">
                      {featuredTrophy.progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neon-purple to-neon-pink"
                      style={{ width: `${featuredTrophy.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6">
          <div className="text-sm text-gray-400 mb-1">Past 2 Weeks</div>
          <div className="text-3xl font-bold neon-blue">
            {totalHours.toFixed(1)} <span className="text-lg text-gray-400">hours</span>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="text-sm text-gray-400 mb-1">Top Apps</div>
          <div className="text-3xl font-bold neon-pink">
            {activityData?.topApps.length || 0} <span className="text-lg text-gray-400">apps</span>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="text-sm text-gray-400 mb-1">Trophies Unlocked</div>
          <div className="text-3xl font-bold neon-purple">
            {trophyProgress.filter((t) => t.unlocked).length} <span className="text-lg text-gray-400">/ {trophyProgress.length}</span>
          </div>
        </div>
      </div>
      
      {/* Top Apps */}
      {activityData && activityData.topApps.length > 0 && (
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-4">Top Apps</h2>
          <div className="space-y-2">
            {activityData.topApps.slice(0, 5).map((app) => {
              const hours = app.totalTime / (1000 * 60 * 60)
              return (
                <div key={app.appId} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <div>
                    <div className="font-medium">{app.appId}</div>
                    <div className="text-sm text-gray-400">
                      {app.sessionCount} sessions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{hours.toFixed(1)}h</div>
                    {app.streakDays > 0 && (
                      <div className="text-xs text-gray-400">{app.streakDays} day streak</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
