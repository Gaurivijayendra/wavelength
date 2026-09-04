import { useQuery } from '@tanstack/react-query'
import { fetchAlbumsForQueries, fetchAlbumTracklist, fetchTracksForQueries } from './itunes'
import { MADE_FOR_YOU_QUERIES, POPULAR_ALBUM_QUERIES, RECENTLY_PLAYED_QUERIES } from '../data/curated'
import type { CuratedQuery } from '../data/curated'
import { FALLBACK_MADE_FOR_YOU, FALLBACK_POPULAR_ALBUMS, FALLBACK_RECENTLY_PLAYED } from '../data/fallback'
import type { Track } from '../types/music'

// Minimum time each row stays in the loading state, so the skeleton is
// actually visible even though the iTunes API usually answers in <300ms.
const MIN_LOADING_MS = 650

async function withMinDelay<T>(promise: Promise<T>): Promise<T> {
  const [result] = await Promise.all([promise, new Promise((r) => setTimeout(r, MIN_LOADING_MS))])
  return result
}

async function tracksOrFallback(queries: CuratedQuery[], fallback: Track[]): Promise<Track[]> {
  const results = await fetchTracksForQueries(queries)
  return results.length > 0 ? results : fallback
}

async function albumsOrFallback(queries: CuratedQuery[], fallback: Track[]): Promise<Track[]> {
  const results = await fetchAlbumsForQueries(queries)
  return results.length > 0 ? results : fallback
}

export function useRecentlyPlayed() {
  return useQuery({
    queryKey: ['recently-played'],
    queryFn: () => withMinDelay(tracksOrFallback(RECENTLY_PLAYED_QUERIES, FALLBACK_RECENTLY_PLAYED)),
  })
}

export function useMadeForYou() {
  return useQuery({
    queryKey: ['made-for-you'],
    queryFn: () => withMinDelay(tracksOrFallback(MADE_FOR_YOU_QUERIES, FALLBACK_MADE_FOR_YOU)),
  })
}

export function usePopularAlbums() {
  return useQuery({
    queryKey: ['popular-albums'],
    queryFn: () => withMinDelay(albumsOrFallback(POPULAR_ALBUM_QUERIES, FALLBACK_POPULAR_ALBUMS)),
  })
}

export function useAlbumTracklist(artist: string | null, album: string | null) {
  return useQuery({
    queryKey: ['album-tracklist', artist, album],
    queryFn: () => fetchAlbumTracklist(artist!, album!),
    enabled: Boolean(artist && album),
  })
}
