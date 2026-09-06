import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, X } from 'lucide-react'
import type { Track } from '../types/music'
import { useAlbumTracklist } from '../lib/queries'
import { usePlayerStore } from '../store/usePlayerStore'
import { formatDuration } from '../lib/format'
import { AlbumArt } from './AlbumArt'

interface TrackDetailModalProps {
  track: Track | null
  onClose: () => void
}

export function TrackDetailModal({ track, onClose }: TrackDetailModalProps) {
  const { data: tracklist, isLoading } = useAlbumTracklist(track)
  const { currentTrack, isPlaying, playOrToggle } = usePlayerStore()

  useEffect(() => {
    if (!track) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [track, onClose])

  const rows = tracklist && tracklist.length > 0 ? tracklist : track ? [track] : []

  return (
    <AnimatePresence>
      {track && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="thin-scrollbar relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-elevated sm:rounded-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative overflow-hidden rounded-t-2xl px-6 pb-6 pt-10 sm:rounded-t-2xl">
              <div className="absolute inset-0 -z-10 opacity-40 blur-2xl">
                <AlbumArt track={track} className="h-full w-full scale-125" rounded="rounded-none" />
              </div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/10 to-elevated" />
              <div className="flex items-end gap-5">
                <AlbumArt track={track} className="h-32 w-32 shrink-0 shadow-card sm:h-40 sm:w-40" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Album</p>
                  <h2 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
                    {track.album.name}
                  </h2>
                  <p className="mt-2 truncate text-sm text-text-secondary">
                    {track.artists.map((a) => a.name).join(', ')}
                    {rows.length > 1 ? ` · ${rows.length} tracks` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 pb-8 pt-4 sm:px-6">
              <button
                type="button"
                onClick={() => playOrToggle(rows[0])}
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-black transition-transform hover:scale-105"
                aria-label="Play album"
              >
                {currentTrack?.id === rows[0]?.id && isPlaying ? (
                  <Pause className="h-5 w-5 fill-black" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 fill-black" />
                )}
              </button>

              <ol className="flex flex-col">
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-4 rounded-md px-2 py-2.5">
                      <div className="skeleton h-4 w-5 rounded" />
                      <div className="skeleton h-10 w-10 shrink-0 rounded" />
                      <div className="flex-1">
                        <div className="skeleton mb-1.5 h-3.5 w-2/5 rounded" />
                        <div className="skeleton h-3 w-1/5 rounded" />
                      </div>
                    </li>
                  ))}

                {!isLoading &&
                  rows.map((t, i) => {
                    const active = currentTrack?.id === t.id
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => playOrToggle(t)}
                          className="group grid w-full grid-cols-[24px_1fr_auto] items-center gap-4 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-white/5"
                        >
                          <span className="text-center text-sm text-text-muted">
                            {active && isPlaying ? (
                              <Pause className="mx-auto h-3.5 w-3.5 fill-accent text-accent" />
                            ) : (
                              <>
                                <span className="group-hover:hidden">{i + 1}</span>
                                <Play className="mx-auto hidden h-3.5 w-3.5 fill-text-primary text-text-primary group-hover:block" />
                              </>
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-medium ${active ? 'text-accent' : 'text-text-primary'}`}>
                              {t.name}
                            </p>
                            <p className="truncate text-xs text-text-secondary">
                              {t.artists.map((a) => a.name).join(', ')}
                            </p>
                          </div>
                          <span className="text-xs tabular-nums text-text-muted">{formatDuration(t.durationMs)}</span>
                        </button>
                      </li>
                    )
                  })}
              </ol>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
