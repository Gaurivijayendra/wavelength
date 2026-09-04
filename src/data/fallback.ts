import type { Track } from '../types/music'

// Fully offline fallback — used only if the live iTunes lookup fails entirely
// (see src/lib/itunes.ts). No network dependency, so it always renders.
function track(id: string, name: string, artist: string, album: string, ms: number): Track {
  return {
    id,
    name,
    artists: [{ id: `artist-${id}`, name: artist }],
    album: {
      id: `album-${id}`,
      name: album,
      images: [],
    },
    durationMs: ms,
  }
}

export const FALLBACK_RECENTLY_PLAYED: Track[] = [
  track('f1', 'Nightcall', 'Kavinsky', 'Nightcall', 253000),
  track('f2', 'Instant Crush', 'Daft Punk', 'Random Access Memories', 337000),
  track('f3', 'Redbone', 'Childish Gambino', 'Awaken, My Love!', 326000),
  track('f4', 'The Less I Know the Better', 'Tame Impala', 'Currents', 216000),
  track('f5', '電気予報', 'Yellow Magic Orchestra', 'BGM', 244000),
  track('f6', 'Sunflower', 'Rex Orange County', 'Pony', 190000),
]

export const FALLBACK_MADE_FOR_YOU: Track[] = [
  track('f7', 'Dreams', 'Fleetwood Mac', 'Rumours', 257000),
  track('f8', '505', 'Arctic Monkeys', 'Favourite Worst Nightmare', 253000),
  track('f9', 'Say So', 'Doja Cat', 'Hot Pink', 237000),
  track('f10', 'Alright', 'Kendrick Lamar', 'To Pimp a Butterfly', 219000),
  track('f11', 'Space Song', 'Beach House', 'Depression Cherry', 320000),
  track('f12', 'Deacon Blues', 'Steely Dan', 'Aja', 337000),
]

export const FALLBACK_POPULAR_ALBUMS: Track[] = [
  track('f13', 'Abbey Road', 'The Beatles', 'Abbey Road', 0),
  track('f14', 'Random Access Memories', 'Daft Punk', 'Random Access Memories', 0),
  track('f15', 'To Pimp a Butterfly', 'Kendrick Lamar', 'To Pimp a Butterfly', 0),
  track('f16', 'Rumours', 'Fleetwood Mac', 'Rumours', 0),
  track('f17', 'Blonde', 'Frank Ocean', 'Blonde', 0),
  track('f18', 'OK Computer', 'Radiohead', 'OK Computer', 0),
]
