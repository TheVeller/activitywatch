import { AWEvent, AppEntity } from './types'

/**
 * Normalizes app names from window events to consistent appId
 */
export function normalizeDesktopApp(appName: string, platform: string = 'unknown'): string {
  // Normalize common variations
  const normalized = appName.toLowerCase().trim()
  
  // Platform-specific normalization
  if (platform === 'darwin' || platform === 'macos') {
    // macOS app names often have .app suffix
    return normalized.replace(/\.app$/, '')
  }
  
  return normalized
}

/**
 * Normalizes browser domains to appId
 */
export function normalizeBrowserApp(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    
    // Extract domain (remove www, etc.)
    const parts = hostname.split('.')
    if (parts.length >= 2) {
      return parts.slice(-2).join('.') // e.g., "notion.so"
    }
    return hostname
  } catch {
    return url
  }
}

/**
 * Checks if an app/domain should be merged into Notion
 */
export function isNotionApp(appId: string, eventData: Record<string, unknown>): boolean {
  const normalized = appId.toLowerCase()
  
  // Desktop Notion apps
  if (normalized.includes('notion')) {
    return true
  }
  
  // Browser Notion
  if (normalized === 'notion.so' || normalized.includes('notion.so')) {
    return true
  }
  
  // Check event data for Notion indicators
  if (eventData.url && typeof eventData.url === 'string') {
    if (eventData.url.includes('notion.so')) {
      return true
    }
  }
  
  if (eventData.app && typeof eventData.app === 'string') {
    if (eventData.app.toLowerCase().includes('notion')) {
      return true
    }
  }
  
  return false
}

/**
 * Creates a normalized app entity from events
 */
export function createAppEntity(
  appId: string,
  type: 'desktop' | 'browser' | 'merged',
  eventData?: Record<string, unknown>
): AppEntity {
  // Merge Notion entities
  if (isNotionApp(appId, eventData || {})) {
    return {
      id: 'notion',
      name: 'Notion',
      type: 'merged',
    }
  }
  
  // Use original appId for others
  return {
    id: appId,
    name: appId.charAt(0).toUpperCase() + appId.slice(1),
    type,
  }
}

/**
 * Extracts appId from window event
 */
export function getAppIdFromWindowEvent(event: AWEvent): string {
  const app = event.data.app as string | undefined
  const title = event.data.title as string | undefined
  
  if (app) {
    return normalizeDesktopApp(app)
  }
  
  // Fallback to title if app not available
  if (title) {
    return normalizeDesktopApp(title)
  }
  
  return 'unknown'
}

/**
 * Extracts appId from browser event
 */
export function getAppIdFromBrowserEvent(event: AWEvent): string {
  const url = event.data.url as string | undefined
  
  if (url) {
    const domain = normalizeBrowserApp(url)
    // Check if it's Notion
    if (isNotionApp(domain, event.data)) {
      return 'notion'
    }
    return domain
  }
  
  return 'unknown'
}

/**
 * Merges desktop and browser events into unified app entities
 */
export function mergeAppEvents(
  windowEvents: AWEvent[],
  browserEvents: AWEvent[]
): Map<string, AWEvent[]> {
  const merged = new Map<string, AWEvent[]>()
  
  // Process window events
  for (const event of windowEvents) {
    let appId = getAppIdFromWindowEvent(event)
    
    // Check if it's Notion
    if (isNotionApp(appId, event.data)) {
      appId = 'notion'
    }
    
    if (!merged.has(appId)) {
      merged.set(appId, [])
    }
    merged.get(appId)!.push(event)
  }
  
  // Process browser events
  for (const event of browserEvents) {
    let appId = getAppIdFromBrowserEvent(event)
    
    // Merge Notion browser events with desktop
    if (appId === 'notion') {
      if (!merged.has('notion')) {
        merged.set('notion', [])
      }
      merged.get('notion')!.push(event)
    } else {
      // Other browser apps
      if (!merged.has(appId)) {
        merged.set(appId, [])
      }
      merged.get(appId)!.push(event)
    }
  }
  
  return merged
}
