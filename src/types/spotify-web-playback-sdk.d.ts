// Minimal ambient types for Spotify's Web Playback SDK — only what this app
// uses. No official @types package exists, so these are hand-written
// against https://developer.spotify.com/documentation/web-playback-sdk.

declare namespace Spotify {
  interface PlayerInit {
    name: string
    getOAuthToken: (callback: (token: string) => void) => void
    volume?: number
  }

  interface WebPlaybackArtist {
    name: string
    uri: string
  }

  interface WebPlaybackAlbum {
    name: string
    uri: string
    images: { url: string }[]
  }

  interface WebPlaybackTrack {
    id: string | null
    name: string
    uri: string
    duration_ms: number
    artists: WebPlaybackArtist[]
    album: WebPlaybackAlbum
  }

  interface WebPlaybackState {
    paused: boolean
    position: number
    duration: number
    track_window: { current_track: WebPlaybackTrack }
  }

  interface WebPlaybackError {
    message: string
  }

  interface WebPlaybackReady {
    device_id: string
  }

  class Player {
    constructor(init: PlayerInit)
    connect(): Promise<boolean>
    disconnect(): void
    togglePlay(): Promise<void>
    pause(): Promise<void>
    resume(): Promise<void>
    seek(positionMs: number): Promise<void>
    setVolume(volume: number): Promise<void>
    getCurrentState(): Promise<WebPlaybackState | null>
    addListener(event: 'ready' | 'not_ready', callback: (data: WebPlaybackReady) => void): boolean
    addListener(event: 'player_state_changed', callback: (state: WebPlaybackState | null) => void): boolean
    addListener(
      event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error',
      callback: (error: WebPlaybackError) => void,
    ): boolean
    removeListener(event: string): boolean
  }
}

interface Window {
  onSpotifyWebPlaybackSDKReady: () => void
  Spotify: typeof Spotify
}
