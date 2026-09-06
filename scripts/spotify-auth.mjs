// One-time helper to get YOUR Spotify refresh token, so the deployed
// dashboard can show your real data to any visitor without them logging in.
//
// Run with: npm run spotify:auth
//
// Uses Authorization Code + PKCE (same as the Spotify app you already
// created) — no client secret needed anywhere, ever. This only talks to
// Spotify's own servers; the resulting refresh token is written to
// .env.local (gitignored) and printed so you can add it to Vercel.

import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { exec } from 'node:child_process'
import { randomBytes, createHash } from 'node:crypto'

const ENV_PATH = new URL('../.env.local', import.meta.url)
const PORT = 5174
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-recently-played',
  'user-top-read',
  'user-library-read',
  'user-library-modify',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ')

function readEnvLocal() {
  if (!existsSync(ENV_PATH)) return {}
  const text = readFileSync(ENV_PATH, 'utf8')
  const vars = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return vars
}

function writeEnvLocal(vars) {
  const lines = Object.entries(vars).map(([k, v]) => `${k}=${v}`)
  writeFileSync(ENV_PATH, lines.join('\n') + '\n')
}

async function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(question)
  rl.close()
  return answer.trim()
}

function openInBrowser(url) {
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${opener} "${url}"`)
}

function base64UrlEncode(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function main() {
  const existing = readEnvLocal()
  let clientId = existing.SPOTIFY_CLIENT_ID || existing.VITE_SPOTIFY_CLIENT_ID
  if (!clientId) clientId = await prompt('Spotify Client ID: ')

  const verifier = base64UrlEncode(randomBytes(64)).slice(0, 64)
  const challenge = base64UrlEncode(createHash('sha256').update(verifier).digest())
  const state = randomBytes(8).toString('hex')

  const authUrl = new URL('https://accounts.spotify.com/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  authUrl.searchParams.set('code_challenge', challenge)
  authUrl.searchParams.set('state', state)

  console.log('\nMake sure this exact redirect URI is registered on your Spotify app (it already should be):')
  console.log(`  ${REDIRECT_URI}\n`)
  console.log('Opening your browser to authorize as YOURSELF — this is the one-time consent that lets the')
  console.log('deployed dashboard show your data to visitors without them ever logging in.\n')
  console.log(`If it doesn't open automatically, visit:\n  ${authUrl.toString()}\n`)

  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
      if (url.pathname !== '/callback') {
        res.writeHead(404).end()
        return
      }
      const returnedState = url.searchParams.get('state')
      const error = url.searchParams.get('error')
      const authCode = url.searchParams.get('code')

      if (error || returnedState !== state || !authCode) {
        res.writeHead(400, { 'Content-Type': 'text/plain' }).end('Authorization failed. You can close this tab.')
        server.close()
        reject(new Error(error || 'state mismatch or missing code'))
        return
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' }).end('Authorized! You can close this tab and return to your terminal.')
      server.close()
      resolve(authCode)
    })
    server.listen(PORT, () => openInBrowser(authUrl.toString()))
  })

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  })

  if (!tokenRes.ok) {
    console.error('\nToken exchange failed:', tokenRes.status, await tokenRes.text())
    process.exit(1)
  }

  const tokens = await tokenRes.json()
  if (!tokens.refresh_token) {
    console.error('\nNo refresh_token in response — check the app scopes/config on Spotify.')
    process.exit(1)
  }

  writeEnvLocal({
    ...existing,
    SPOTIFY_CLIENT_ID: clientId,
    SPOTIFY_REFRESH_TOKEN: tokens.refresh_token,
  })

  console.log('\nDone. Wrote SPOTIFY_CLIENT_ID / SPOTIFY_REFRESH_TOKEN to .env.local.')
  console.log('Add the same two as Environment Variables in your Vercel project settings before deploying —')
  console.log('that refresh token is what lets the live site show your data to every visitor.')
}

main().catch((err) => {
  console.error('\nAuth flow failed:', err.message)
  process.exit(1)
})
