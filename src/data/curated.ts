// Curated (term, expectedArtist) pairs that feed the live iTunes lookups in
// src/lib/itunes.ts. expectedArtist is used to pick the right result when a
// track/album title is ambiguous (e.g. "Blonde" has many covers/remixes) —
// picked for a diverse, demo-friendly dashboard rather than real listening
// history.

export interface CuratedQuery {
  term: string
  artist: string
}

export const RECENTLY_PLAYED_QUERIES: CuratedQuery[] = [
  { term: 'Nightcall', artist: 'Kavinsky' },
  { term: 'Instant Crush', artist: 'Daft Punk' },
  { term: 'Redbone', artist: 'Childish Gambino' },
  { term: 'Elephant', artist: 'Tame Impala' },
  { term: 'Sunflower', artist: 'Rex Orange County' },
  { term: 'Electric Feel', artist: 'MGMT' },
]

export const MADE_FOR_YOU_QUERIES: CuratedQuery[] = [
  { term: 'Dreams', artist: 'Fleetwood Mac' },
  { term: '505', artist: 'Arctic Monkeys' },
  { term: 'Say So', artist: 'Doja Cat' },
  { term: 'Alright', artist: 'Kendrick Lamar' },
  { term: 'Space Song', artist: 'Beach House' },
  { term: 'Deacon Blues', artist: 'Steely Dan' },
]

export const POPULAR_ALBUM_QUERIES: CuratedQuery[] = [
  { term: 'Abbey Road', artist: 'The Beatles' },
  { term: 'Random Access Memories', artist: 'Daft Punk' },
  { term: 'To Pimp a Butterfly', artist: 'Kendrick Lamar' },
  { term: 'Rumours', artist: 'Fleetwood Mac' },
  { term: 'Thriller', artist: 'Michael Jackson' },
  { term: 'OK Computer', artist: 'Radiohead' },
]
