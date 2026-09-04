import { motion } from 'framer-motion'
import { Home, Library, Search, AudioWaveform } from 'lucide-react'
import { SIDEBAR_PLAYLISTS } from '../data/playlists'

const NAV_ITEMS = [
  { icon: Home, label: 'Home' },
  { icon: Search, label: 'Search' },
  { icon: Library, label: 'Your Library' },
]

export function Sidebar() {
  return (
    <aside className="hidden w-20 shrink-0 flex-col border-r border-line bg-surface py-6 sm:flex lg:w-64">
      <div className="mb-8 flex items-center gap-2.5 px-4 lg:px-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-gradient">
          <AudioWaveform className="h-4.5 w-4.5 text-black" strokeWidth={2.5} />
        </div>
        <span className="hidden text-lg font-extrabold tracking-tight text-text-primary lg:inline">
          Wavelength
        </span>
      </div>

      <nav className="mb-8 flex flex-col gap-1 px-2 lg:px-4">
        {NAV_ITEMS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            className="group flex items-center gap-4 rounded-md px-2 py-2 text-sm font-semibold text-text-secondary transition-colors duration-150 hover:text-text-primary lg:px-3"
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span className="hidden lg:inline">{label}</span>
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 lg:px-4">
        <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wider text-text-muted lg:block">
          Playlists
        </p>
        <ul className="flex flex-col gap-0.5">
          {SIDEBAR_PLAYLISTS.map((pl) => (
            <li key={pl.id}>
              <motion.button
                type="button"
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="relative flex w-full items-center gap-3 rounded-md py-2 pl-3 pr-2 text-left before:absolute before:left-0 before:top-1/2 before:h-0 before:w-0.5 before:-translate-y-1/2 before:bg-accent before:transition-all before:duration-150 hover:before:h-3/4 lg:pl-3"
              >
                <div
                  className="h-9 w-9 shrink-0 rounded"
                  style={{ background: `linear-gradient(135deg, ${pl.gradient[0]}, ${pl.gradient[1]})` }}
                />
                <div className="hidden min-w-0 lg:block">
                  <p className="truncate text-sm font-medium text-text-primary">{pl.name}</p>
                  <p className="truncate text-xs text-text-muted">{pl.description}</p>
                </div>
              </motion.button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
