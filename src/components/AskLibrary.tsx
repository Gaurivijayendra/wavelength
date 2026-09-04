import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { askLibrary, fetchTracksByIds } from '../lib/spotify'
import { Card } from './Card'
import { SkeletonCard } from './SkeletonCard'
import type { Track } from '../types/music'

const SUGGESTIONS = ['rainy coding session', 'sunday morning coffee', 'hype before a workout', 'late night drive']

interface AskLibraryProps {
  onOpenTrack: (track: Track) => void
}

type Status = 'idle' | 'loading' | 'error'

export function AskLibrary({ onOpenTrack }: AskLibraryProps) {
  const [prompt, setPrompt] = useState('')
  const [blurb, setBlurb] = useState<string | null>(null)
  const [tracks, setTracks] = useState<Track[] | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const run = async (text: string) => {
    const q = text.trim()
    if (!q || status === 'loading') return
    setStatus('loading')
    setBlurb(null)
    setTracks(null)
    setErrorMsg('')

    try {
      const result = await askLibrary(q)
      if (result.trackIds.length === 0) {
        setStatus('error')
        setErrorMsg(result.blurb || "Couldn't find a match for that — try a different vibe.")
        return
      }
      const full = await fetchTracksByIds(result.trackIds)
      // Keep the AI's chosen listening order, not whatever order the API returns.
      const ordered = result.trackIds.map((id) => full.find((t) => t.id === id)).filter((t): t is Track => Boolean(t))
      setTracks(ordered)
      setBlurb(result.blurb)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mb-8 px-4 sm:px-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">Ask your library</h2>
      </div>
      <p className="mb-3 max-w-xl text-sm text-text-secondary">
        Describe a mood or moment — an AI picks a real set from actual listening history, not a canned algorithm.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void run(prompt)
        }}
        className="mb-3 flex gap-2"
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. “a rainy coding session”"
          className="w-full max-w-md rounded-full bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/60"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !prompt.trim()}
          className="shrink-0 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
        >
          {status === 'loading' ? 'Thinking…' : 'Build it'}
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setPrompt(s)
              void run(s)
            }}
            disabled={status === 'loading'}
            className="rounded-full bg-elevated px-3 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-4 overflow-x-auto pb-2"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        )}

        {status === 'error' && (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-text-muted"
          >
            {errorMsg}
          </motion.p>
        )}

        {tracks && blurb !== null && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="mb-3 text-sm italic text-text-secondary">"{blurb}"</p>
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 snap-x">
              {tracks.map((t) => (
                <Card key={t.id} track={t} onOpen={onOpenTrack} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
