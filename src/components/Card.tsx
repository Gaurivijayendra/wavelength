import { motion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import type { Track } from '../types/music'
import { usePlayerStore } from '../store/usePlayerStore'
import { AlbumArt } from './AlbumArt'

interface CardProps {
  track: Track
  onOpen: (track: Track) => void
}

const artVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.04 },
}

const overlayVariants = {
  rest: { opacity: 0, y: 8 },
  hover: { opacity: 1, y: 0 },
}

export function Card({ track, onOpen }: CardProps) {
  const subtitle = track.artists.map((a) => a.name).join(', ')
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const playOrToggle = usePlayerStore((s) => s.playOrToggle)
  const isActive = currentTrack?.id === track.id

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="w-[168px] shrink-0 snap-start rounded-xl bg-elevated/60 p-3 transition-colors duration-150 hover:bg-elevated2 sm:w-[180px]"
    >
      <motion.div
        variants={{ rest: { y: 0 }, hover: { y: -4 } }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg shadow-card"
      >
        <button
          type="button"
          onClick={() => onOpen(track)}
          aria-label={`Open ${track.album.name}`}
          className="block h-full w-full text-left"
        >
          <motion.div variants={artVariants} transition={{ duration: 0.15, ease: 'easeOut' }} className="h-full w-full">
            <AlbumArt track={track} className="h-full w-full" rounded="rounded-none" />
          </motion.div>
        </button>
        <motion.button
          type="button"
          onClick={() => playOrToggle(track)}
          variants={overlayVariants}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          aria-label={isActive && isPlaying ? `Pause ${track.name}` : `Play ${track.name}`}
          className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-accent shadow-lg transition-transform hover:scale-105"
        >
          {isActive && isPlaying ? (
            <Pause className="h-5 w-5 fill-black text-black" />
          ) : (
            <Play className="ml-0.5 h-5 w-5 fill-black text-black" />
          )}
        </motion.button>
      </motion.div>
      <button type="button" onClick={() => onOpen(track)} className="block w-full text-left">
        <p className={`truncate text-sm font-semibold ${isActive ? 'text-accent' : 'text-text-primary'}`}>
          {track.name}
        </p>
        <p className="mt-1 truncate text-xs text-text-secondary">{subtitle}</p>
      </button>
    </motion.div>
  )
}
