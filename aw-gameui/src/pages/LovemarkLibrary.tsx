import { Link } from 'react-router-dom'
import { useActivityData } from '../hooks/useActivityData'

export default function LovemarkLibrary() {
  const { data: activityData, isLoading, error } = useActivityData('30d')
  
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
        <h1 className="text-3xl font-bold mb-4">Lovemark Library</h1>
        <p className="text-red-400">Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }
  
  if (!activityData || activityData.topApps.length === 0) {
    return (
      <div className="glass-panel p-6">
        <h1 className="text-3xl font-bold mb-4">Lovemark Library</h1>
        <p className="text-gray-400">No apps tracked yet. Start using your apps to see them here!</p>
      </div>
    )
  }
  
  const apps = [...activityData.appStats]
    .sort((a, b) => b.totalTime - a.totalTime)
  
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h1 className="text-3xl font-bold mb-6">Lovemark Library</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => {
            const hours = app.totalTime / (1000 * 60 * 60)
            const lastActive = app.lastActive
              ? new Date(app.lastActive).toLocaleDateString()
              : 'Never'
            
            return (
              <Link
                key={app.appId}
                to={`/app/${app.appId}`}
                className="glass-panel p-4 hover:border-neon-purple/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-2xl">
                    {app.appId.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{app.appId}</h3>
                    <div className="text-sm text-gray-400 mt-1">
                      {hours.toFixed(1)}h playtime
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {app.streakDays > 0 && (
                        <span className="text-green-400">🔥 {app.streakDays} day streak</span>
                      )}
                      {app.streakDays === 0 && (
                        <span>Last active: {lastActive}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
