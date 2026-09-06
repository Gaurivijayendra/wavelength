import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Pause, Play, Volume1, Volume2, VolumeX } from 'lucide-react'
import { usePlayerStore } from '../store/usePlayerStore'
import { formatDuration } from '../lib/format'
import { AlbumArt } from './AlbumArt'

/** `spotify:track:<id>` → a universal open.spotify.com link (opens the app if installed). */
function spotifyTrackUrl(uri: string | undefined): string | null {
  if (!uri) return null
  const id = uri.split(':').pop()
  return id ? `https://open.spotify.com/track/${id}` : null
}

export function NowPlayingBar() {
  const {
    currentTrack,
    isPlaying,
    mode,
    durationMs,
    segmentStartMs,
    displayPositionMs,
    volume,
    togglePlay,
    seekToFraction,
    setVolume,
    tick,
  } = usePlayerStore()

  useEffect(() => {
    if (!isPlaying) return
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [isPlaying, tick])

  const barRef = useRef<HTMLDivElement>(null)

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = barRef.current
    if (!el || !currentTrack) return
    const rect = el.getBoundingClientRect()
    const fraction = (e.clientX - rect.left) / rect.width
    seekToFraction(fraction)
  }

  const startFraction = durationMs > 0 ? segmentStartMs / durationMs : 0
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2
  // We couldn't stream this locally (no Premium/SDK, or the browser lacks
  // DRM support) — offer the one thing that always actually works instead
  // of a progress bar with no sound behind it.
  const openInSpotifyUrl = mode === 'simulated' ? spotifyTrackUrl(currentTrack?.uri) : null

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-black/55 px-4 py-3 shadow-bar backdrop-blur-xl sm:px-6">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-3">
        {/* Track info */}
        <div className="flex min-w-0 items-center gap-3">
          {currentTrack ? (
            <AlbumArt track={currentTrack} className="h-12 w-12" rounded="rounded" />
          ) : (
            <div className="h-12 w-12 rounded bg-elevated" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">
              {currentTrack ? currentTrack.name : 'Nothing playing'}
            </p>
            <p className="truncate text-xs text-text-secondary">
              {currentTrack ? currentTrack.artists.map((a) => a.name).join(', ') : 'Pick a track above'}
              {mode === 'preview' && <span className="ml-1.5 text-text-muted">· 30s preview</span>}
            </p>
            {openInSpotifyUrl && (
              <a
                href={openInSpotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                Open in Spotify <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Transport + progress */}
        <div className="hidden min-w-0 flex-col items-center gap-1.5 sm:flex">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!currentTrack}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-transform duration-150 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-black" /> : <Play className="ml-0.5 h-4 w-4 fill-black" />}
          </button>

          <div className="flex w-full max-w-xl items-center gap-2">
            <span className="w-9 text-right text-[11px] tabular-nums text-text-muted">
              {formatDuration(displayPositionMs)}
            </span>
            <div
              ref={barRef}
              onClick={handleSeek}
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={durationMs}
              aria-valuenow={displayPositionMs}
              className="group relative h-1 flex-1 cursor-pointer rounded-full bg-white/20"
            >
              <motion.div
                key={`${currentTrack?.id ?? 'none'}-${isPlaying}-${segmentStartMs}-${durationMs}`}
                initial={{ width: `${startFraction * 100}%` }}
                animate={{ width: isPlaying ? '100%' : `${startFraction * 100}%` }}
                transition={{
                  duration: isPlaying ? Math.max((durationMs - segmentStartMs) / 1000, 0) : 0,
                  ease: 'linear',
                }}
                className="absolute inset-y-0 left-0 rounded-full bg-white group-hover:bg-accent"
              />
            </div>
            <span className="w-9 text-[11px] tabular-nums text-text-muted">{formatDuration(durationMs)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden items-center justify-end gap-2 sm:flex">
          <VolumeIcon className="h-4 w-4 text-text-secondary" />
          <input
            type="range"
            className="wl-range w-24"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
          />
        </div>

        {/* Compact mobile play button */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={!currentTrack}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full bg-white text-black disabled:opacity-30 sm:hidden"
        >
          {isPlaying ? <Pause className="h-4 w-4 fill-black" /> : <Play className="ml-0.5 h-4 w-4 fill-black" />}
        </button>
      </div>
    </div>
  )
}
