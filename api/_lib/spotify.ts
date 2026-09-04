// Server-only: mints a fresh Spotify access token from the owner's stored
// refresh token (SPOTIFY_CLIENT_ID / SPOTIFY_REFRESH_TOKEN env vars, set via
// `npm run spotify:auth` locally then copied into Vercel's project
// settings). Never imported by client code — this is what lets every
// visitor see real data without logging in themselves.

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

  if (!clientId || !refreshToken) {
    throw new Error('Server is missing SPOTIFY_CLIENT_ID / SPOTIFY_REFRESH_TOKEN env vars')
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    throw new Error(`Spotify token refresh failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as { access_token: string }
  return data.access_token
}
