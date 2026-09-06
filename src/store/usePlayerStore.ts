import { create } from 'zustand'
import type { Track } from '../types/music'
import { fetchPlaybackToken, playOnDevice } from '../lib/spotify'
import { ensureSpotifyPlayer, type SpotifyPlayerHandle } from '../lib/spotifyPlayer'

// Playback has three tiers, tried in order per track:
//  1. 'spotify'   — real full-song streaming via the Web Playback SDK, using
//                   the owner's Premium account through a server-minted token
//  2. 'preview'   — a real 30s clip through a plain <audio> element (rarely
//                   available since Spotify restricted preview_url in 2024)
//  3. 'simulated' — no audio at all, just a duration-timed progress bar
//
// Whichever tier is active, `segmentStartMs`/`segmentStartAt` only move on
// play/pause/seek/track-change (never on a tick), so the Framer Motion bar
// in NowPlayingBar animates smoothly via WAAPI instead of jumping every tick.

const audio = typeof Audio !== 'undefined' ? new Audio() : null
let spotifyHandle: SpotifyPlayerHandle | null = null

const DEFAULT_TITLE = 'Wavelength — Music Dashboard'

function trackSubtitle(track: Track): string {
  return track.artists.map((a) => a.name).join(', ')
}

function updateDocumentTitle(track: Track | null, isPlaying: boolean) {
  if (typeof document === 'undefined') return
  document.title = track && isPlaying ? `▶ ${track.name} — ${trackSubtitle(track)}` : DEFAULT_TITLE
}

function updateMediaSessionMetadata(track: Track) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
  const art = track.album.images[0]?.url
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.name,
    artist: trackSubtitle(track),
    album: track.album.name,
    artwork: art ? [{ src: art, sizes: '600x600', type: 'image/jpeg' }] : [],
  })
}

function updateMediaSessionPlaybackState(isPlaying: boolean) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
}

type PlaybackMode = 'spotify' | 'preview' | 'simulated'

interface PlayerState {
  currentTrack: Track | null
  durationMs: number
  isPlaying: boolean
  mode: PlaybackMode
  /** True while a Spotify SDK play command is in flight (device connect + transfer). */
  isConnecting: boolean
  segmentStartMs: number
  segmentStartAt: number
  displayPositionMs: number
  volume: number
  playTrack: (track: Track) => void
  /** Plays `track`, or toggles play/pause if it's already the current track. */
  playOrToggle: (track: Track) => void
  togglePlay: () => void
  seekToFraction: (fraction: number) => void
  setVolume: (volume: number) => void
  tick: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  if (audio) {
    audio.addEventListener('loadedmetadata', () => {
      if (get().mode === 'preview' && Number.isFinite(audio.duration) && audio.duration > 0) {
        set({ durationMs: audio.duration * 1000 })
      }
    })
    audio.addEventListener('timeupdate', () => {
      if (get().mode === 'preview') set({ displayPositionMs: audio.currentTime * 1000 })
    })
    audio.addEventListener('ended', () => {
      if (get().mode !== 'preview') return
      const { durationMs } = get()
      set({ isPlaying: false, segmentStartMs: durationMs, displayPositionMs: durationMs })
      updateMediaSessionPlaybackState(false)
      updateDocumentTitle(get().currentTrack, false)
    })
  }

  function getOAuthToken(callback: (token: string) => void) {
    fetchPlaybackToken()
      .then(callback)
      .catch(() => callback(''))
  }

  function onSpotifyStateChanged(state: Spotify.WebPlaybackState | null) {
    if (!state || get().mode !== 'spotify') return
    set({
      isConnecting: false,
      isPlaying: !state.paused,
      durationMs: state.duration || get().durationMs,
      segmentStartMs: state.position,
      segmentStartAt: performance.now(),
      displayPositionMs: state.position,
    })
    updateMediaSessionPlaybackState(!state.paused)
  }

  async function playViaSpotify(track: Track): Promise<boolean> {
    try {
      set({ isConnecting: true })
      const handle = await ensureSpotifyPlayer(getOAuthToken, onSpotifyStateChanged)
      spotifyHandle = handle
      await playOnDevice(handle.deviceId, [track.uri!])
      return true
    } catch (err) {
      console.warn('Spotify playback unavailable, falling back:', err)
      set({ isConnecting: false })
      return false
    }
  }

  return {
    currentTrack: null,
    durationMs: 0,
    isPlaying: false,
    mode: 'simulated',
    isConnecting: false,
    segmentStartMs: 0,
    segmentStartAt: 0,
    displayPositionMs: 0,
    volume: 0.75,

    playTrack: (track) => {
      // Stop whatever was playing before switching tiers/tracks.
      audio?.pause()
      if (spotifyHandle) void spotifyHandle.player.pause().catch(() => {})

      // Every track we render is Spotify-sourced, streamed through the
      // owner's own Premium account — no per-visitor Premium check needed.
      const mode: PlaybackMode = track.uri ? 'spotify' : track.previewUrl ? 'preview' : 'simulated'

      set({
        currentTrack: track,
        mode,
        durationMs: track.durationMs || 210_000,
        isPlaying: true,
        isConnecting: mode === 'spotify',
        segmentStartMs: 0,
        segmentStartAt: performance.now(),
        displayPositionMs: 0,
      })
      updateMediaSessionMetadata(track)
      updateMediaSessionPlaybackState(true)
      updateDocumentTitle(track, true)

      if (mode === 'spotify') {
        playViaSpotify(track).then((ok) => {
          if (!ok && get().currentTrack?.id === track.id) {
            // Re-run playTrack's non-Spotify branch for this same track.
            const fallbackMode: PlaybackMode = track.previewUrl ? 'preview' : 'simulated'
            set({ mode: fallbackMode, isConnecting: false, segmentStartAt: performance.now() })
            if (fallbackMode === 'preview' && audio) {
              audio.src = track.previewUrl!
              audio.currentTime = 0
              audio.volume = get().volume
              audio.play().catch(() => set({ isPlaying: false }))
            }
          }
        })
      } else if (mode === 'preview' && audio) {
        audio.src = track.previewUrl!
        audio.currentTime = 0
        audio.volume = get().volume
        audio.play().catch(() => set({ isPlaying: false }))
      }
    },

    playOrToggle: (track) => {
      const { currentTrack } = get()
      if (currentTrack?.id === track.id) get().togglePlay()
      else get().playTrack(track)
    },

    togglePlay: () => {
      const { currentTrack, isPlaying, mode, segmentStartMs, segmentStartAt, durationMs } = get()
      if (!currentTrack) return

      if (mode === 'spotify' && spotifyHandle) {
        void spotifyHandle.player.togglePlay()
        // Optimistic flip — onSpotifyStateChanged corrects it shortly after.
        set({ isPlaying: !isPlaying })
        return
      }

      if (isPlaying) {
        const elapsed = performance.now() - segmentStartAt
        const pos = Math.min(segmentStartMs + elapsed, durationMs)
        set({ isPlaying: false, segmentStartMs: pos, displayPositionMs: pos })
        if (mode === 'preview' && audio) audio.pause()
      } else {
        set({ isPlaying: true, segmentStartAt: performance.now() })
        if (mode === 'preview' && audio) audio.play().catch(() => set({ isPlaying: false }))
      }
      updateMediaSessionPlaybackState(!isPlaying)
      updateDocumentTitle(currentTrack, !isPlaying)
    },

    seekToFraction: (fraction) => {
      const { durationMs, mode } = get()
      const pos = Math.max(0, Math.min(1, fraction)) * durationMs
      if (mode === 'spotify' && spotifyHandle) void spotifyHandle.player.seek(pos)
      if (mode === 'preview' && audio) audio.currentTime = pos / 1000
      set({ segmentStartMs: pos, segmentStartAt: performance.now(), displayPositionMs: pos })
    },

    setVolume: (volume) => {
      const v = Math.max(0, Math.min(1, volume))
      if (audio) audio.volume = v
      if (spotifyHandle) void spotifyHandle.player.setVolume(v)
      set({ volume: v })
    },

    tick: () => {
      // Real playback (spotify/preview) updates position via SDK/audio
      // events above — this interval only drives the simulated fallback.
      const { isPlaying, mode, segmentStartMs, segmentStartAt, durationMs } = get()
      if (!isPlaying || mode !== 'simulated') return
      const elapsed = performance.now() - segmentStartAt
      const pos = segmentStartMs + elapsed
      if (pos >= durationMs) {
        set({ displayPositionMs: durationMs, isPlaying: false, segmentStartMs: durationMs })
      } else {
        set({ displayPositionMs: pos })
      }
    },
  }
})
