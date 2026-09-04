import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

export function TopNav() {
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

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="What do you want to listen to?"
          className="w-full rounded-full bg-elevated py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/60"
        />
      </div>

      <button
        type="button"
        aria-label="Profile"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-gradient text-xs font-bold text-black"
      >
        GV
      </button>
    </div>
  )
}
