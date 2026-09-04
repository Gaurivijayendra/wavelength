# Wavelength

A Spotify-inspired music dashboard — a portfolio piece built to show production-quality
React + animation + real API-integration work.

> TODO: drop a screenshot or GIF of the dashboard here before sharing this README.

**Live:** _add your Vercel URL here_

## Tech stack

- React 18 + TypeScript, built with Vite
- Tailwind CSS for styling
- Framer Motion for hover states, stagger-in rows, and the now-playing progress bar
- TanStack Query for data fetching, caching, and loading/error state
- Zustand for player and auth state

## Real Spotify integration

Logging in with your own Spotify account (Authorization Code + PKCE — no client secret, no
backend) unlocks the real thing, not a simulation:

- **Real playback** through Spotify's Web Playback SDK if you have Premium — actual full songs,
  not previews. Falls back to a 30-second preview clip, then to a duration-only progress bar,
  for anything that can't stream.
- **Real personal data**: your actual Recently Played history, your Top Tracks (the "Made for
  You" row), Spotify's New Releases, and your real playlists in the sidebar.
- **Real playlist writes**: create a playlist from the sidebar, or add any track to one from the
  album detail view — both hit the real Spotify API and show up in your account.
- **Live search** in the top bar once logged in.

Logged out, the app still works end-to-end against the public, keyless iTunes Search API (see
below) — nothing is ever a dead end.

### One-time setup

1. Create an app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard),
   enable **Web API** and **Web Playback SDK**, and add a Redirect URI of
   `http://127.0.0.1:5174/callback` (must be `127.0.0.1`, not `localhost` — Spotify requires it
   for loopback redirects).
2. Copy the app's **Client ID** (no secret needed) into `.env.local`:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id_here
   ```
3. Run the dev server and open it at **`http://127.0.0.1:5174`** specifically — the redirect URI
   must match exactly what you registered.
4. When you deploy, add your production URL's `/callback` (e.g.
   `https://your-app.vercel.app/callback`) as a second Redirect URI in the dashboard.

Full-track playback additionally requires a Premium account — the Web Playback SDK doesn't work
on free accounts, so those fall back to previews automatically.

## Guest-mode data (no login)

Card rows are backed by **live, real data** from the public [iTunes Search
API](https://performance-partners.apple.com/search-api) — real track names, artists, albums,
and cover art, fetched client-side with no API key required. If a lookup fails or returns
nothing, each row falls back to a small bundled dataset so the UI never breaks.

Both data sources normalize into the same `Track`/`Playlist` shape (`src/types/music.ts`), so
`src/lib/queries.ts` can switch between them per-hook based on login state without the
components caring which one is active.

## Explicitly out of scope

- Persisting anything client-side beyond the Spotify auth tokens (no local playlist storage)
- Full page routing (this stays a single-page dashboard; `/callback` is handled without a router)

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
npm run preview
\`\`\`
