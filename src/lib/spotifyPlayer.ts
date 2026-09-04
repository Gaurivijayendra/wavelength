// Loads and owns the single Spotify Web Playback SDK player instance for
// the app. Requires the user to be logged in with a Premium account —
// usePlayerStore falls back to preview/simulated playback if this fails.

export interface SpotifyPlayerHandle {
  player: Spotify.Player
  deviceId: string
}

let sdkLoadPromise: Promise<void> | null = null
let playerHandlePromise: Promise<SpotifyPlayerHandle> | null = null

function loadSdkScript(): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise
  sdkLoadPromise = new Promise((resolve, reject) => {
    if (window.Spotify) {
      resolve()
      return
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve()
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    script.onerror = () => reject(new Error('Failed to load the Spotify Web Playback SDK'))
    document.body.appendChild(script)
  })
  return sdkLoadPromise
}

/**
 * Creates (once) and returns the app's Spotify player + its device id.
 * Subsequent calls return the same in-flight/resolved promise.
 */
export function ensureSpotifyPlayer(
  getOAuthToken: (callback: (token: string) => void) => void,
  onStateChanged: (state: Spotify.WebPlaybackState | null) => void,
): Promise<SpotifyPlayerHandle> {
  if (playerHandlePromise) return playerHandlePromise

  playerHandlePromise = (async () => {
    await loadSdkScript()

    return new Promise<SpotifyPlayerHandle>((resolve, reject) => {
      const player = new window.Spotify.Player({
        name: 'Wavelength Web Player',
        getOAuthToken,
        volume: 0.75,
      })

      player.addListener('player_state_changed', onStateChanged)
      player.addListener('ready', ({ device_id }) => resolve({ player, deviceId: device_id }))
      player.addListener('initialization_error', ({ message }) => reject(new Error(message)))
      player.addListener('authentication_error', ({ message }) => reject(new Error(message)))
      player.addListener('account_error', ({ message }) => reject(new Error(`Spotify account error: ${message}`)))

      player.connect().then((connected) => {
        if (!connected) reject(new Error('Spotify player failed to connect'))
      })
    })
  })()

  playerHandlePromise.catch(() => {
    playerHandlePromise = null // allow a retry on the next playTrack
  })

  return playerHandlePromise
}
