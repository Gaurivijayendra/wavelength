# Wavelength

A Spotify-inspired music dashboard — but it isn't a mockup. Log in with your own Spotify account and it plays your actual music, pulls your actual listening history, and writes to your actual playlists. Logged out, it still works end to end against a free public API instead of going dead.

I built this as a portfolio piece specifically to avoid the thing most "clone" projects do: fake data behind a pretty UI. Every row on this dashboard is either real Spotify data or a real fallback — never a hardcoded placeholder pretending to be live.

## What's actually real here

**Full playback**, not 30-second previews — if you're logged in with Spotify Premium, songs play in full through Spotify's own Web Playback SDK. Free accounts and anything that can't stream fall back gracefully: first to a preview clip, then to a duration-only progress bar. Nothing dead-ends.

**Your real data** — Recently Played, Top Tracks (the "Made for You" row), New Releases, and your actual playlists in the sidebar. Not seeded, not mocked.

**Real writes** — create a playlist from the sidebar, or add a track to one from the album view, and it hits the real Spotify API. It shows up in your account, not just in this app's state.

**Live search** in the top bar once you're logged in.

Auth is Authorization Code + PKCE — no client secret, no backend server holding your credentials. Everything happens client-side.

**Logged out**, none of this requires an account: card rows are backed by live results from the public, keyless iTunes Search API, so you get real track names, artists, albums, and cover art without signing in. If a lookup comes back empty, a small bundled dataset fills the gap so the UI never shows a broken row.

Both data sources — Spotify and iTunes — normalize into the same `Track`/`Playlist` shape, so the app can switch between them per-hook based on login state without any component needing to know which one is active.

## Stack

- **React 18 + TypeScript**, built with Vite
- **Tailwind CSS** for styling
- **Framer Motion** for hover states, staggered row entrances, and the now-playing progress bar
- **TanStack Query** for data fetching, caching, and loading/error states
- **Zustand** for player and auth state

## One-time setup

1. Create an app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), enable the Web API and Web Playback SDK, and add a redirect URI of `http://127.0.0.1:5174/callback`.
   > Has to be `127.0.0.1`, not `localhost` — Spotify requires it for loopback redirects.
2. Drop your app's Client ID (no secret needed) into `.env.local`:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id_here
   ```
3. Run the dev server and open it at `http://127.0.0.1:5174` specifically — the redirect URI has to match exactly what you registered.
4. When you deploy, add your production URL's `/callback` (e.g. `https://your-app.vercel.app/callback`) as a second redirect URI in the dashboard.

Full-track playback also requires Spotify Premium — the Web Playback SDK simply doesn't work on free accounts, which is why those fall back to previews automatically rather than failing.

## Running it

```bash
npm install
npm run dev
```

Build:
```bash
npm run build
npm run preview
```

## Deliberately out of scope

- Any client-side persistence beyond the Spotify auth tokens — no local playlist storage
- Full page routing — this stays a single-page dashboard, and `/callback` is handled without a router

## Why I built it this way

Most portfolio "Spotify clone" projects are static screenshots wearing a UI framework. I wanted something a reviewer could actually log into and use — where the now-playing bar is playing a real song, the sidebar is your real playlists, and adding a track to a playlist actually does something. The guest mode exists so nobody has to trust a stranger's OAuth flow just to see the app work.
