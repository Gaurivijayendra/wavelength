export interface Artist {
  id: string
  name: string
}

export interface AlbumImage {
  url: string
  width: number
  height: number
}

export interface Album {
  id: string
  name: string
  images: AlbumImage[]
  releaseDate?: string
}

export interface Track {
  id: string
  name: string
  artists: Artist[]
  album: Album
  durationMs: number
  previewUrl?: string | null
}

export interface Playlist {
  id: string
  name: string
  description: string
  gradient: [string, string]
}
