import { useState } from 'react'
import { Music2 } from 'lucide-react'
import type { Track } from '../types/music'

interface AlbumArtProps {
  track: Pick<Track, 'album' | 'name'>
  className?: string
  rounded?: string
}

/** Cover art with a gradient + note-icon fallback for missing/broken artwork. */
export function AlbumArt({ track, className = '', rounded = 'rounded-md' }: AlbumArtProps) {
  const [errored, setErrored] = useState(false)
  const url = track.album.images[0]?.url

  if (!url || errored) {
    // Deterministic gradient from the title so the same "album" always gets the same tile.
    const hash = Array.from(track.album.name || track.name).reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const hue = hash % 360
    return (
      <div
        className={`flex items-center justify-center ${rounded} ${className}`}
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 70% 32%), hsl(${(hue + 60) % 360} 70% 22%))`,
        }}
      >
        <Music2 className="h-1/3 w-1/3 text-white/70" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={`${track.album.name} cover art`}
      loading="lazy"
      onError={() => setErrored(true)}
      className={`object-cover ${rounded} ${className}`}
    />
  )
}
