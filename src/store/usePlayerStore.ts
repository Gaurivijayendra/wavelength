import { create } from 'zustand'
import type { Track } from '../types/music'

interface PlayerState {
  currentTrack: Track | null
  durationMs: number
  isPlaying: boolean
  /** Position (ms) at the start of the current playback segment. Only
   *  changes on play/pause/seek/track-change — never on a tick — so the
   *  Framer Motion progress fill can animate smoothly between those events
   *  instead of restarting every tick. */
  segmentStartMs: number
  /** performance.now() timestamp when the current segment began. */
  segmentStartAt: number
  /** Position (ms) for the mm:ss text, refreshed a few times a second. */
  displayPositionMs: number
  volume: number
  playTrack: (track: Track) => void
  togglePlay: () => void
  seekToFraction: (fraction: number) => void
  setVolume: (volume: number) => void
  tick: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  durationMs: 0,
  isPlaying: false,
  segmentStartMs: 0,
  segmentStartAt: 0,
  displayPositionMs: 0,
  volume: 0.75,

  playTrack: (track) =>
    set({
      currentTrack: track,
      durationMs: track.durationMs || 210_000,
      isPlaying: true,
      segmentStartMs: 0,
      segmentStartAt: performance.now(),
      displayPositionMs: 0,
    }),

  togglePlay: () => {
    const { currentTrack, isPlaying, segmentStartMs, segmentStartAt, durationMs } = get()
    if (!currentTrack) return
    if (isPlaying) {
      const elapsed = performance.now() - segmentStartAt
      const pos = Math.min(segmentStartMs + elapsed, durationMs)
      set({ isPlaying: false, segmentStartMs: pos, displayPositionMs: pos })
    } else {
      set({ isPlaying: true, segmentStartAt: performance.now() })
    }
  },

  seekToFraction: (fraction) => {
    const { durationMs } = get()
    const pos = Math.max(0, Math.min(1, fraction)) * durationMs
    set({ segmentStartMs: pos, segmentStartAt: performance.now(), displayPositionMs: pos })
  },

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  tick: () => {
    const { isPlaying, segmentStartMs, segmentStartAt, durationMs } = get()
    if (!isPlaying) return
    const elapsed = performance.now() - segmentStartAt
    const pos = segmentStartMs + elapsed
    if (pos >= durationMs) {
      set({ displayPositionMs: durationMs, isPlaying: false, segmentStartMs: durationMs })
    } else {
      set({ displayPositionMs: pos })
    }
  },
}))
