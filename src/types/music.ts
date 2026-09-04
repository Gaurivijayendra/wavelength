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
  /** `spotify:track:...` URI — present only for Spotify-sourced tracks, used to start real playback. */
  uri?: string
}

export interface Playlist {
  id: string
  name: string
  description: string
  gradient: [string, string]
  /** Real cover image — present for Spotify-sourced playlists, preferred over `gradient` when set. */
  image?: string
  /** Spotify's owner id, needed to POST tracks into this playlist. */
  ownerId?: string
}
