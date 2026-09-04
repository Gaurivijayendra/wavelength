// Serverless: proxies read-only Spotify Web API calls using the owner's
// server-side token, so any visitor gets real data with no login of their
// own. GET-only, and restricted to an allowlist of known-safe paths — this
// never exposes account-mutating endpoints (playlist writes, playback
// control) publicly, only the same read-only data the dashboard renders.

import { getAccessToken } from './_lib/spotify.js'

interface VercelRequest {
  method?: string
  query?: Record<string, string | string[] | undefined>
}

interface VercelResponse {
  status(code: number): VercelResponse
  setHeader(name: string, value: string): void
  json(body: unknown): void
}

const ALLOWED_PATH_PATTERNS = [
  /^\/me$/,
  /^\/me\/player\/recently-played(\?.*)?$/,
  /^\/me\/top\/tracks(\?.*)?$/,
  /^\/me\/tracks(\?.*)?$/,
  /^\/me\/playlists(\?.*)?$/,
  /^\/albums\/[A-Za-z0-9]+$/,
  /^\/tracks\?ids=[A-Za-z0-9,]+$/,
  /^\/search\?.*$/,
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=120')

  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const rawPath = req.query?.path
  const path = Array.isArray(rawPath) ? rawPath[0] : rawPath

  if (!path || !ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(path))) {
    res.status(400).json({ error: 'Unsupported path' })
    return
  }

  try {
    const accessToken = await getAccessToken()
    const spotifyRes = await fetch(`https://api.spotify.com/v1${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const body = await spotifyRes.json()
    res.status(spotifyRes.status).json(body)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
