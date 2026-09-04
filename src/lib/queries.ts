import { useQuery } from '@tanstack/react-query'
import {
  fetchAlbumTracklist,
  fetchLikedSongs,
  fetchMe,
  fetchRecentlyPlayed,
  fetchTopTracks,
  fetchUserPlaylists,
  searchTracks,
} from './spotify'
import type { Track } from '../types/music'

// Everything here is real, personal Spotify data, served through our own
// serverless proxy (see api/spotify-data.ts) — no visitor login involved.

export function useRecentlyPlayed() {
  return useQuery({
    queryKey: ['recently-played'],
    queryFn: () => fetchRecentlyPlayed(6),
  })
}

export function useMadeForYou() {
  return useQuery({
    queryKey: ['made-for-you'],
    queryFn: () => fetchTopTracks(6),
  })
}

export function useLikedSongs() {
  return useQuery({
    queryKey: ['liked-songs'],
    queryFn: () => fetchLikedSongs(6),
  })
}

export function usePlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: () => fetchUserPlaylists(8),
  })
}

export function useAlbumTracklist(track: Track | null) {
  return useQuery({
    queryKey: ['album-tracklist', track?.album.id],
    queryFn: () => fetchAlbumTracklist(track!.album.id),
    enabled: Boolean(track),
  })
}

export function useOwnerProfile() {
  return useQuery({
    queryKey: ['owner-profile'],
    queryFn: fetchMe,
    staleTime: 60 * 60 * 1000, // this doesn't change during a session
  })
}

export function useTrackSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: ['search', trimmed],
    queryFn: () => searchTracks(trimmed, 8),
    enabled: trimmed.length > 1,
  })
}
