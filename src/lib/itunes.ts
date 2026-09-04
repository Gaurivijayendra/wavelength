import type { Track } from '../types/music'
import type { CuratedQuery } from '../data/curated'

// Live, real-data source: the public iTunes Search API. No API key, no
// server-side proxy, CORS-friendly straight from the browser. This keeps
// "Fast path vs fallback" from the build spec collapsed into one thing —
// genuinely live data with zero auth setup. Swapping to the real Spotify
// Web API later only means writing a new function with this same
// `Promise<Track[]>` / `Promise<Track>` shape.

interface ItunesRawTrack {
  trackId?: number
  collectionId?: number
  trackName?: string
  collectionName?: string
  artistId?: number
  artistName?: string
  artworkUrl100?: string
  trackTimeMillis?: number
  previewUrl?: string
  releaseDate?: string
}

const ITUNES_BASE = 'https://itunes.apple.com'

function hiResArtwork(url: string | undefined): string {
  if (!url) return ''
  return url.replace('100x100bb', '600x600bb')
}

function normalizeTrack(raw: ItunesRawTrack): Track | null {
  if (!raw.trackId && !raw.collectionId) return null
  const id = String(raw.trackId ?? raw.collectionId)
  const art = hiResArtwork(raw.artworkUrl100)
  return {
    id,
    name: raw.trackName ?? raw.collectionName ?? 'Unknown title',
    artists: [{ id: String(raw.artistId ?? id), name: raw.artistName ?? 'Unknown artist' }],
    album: {
      id: String(raw.collectionId ?? id),
      name: raw.collectionName ?? raw.trackName ?? 'Unknown album',
      images: art ? [{ url: art, width: 600, height: 600 }] : [],
      releaseDate: raw.releaseDate,
    },
    durationMs: raw.trackTimeMillis ?? 210_000,
    previewUrl: raw.previewUrl ?? null,
  }
}

async function itunesSearch(term: string, entity: 'song' | 'album', limit: number): Promise<ItunesRawTrack[]> {
  const url = `${ITUNES_BASE}/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`iTunes search failed: ${res.status}`)
  const data = await res.json()
  return data.results ?? []
}

/**
 * Prefers a result whose artist matches, then narrows further to one whose
 * title also matches, so an ambiguous term like "Blonde" doesn't resolve to
 * an unrelated same-artist release.
 */
function pickBestMatch(
  results: ItunesRawTrack[],
  expectedArtist: string,
  expectedTitle: string,
  getName: (r: ItunesRawTrack) => string | undefined,
): ItunesRawTrack | undefined {
  const artistNeedle = expectedArtist.toLowerCase()
  const titleNeedle = expectedTitle.toLowerCase()
  const artistMatches = results.filter((r) => r.artistName?.toLowerCase().includes(artistNeedle))
  const pool = artistMatches.length > 0 ? artistMatches : results
  const titleMatch = pool.find((r) => getName(r)?.toLowerCase().includes(titleNeedle))
  return titleMatch ?? pool[0]
}

/** Resolve one (term, artist) query to a single normalized track. */
export async function fetchTrackForQuery(query: CuratedQuery): Promise<Track | null> {
  const results = await itunesSearch(`${query.term} ${query.artist}`, 'song', 10)
  const best = pickBestMatch(results, query.artist, query.term, (r) => r.trackName)
  return best ? normalizeTrack(best) : null
}

/** Resolve several queries in parallel, dropping any that fail or miss. */
export async function fetchTracksForQueries(queries: CuratedQuery[]): Promise<Track[]> {
  const settled = await Promise.allSettled(queries.map(fetchTrackForQuery))
  return settled
    .filter((r): r is PromiseFulfilledResult<Track | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((t): t is Track => t !== null)
}

/** Resolve an album query to a representative track (for cover + title/artist). */
export async function fetchAlbumForQuery(query: CuratedQuery): Promise<Track | null> {
  const results = await itunesSearch(`${query.term} ${query.artist}`, 'album', 10)
  const best = pickBestMatch(results, query.artist, query.term, (r) => r.collectionName)
  if (!best) return null
  // Album entity has collectionId/collectionName but no trackId/trackTimeMillis.
  return normalizeTrack({ ...best, trackId: best.collectionId, trackName: best.collectionName })
}

export async function fetchAlbumsForQueries(queries: CuratedQuery[]): Promise<Track[]> {
  const settled = await Promise.allSettled(queries.map(fetchAlbumForQuery))
  return settled
    .filter((r): r is PromiseFulfilledResult<Track | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((t): t is Track => t !== null)
}

/** Full tracklist for an album, used by the detail view. */
export async function fetchAlbumTracklist(artist: string, album: string): Promise<Track[]> {
  const results = await itunesSearch(`${artist} ${album}`, 'song', 20)
  return results
    .map(normalizeTrack)
    .filter((t): t is Track => t !== null)
    .filter((t) => t.album.name.toLowerCase() === album.toLowerCase())
}
