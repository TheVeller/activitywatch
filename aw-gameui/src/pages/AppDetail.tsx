import { useParams } from 'react-router-dom'
import { useActivityData } from '../hooks/useActivityData'
import { getAppTrophyProgress, saveTrophyUnlock, getTrophyUnlockTime } from '../lib/trophies'
import { useMemo, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AppDetail() {
  const { appId } = useParams<{ appId: string }>()
  const { data: activityData, isLoading, error } = useActivityData('30d')
  
  const appStats = useMemo(() => {
    if (!activityData || !appId) return undefined
    return activityData.appStats.find((stats) => stats.appId === appId)
  }, [activityData, appId])
  
  const appSessions = useMemo(() => {
    if (!activityData || !appId) return []
    return activityData.sessions.filter((s) => s.appId === appId)
  }, [activityData, appId])
  
  const trophyProgress = useMemo(() => {
    if (!appId) return []
    return getAppTrophyProgress(appId, appStats, appSessions)
  }, [appId, appStats, appSessions])
  
  // Persist newly unlocked trophies in useEffect (side effect)
  useEffect(() => {
    for (const progress of trophyProgress) {
      // Check if trophy is newly unlocked (unlocked but not in localStorage)
      if (progress.unlocked && !getTrophyUnlockTime(progress.trophy.id)) {
        saveTrophyUnlock(progress.trophy.id)
      }
    }
  }, [trophyProgress])
  
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
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-red-400">{error instanceof Error ? error.message : 'Failed to load data'}</p>
      </div>
    )
  }
  
  if (!appId || !appStats) {
    return (
      <div className="glass-panel p-6">
        <h1 className="text-3xl font-bold mb-4">App Not Found</h1>
        <p className="text-gray-400">This app hasn't been tracked yet.</p>
      </div>
    )
  }
  
  const hours = appStats.totalTime / (1000 * 60 * 60)
  
  // Prepare chart data (daily hours for last 14 days)
  const chartData = useMemo(() => {
    // Helper to get local date string in YYYY-MM-DD format
    const getLocalDateString = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const days: Record<string, number> = {}
    const now = new Date()
    
    // Initialize last 14 days using local dates
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const key = getLocalDateString(date)
      days[key] = 0
    }
    
    // Sum sessions by day using local dates
    for (const session of appSessions) {
      const key = getLocalDateString(new Date(session.start))
      if (days[key] !== undefined) {
        days[key] += session.duration / (1000 * 60 * 60)
      }
    }
    
    return Object.entries(days).map(([dateStr, hours]) => {
      // Parse date string as local date, not UTC
      const [year, month, day] = dateStr.split('-').map(Number)
      const date = new Date(year, month - 1, day) // Local date constructor
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: Number(hours.toFixed(2)),
      }
    })
  }, [appSessions])
  
  return (
    <div className="space-y-6">
      {/* App Header */}
      <div className="glass-panel p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-4xl">
            {appId.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{appId}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-400">Total Time</div>
                <div className="text-2xl font-bold neon-blue">{hours.toFixed(1)}h</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Sessions</div>
                <div className="text-2xl font-bold neon-pink">{appStats.sessionCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Focused</div>
                <div className="text-2xl font-bold neon-purple">{appStats.focusedSessionCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Streak</div>
                <div className="text-2xl font-bold text-green-400">{appStats.streakDays} days</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold mb-4">Daily Activity (Last 14 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px',
              }}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#a855f7"
              strokeWidth={2}
              dot={{ fill: '#a855f7', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Trophies */}
      {trophyProgress.length > 0 && (
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-4">Trophies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trophyProgress.map((progress) => (
              <div
                key={progress.trophy.id}
                className={`p-4 rounded-lg border ${
                  progress.unlocked
                    ? 'bg-green-500/10 border-green-500/50'
                    : 'bg-black/30 border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🏆</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{progress.trophy.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {progress.trophy.description}
                    </p>
                    {progress.unlocked ? (
                      <div className="text-sm text-green-400 mt-2">✓ Unlocked</div>
                    ) : (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            {progress.current.toFixed(1)} / {progress.target}
                          </span>
                          <span className="text-xs text-gray-500">
                            {progress.progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-neon-purple to-neon-pink"
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
