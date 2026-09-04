import type { Album, AlbumImage, Artist, Playlist, Track } from '../types/music'

export interface SpotifyProfile {
  id: string
  displayName: string
  imageUrl?: string
}

// Read-only data goes through our own serverless proxy (api/spotify-data.ts)
// — it holds the owner's token server-side, so visitors never need to log
// in or hold any credential just to browse the dashboard.
async function spotifyRead<T>(path: string): Promise<T> {
  const res = await fetch(`/api/spotify-data?path=${encodeURIComponent(path)}`)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Spotify data proxy ${res.status} on ${path}: ${body}`)
  }
  return (await res.json()) as T
}

// Playback control (starting/transferring playback) has to be a real,
// live Spotify API call from the browser — that's inherent to how the Web
// Playback SDK works. The access token behind it is short-lived and minted
// server-side per visit (api/spotify-token.ts); it's never the owner's
// long-lived refresh token.
let cachedToken: { value: string; expiresAt: number } | null = null

export async function fetchPlaybackToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - Date.now() > 60_000) return cachedToken.value
  const res = await fetch('/api/spotify-token')
  if (!res.ok) throw new Error(`Failed to get a playback token: ${res.status}`)
  const data = (await res.json()) as { accessToken: string }
  cachedToken = { value: data.accessToken, expiresAt: Date.now() + 50 * 60 * 1000 }
  return cachedToken.value
}

// --- raw Spotify JSON shapes (only the fields we use) -----------------

interface RawImage {
  url: string
  width?: number
  height?: number
}

interface RawArtist {
  id: string
  name: string
}

interface RawAlbum {
  id: string
  name: string
  images?: RawImage[]
  release_date?: string
  artists?: RawArtist[]
  uri?: string
}

interface RawTrack {
  id: string
  name: string
  uri: string
  duration_ms?: number
  preview_url?: string | null
  artists?: RawArtist[]
  album?: RawAlbum
}

interface RawPlaylist {
  id: string
  name: string
  description?: string | null
  images?: RawImage[]
  owner?: { id: string }
  // Spotify's /me/playlists response uses `tracks.total` in some API
  // versions and `items.total` in others — read whichever is present.
  tracks?: { total?: number }
  items?: { total?: number }
}

// --- normalization ------------------------------------------------------

function mapImage(img: RawImage): AlbumImage {
  return { url: img.url, width: img.width ?? 0, height: img.height ?? 0 }
}

function mapArtists(artists: RawArtist[] | undefined): Artist[] {
  return (artists ?? []).map((a) => ({ id: a.id, name: a.name }))
}

function normalizeTrack(raw: RawTrack): Track {
  const album: Album = {
    id: raw.album?.id ?? raw.id,
    name: raw.album?.name ?? raw.name,
    images: (raw.album?.images ?? []).map(mapImage),
    releaseDate: raw.album?.release_date,
  }
  return {
    id: raw.id,
    name: raw.name,
    artists: mapArtists(raw.artists),
    album,
    durationMs: raw.duration_ms ?? 0,
    previewUrl: raw.preview_url ?? null,
    uri: raw.uri,
  }
}

function normalizePlaylist(raw: RawPlaylist): Playlist {
  const hash = Array.from(raw.name).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const hue = hash % 360
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || `${raw.tracks?.total ?? raw.items?.total ?? 0} tracks`,
    gradient: [`hsl(${hue} 70% 40%)`, `hsl(${(hue + 60) % 360} 70% 30%)`],
    image: raw.images?.[0]?.url,
    ownerId: raw.owner?.id,
  }
}

// --- reads (via the proxy — no visitor auth needed) ----------------------

export async function fetchMe(): Promise<SpotifyProfile> {
  const raw = await spotifyRead<{ id: string; display_name?: string; images?: RawImage[] }>('/me')
  return { id: raw.id, displayName: raw.display_name ?? raw.id, imageUrl: raw.images?.[0]?.url }
}

export async function fetchRecentlyPlayed(limit = 6): Promise<Track[]> {
  const raw = await spotifyRead<{ items: { track: RawTrack }[] }>(`/me/player/recently-played?limit=${limit * 2}`)
  const seen = new Set<string>()
  const tracks: Track[] = []
  for (const item of raw.items ?? []) {
    const track = normalizeTrack(item.track)
    if (seen.has(track.id)) continue // the same track often repeats in recent history
    seen.add(track.id)
    tracks.push(track)
    if (tracks.length >= limit) break
  }
  return tracks
}

export async function fetchTopTracks(limit = 6): Promise<Track[]> {
  const raw = await spotifyRead<{ items: RawTrack[] }>(`/me/top/tracks?limit=${limit}&time_range=short_term`)
  return (raw.items ?? []).map(normalizeTrack)
}

export async function fetchLikedSongs(limit = 6): Promise<Track[]> {
  const raw = await spotifyRead<{ items: { track: RawTrack }[] }>(`/me/tracks?limit=${limit}`)
  return (raw.items ?? []).map((item) => normalizeTrack(item.track))
}

export async function fetchUserPlaylists(limit = 8): Promise<Playlist[]> {
  const raw = await spotifyRead<{ items: (RawPlaylist | null)[] }>(`/me/playlists?limit=${limit}`)
  return (raw.items ?? []).filter((p): p is RawPlaylist => p !== null).map(normalizePlaylist)
}

export async function fetchAlbumTracklist(albumId: string): Promise<Track[]> {
  const raw = await spotifyRead<RawAlbum & { tracks: { items: RawTrack[] } }>(`/albums/${albumId}`)
  return (raw.tracks?.items ?? []).map((t) => normalizeTrack({ ...t, album: raw }))
}

export async function searchTracks(query: string, limit = 8): Promise<Track[]> {
  if (!query.trim()) return []
  const raw = await spotifyRead<{ tracks: { items: RawTrack[] } }>(
    `/search?type=track&limit=${limit}&q=${encodeURIComponent(query)}`,
  )
  return (raw.tracks?.items ?? []).map(normalizeTrack)
}

export async function fetchTracksByIds(ids: string[]): Promise<Track[]> {
  if (ids.length === 0) return []
  const raw = await spotifyRead<{ tracks: (RawTrack | null)[] }>(`/tracks?ids=${ids.join(',')}`)
  return (raw.tracks ?? []).filter((t): t is RawTrack => t !== null).map(normalizeTrack)
}

// --- Ask your library (AI-curated micro-playlist from real history) ----

export interface AskLibraryResult {
  trackIds: string[]
  blurb: string
}

export async function askLibrary(prompt: string): Promise<AskLibraryResult> {
  const res = await fetch('/api/ask-library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : `Request failed: ${res.status}`)
  }
  return body as AskLibraryResult
}

// --- playback control (direct to Spotify, using a short-lived token) ----

export async function playOnDevice(deviceId: string, uris: string[]): Promise<void> {
  const token = await fetchPlaybackToken()
  const attempt = () =>
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris }),
    })

  let res = await attempt()
  if (!res.ok && res.status === 404) {
    // The device can take a moment to become controllable right after the
    // SDK's 'ready' event fires — one retry covers that race reliably.
    await new Promise((r) => setTimeout(r, 500))
    res = await attempt()
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Failed to start playback: ${res.status} ${body}`)
  }
}
