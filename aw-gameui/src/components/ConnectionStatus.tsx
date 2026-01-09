import { useQuery } from '@tanstack/react-query'
import { getServerHealth } from '../lib/aw-api'

export default function ConnectionStatus() {
  const { data: isConnected, isLoading } = useQuery({
    queryKey: ['server-health'],
    queryFn: getServerHealth,
    refetchInterval: 5000,
    retry: false,
  })

  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          w-2 h-2 rounded-full
          ${isLoading 
            ? 'bg-yellow-500 animate-pulse' 
            : isConnected 
            ? 'bg-green-500' 
            : 'bg-red-500'}
        `}
      />
      <span className="text-sm text-gray-400">
        {isLoading
          ? 'Connecting...'
          : isConnected
          ? 'Connected to ActivityWatch'
          : 'Disconnected'}
      </span>
    </div>
  )
}
