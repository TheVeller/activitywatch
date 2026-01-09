const DEFAULT_SERVER_URL = 'http://localhost:5600'

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

function getServerUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('aw-server-url')
    // Validate stored URL, fallback to default if invalid
    if (stored && isValidUrl(stored)) {
      return stored
    }
    // If stored URL is invalid, clear it and use default
    if (stored && !isValidUrl(stored)) {
      console.warn('Invalid server URL in localStorage, using default:', stored)
      localStorage.removeItem('aw-server-url')
    }
  }
  return DEFAULT_SERVER_URL
}

export function setServerUrl(url: string): void {
  localStorage.setItem('aw-server-url', url)
}

export async function getServerHealth(): Promise<boolean> {
  try {
    const url = getServerUrl()
    const response = await fetch(`${url}/api/0/info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    return response.ok
  } catch {
    return false
  }
}

export interface Bucket {
  id: string
  type: string
  hostname: string
  created: string
  client: string
  data: Record<string, unknown>
}

export async function getBuckets(): Promise<Bucket[]> {
  const url = getServerUrl()
  const response = await fetch(`${url}/api/0/buckets`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch buckets: ${response.statusText}`)
  }
  return response.json()
}

export interface Event {
  timestamp: string
  duration: number
  data: Record<string, unknown>
}

export interface QueryParams {
  start: string
  end: string
  limit?: number
}

export async function getEvents(
  bucketId: string,
  params: QueryParams
): Promise<Event[]> {
  const url = getServerUrl()
  const searchParams = new URLSearchParams({
    start: params.start,
    end: params.end,
  })
  if (params.limit) {
    searchParams.set('limit', params.limit.toString())
  }

  const response = await fetch(
    `${url}/api/0/buckets/${bucketId}/events?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`)
  }
  return response.json()
}

export async function queryEvents(query: string): Promise<Event[]> {
  const url = getServerUrl()
  const response = await fetch(`${url}/api/0/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!response.ok) {
    throw new Error(`Failed to query events: ${response.statusText}`)
  }
  const result = await response.json()
  return result.flat()
}
