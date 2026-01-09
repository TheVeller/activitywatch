import { useMemo, useState } from 'react'
import { useActivityData } from '../hooks/useActivityData'
import { useTrophyProgress } from '../hooks/useTrophyProgress'
import { type TrophyRarity } from '../lib/trophies'

const RARITY_COLORS: Record<TrophyRarity, string> = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
}

export default function TrophyRoom() {
  const { data: activityData, isLoading, error } = useActivityData('30d')
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')
  const [rarityFilter, setRarityFilter] = useState<TrophyRarity | 'all'>('all')
  
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
  
  const filteredTrophies = useMemo(() => {
    let filtered = trophyProgress
    
    if (filter === 'unlocked') {
      filtered = filtered.filter((t) => t.unlocked)
    } else if (filter === 'locked') {
      filtered = filtered.filter((t) => !t.unlocked)
    }
    
    if (rarityFilter !== 'all') {
      filtered = filtered.filter((t) => t.trophy.rarity === rarityFilter)
    }
    
    return filtered
  }, [trophyProgress, filter, rarityFilter])
  
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
        <h1 className="text-3xl font-bold mb-4">Trophy Room</h1>
        <p className="text-red-400">Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }
  
  const unlockedCount = trophyProgress.filter((t) => t.unlocked).length
  const totalCount = trophyProgress.length
  
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h1 className="text-3xl font-bold mb-4">Trophy Room</h1>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-lg">
            <span className="neon-purple font-bold">{unlockedCount}</span>
            <span className="text-gray-400"> / {totalCount} unlocked</span>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-neon-purple/20 border border-neon-purple/50'
                  : 'bg-black/30 border border-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'unlocked'
                  ? 'bg-neon-purple/20 border border-neon-purple/50'
                  : 'bg-black/30 border border-white/10'
              }`}
            >
              Unlocked
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'locked'
                  ? 'bg-neon-purple/20 border border-neon-purple/50'
                  : 'bg-black/30 border border-white/10'
              }`}
            >
              Locked
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setRarityFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm ${
                rarityFilter === 'all'
                  ? 'bg-neon-purple/20 border border-neon-purple/50'
                  : 'bg-black/30 border border-white/10'
              }`}
            >
              All Rarities
            </button>
            {(['common', 'rare', 'epic', 'legendary'] as TrophyRarity[]).map((rarity) => (
              <button
                key={rarity}
                onClick={() => setRarityFilter(rarity)}
                className={`px-4 py-2 rounded-lg text-sm capitalize ${
                  rarityFilter === rarity
                    ? 'bg-neon-purple/20 border border-neon-purple/50'
                    : 'bg-black/30 border border-white/10'
                }`}
              >
                {rarity}
              </button>
            ))}
          </div>
        </div>
        
        {/* Trophy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrophies.map((progress) => (
            <div
              key={progress.trophy.id}
              className={`p-4 rounded-lg border ${
                progress.unlocked
                  ? 'bg-green-500/10 border-green-500/50'
                  : 'bg-black/30 border-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-4xl">🏆</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{progress.trophy.name}</h3>
                    <span className={`text-xs ${RARITY_COLORS[progress.trophy.rarity]}`}>
                      {progress.trophy.rarity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{progress.trophy.description}</p>
                  {progress.unlocked ? (
                    <div className="text-sm text-green-400">✓ Unlocked</div>
                  ) : (
                    <div>
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
        
        {filteredTrophies.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No trophies match the selected filters.
          </div>
        )}
      </div>
    </div>
  )
}
