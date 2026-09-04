# Wavelength

A Spotify-inspired music dashboard — a portfolio piece built to show production-quality
React + animation + API-integration work, not a Spotify clone or a real product.

> TODO: drop a screenshot or GIF of the dashboard here before sharing this README.

**Live:** _add your Vercel URL here_

## Tech stack

- React 18 + TypeScript, built with Vite
- Tailwind CSS for styling
- Framer Motion for hover states, stagger-in rows, and the now-playing progress bar
- TanStack Query for data fetching, caching, and loading/error state
- Zustand for the now-playing player state

## Data

Card rows are backed by **live, real data** from the public [iTunes Search
API](https://performance-partners.apple.com/search-api) — real track names, artists, albums,
and cover art, fetched client-side with no API key or server proxy required. If a lookup fails
or returns nothing, each row falls back to a small bundled dataset so the UI never breaks.

The fetch layer (`src/lib/itunes.ts`, `src/lib/queries.ts`) normalizes everything into one
`Track` shape (`src/types/music.ts`) modeled on the real Spotify Web API response shape, so
swapping in Spotify's Client Credentials flow later is a matter of writing new fetch functions
against the same shape — not a rewrite.

## Explicitly out of scope

- Real audio playback (the progress bar animates against each track's real duration, no audio)
- User login / auth
- Persisting playlists
- Full search, or routing between real pages

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
