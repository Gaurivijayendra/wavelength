// Serverless: hands the browser a short-lived access token (minted from the
// server-only refresh token) so the Web Playback SDK can stream real audio
// in the visitor's browser. The refresh token itself never leaves the
// server — only this ~1hr-expiring token, scoped to whatever the owner
// granted at setup time.

import { getAccessToken } from './_lib/spotify.js'

interface VercelRequest {
  method?: string
}

interface VercelResponse {
  status(code: number): VercelResponse
  setHeader(name: string, value: string): void
  json(body: unknown): void
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  try {
    const accessToken = await getAccessToken()
    res.status(200).json({ accessToken })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
