import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import type { Track } from '../types/music'
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

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(track)}
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="w-[168px] shrink-0 snap-start rounded-xl bg-elevated/60 p-3 text-left transition-colors duration-150 hover:bg-elevated2 sm:w-[180px]"
    >
      <motion.div
        variants={{ rest: { y: 0 }, hover: { y: -4 } }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg shadow-card"
      >
        <motion.div variants={artVariants} transition={{ duration: 0.15, ease: 'easeOut' }} className="h-full w-full">
          <AlbumArt track={track} className="h-full w-full" rounded="rounded-none" />
        </motion.div>
        <motion.div
          variants={overlayVariants}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="pointer-events-none absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-accent shadow-lg"
        >
          <Play className="ml-0.5 h-5 w-5 fill-black text-black" />
        </motion.div>
      </motion.div>
      <p className="truncate text-sm font-semibold text-text-primary">{track.name}</p>
      <p className="mt-1 truncate text-xs text-text-secondary">{subtitle}</p>
    </motion.button>
  )
}
