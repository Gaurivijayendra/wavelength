import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { usePlayerStore } from '../store/usePlayerStore'
import { useOwnerProfile, useTrackSearch } from '../lib/queries'
import { AlbumArt } from './AlbumArt'

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

export function TopNav() {
  const { data: profile } = useOwnerProfile()
  const playTrack = usePlayerStore((s) => s.playTrack)

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounced(query, 300)
  const { data: results, isFetching } = useTrackSearch(debouncedQuery)
  const showResults = query.trim().length > 1

  const searchBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) setQuery('')
    }
    window.addEventListener('mousedown', onClickAway)
    return () => window.removeEventListener('mousedown', onClickAway)
  }, [])

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-base/80 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Back"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-text-primary transition-colors hover:bg-black/60"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Forward"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-text-primary transition-colors hover:bg-black/60"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div ref={searchBoxRef} className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs..."
          className="w-full rounded-full bg-elevated py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/60"
        />

        {showResults && (
          <div className="thin-scrollbar absolute left-0 right-0 top-12 z-20 max-h-96 overflow-y-auto rounded-xl border border-line bg-elevated2 py-1 shadow-card">
            {isFetching && <p className="px-4 py-3 text-xs text-text-muted">Searching…</p>}
            {!isFetching && results?.length === 0 && (
              <p className="px-4 py-3 text-xs text-text-muted">No results for "{query}"</p>
            )}
            {!isFetching &&
              results?.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    playTrack(t)
                    setQuery('')
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/5"
                >
                  <AlbumArt track={t} className="h-9 w-9 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{t.name}</p>
                    <p className="truncate text-xs text-text-secondary">{t.artists.map((a) => a.name).join(', ')}</p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2" title={`${profile?.displayName ?? 'Live'}'s Spotify`}>
        <span className="hidden text-xs font-medium text-text-secondary sm:inline">{profile?.displayName}</span>
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent-gradient text-xs font-bold text-black">
          {profile?.imageUrl ? (
            <img src={profile.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            (profile?.displayName ?? '?').slice(0, 2).toUpperCase()
          )}
        </div>
      </div>
    </div>
  )
}
