import { motion } from 'framer-motion'
import { useRef } from 'react'
import type { Track } from '../types/music'
import { Card } from './Card'
import { SkeletonCard } from './SkeletonCard'

interface CardRowProps {
  title: string
  items: Track[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onOpenTrack: (track: Track) => void
  index?: number
}

export function CardRow({ title, items, isLoading, isError, onRetry, onOpenTrack, index = 0 }: CardRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; scrollLeft: number; dragging: boolean }>({
    startX: 0,
    scrollLeft: 0,
    dragging: false,
  })

  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollerRef.current
    if (!el) return
    dragState.current = { startX: e.clientX, scrollLeft: el.scrollLeft, dragging: true }
    el.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollerRef.current
    if (!el || !dragState.current.dragging) return
    el.scrollLeft = dragState.current.scrollLeft - (e.clientX - dragState.current.startX)
  }
  const onPointerUp = () => {
    dragState.current.dragging = false
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.08 }}
      className="mb-8"
    >
      <div className="mb-3 flex items-center justify-between px-4 sm:px-6">
        <h2 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">{title}</h2>
      </div>
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="no-scrollbar flex cursor-grab gap-4 overflow-x-auto scroll-smooth px-4 pb-2 snap-x active:cursor-grabbing sm:px-6"
      >
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

        {!isLoading && isError && (!items || items.length === 0) && (
          <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line text-sm text-text-muted">
            <p>Couldn't load this from Spotify.</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-elevated2 px-4 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-white/10"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading &&
          items?.map((track) => <Card key={track.id} track={track} onOpen={onOpenTrack} />)}
      </div>
    </motion.section>
  )
}
