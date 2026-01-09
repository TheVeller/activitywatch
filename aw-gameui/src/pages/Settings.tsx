import { useState, useEffect, type ChangeEvent } from 'react'
import { setServerUrl } from '../lib/aw-api'

const DEFAULT_SERVER_URL = 'http://localhost:5600'

function getServerUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('aw-server-url')
    return stored || DEFAULT_SERVER_URL
  }
  return DEFAULT_SERVER_URL
}

function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return false
  try {
    const parsed = new URL(url)
    // Must have http or https protocol
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function Settings() {
  const [serverUrl, setServerUrlState] = useState(getServerUrl())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setServerUrlState(getServerUrl())
  }, [])

  const handleSave = () => {
    const trimmedUrl = serverUrl.trim()
    
    if (!trimmedUrl) {
      setError('URL cannot be empty')
      return
    }
    
    if (!isValidUrl(trimmedUrl)) {
      setError('Please enter a valid URL (e.g., http://localhost:5600)')
      return
    }
    
    setError(null)
    setServerUrl(trimmedUrl)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ActivityWatch Server URL
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setServerUrlState(e.target.value)
                setError(null) // Clear error when user types
              }}
              className={`w-full px-4 py-2 bg-black/50 border rounded-lg text-white focus:outline-none ${
                error
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-white/10 focus:border-neon-purple'
              }`}
              placeholder="http://localhost:5600"
            />
            {error && (
              <p className="text-xs text-red-400 mt-1">{error}</p>
            )}
            {!error && (
              <p className="text-xs text-gray-500 mt-1">
                Default: http://localhost:5600
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            className="px-6 py-2 bg-neon-purple hover:bg-purple-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!error}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
