import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, X } from 'lucide-react'
import type { Playlist } from '../types/music'

interface PlaylistDetailModalProps {
  playlist: Playlist | null
  onClose: () => void
}

export function PlaylistDetailModal({ playlist, onClose }: PlaylistDetailModalProps) {
  useEffect(() => {
    if (!playlist) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [playlist, onClose])

  return (
    <AnimatePresence>
      {playlist && (
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
            className="relative w-full max-w-md rounded-t-2xl bg-elevated p-6 sm:rounded-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center pt-2 text-center">
              {playlist.image ? (
                <img src={playlist.image} alt="" className="h-40 w-40 rounded shadow-card" />
              ) : (
                <div
                  className="h-40 w-40 rounded shadow-card"
                  style={{ background: `linear-gradient(135deg, ${playlist.gradient[0]}, ${playlist.gradient[1]})` }}
                />
              )}
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-text-secondary">Playlist</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-text-primary">{playlist.name}</h2>
              <p className="mt-2 text-sm text-text-secondary">{playlist.description}</p>

              <p className="mt-6 max-w-xs text-xs text-text-muted">
                Spotify doesn't allow apps like this one to list a playlist's tracks without an app review it hasn't
                gone through — open it in Spotify to see what's inside.
              </p>

              <a
                href={`https://open.spotify.com/playlist/${playlist.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-105"
              >
                Open in Spotify
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
