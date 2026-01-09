export interface AWEvent {
  timestamp: string
  duration: number
  data: Record<string, unknown>
}

export interface AWBucket {
  id: string
  type: string
  hostname: string
  created: string
  client: string
  data: Record<string, unknown>
}

export interface AppEntity {
  id: string
  name: string
  type: 'desktop' | 'browser' | 'merged'
  icon?: string
}

export interface Session {
  appId: string
  start: Date
  end: Date
  duration: number // milliseconds
  isFocused: boolean // >= focusedSessionMinutes
}

export interface AppStats {
  appId: string
  totalTime: number // milliseconds
  sessionCount: number
  focusedSessionCount: number
  lastActive?: Date
  streakDays: number
}

export interface TimeRange {
  start: Date
  end: Date
}
