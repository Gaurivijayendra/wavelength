// Serverless: "Ask your library" — an LLM picks a real mini-playlist out of
// the owner's actual listening history (not Spotify's recommendation
// engine, not canned data) based on a free-text mood/activity prompt.
//
// The model can ONLY respond via a schema-constrained tool call (forced
// tool_choice), so even an adversarial prompt can't make it emit free-form
// text — the worst case is a low-quality selection, not a prompt-injection
// escape. Track ids are re-validated server-side against the real pool
// before being returned, so a hallucinated id can never reach the client.
//
// Full track objects (art, duration, uri...) are taken straight from the
// same recently-played/top-tracks/liked-songs responses used to build the
// candidate pool — NOT re-fetched via /v1/tracks?ids=, which Spotify 403s
// for standard apps under its current API policy, same as new-releases.

import { getAccessToken } from './_lib/spotify.js'

interface VercelRequest {
  method?: string
  body?: unknown
}

interface VercelResponse {
  status(code: number): VercelResponse
  setHeader(name: string, value: string): void
  json(body: unknown): void
}

interface RawImage {
  url: string
  width?: number
  height?: number
}

interface RawArtist {
  id: string
  name: string
}

interface RawAlbum {
  id: string
  name: string
  images?: RawImage[]
  release_date?: string
}

interface RawTrack {
  id: string
  name: string
  uri: string
  duration_ms?: number
  preview_url?: string | null
  artists?: RawArtist[]
  album?: RawAlbum
}

interface NormalizedTrack {
  id: string
  name: string
  artists: { id: string; name: string }[]
  album: { id: string; name: string; images: { url: string; width: number; height: number }[]; releaseDate?: string }
  durationMs: number
  previewUrl: string | null
  uri: string
}

interface ItemsResponse<T> {
  items?: T[]
}

function normalizeTrack(raw: RawTrack): NormalizedTrack {
  return {
    id: raw.id,
    name: raw.name,
    artists: (raw.artists ?? []).map((a) => ({ id: a.id, name: a.name })),
    album: {
      id: raw.album?.id ?? raw.id,
      name: raw.album?.name ?? raw.name,
      images: (raw.album?.images ?? []).map((img) => ({ url: img.url, width: img.width ?? 0, height: img.height ?? 0 })),
      releaseDate: raw.album?.release_date,
    },
    durationMs: raw.duration_ms ?? 0,
    previewUrl: raw.preview_url ?? null,
    uri: raw.uri,
  }
}

async function fetchJson<T>(url: string, headers: Record<string, string>, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { headers })
    if (!res.ok) return fallback
    return (await res.json()) as T
  } catch {
    return fallback
  }
}

async function fetchCandidateTracks(accessToken: string): Promise<RawTrack[]> {
  const headers = { Authorization: `Bearer ${accessToken}` }

  const [recentlyPlayed, topTracks, likedSongs] = await Promise.all([
    fetchJson<ItemsResponse<{ track: RawTrack }>>('https://api.spotify.com/v1/me/player/recently-played?limit=25', headers, {}),
    fetchJson<ItemsResponse<RawTrack>>(
      'https://api.spotify.com/v1/me/top/tracks?limit=25&time_range=medium_term',
      headers,
      {},
    ),
    fetchJson<ItemsResponse<{ track: RawTrack }>>('https://api.spotify.com/v1/me/tracks?limit=25', headers, {}),
  ])

  const rawTracks: RawTrack[] = [
    ...(recentlyPlayed.items ?? []).map((i) => i.track),
    ...(topTracks.items ?? []),
    ...(likedSongs.items ?? []).map((i) => i.track),
  ]

  const seen = new Set<string>()
  const tracks: RawTrack[] = []
  for (const t of rawTracks) {
    if (!t?.id || seen.has(t.id)) continue
    seen.add(t.id)
    tracks.push(t)
  }
  return tracks
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
  const prompt = typeof (body as { prompt?: unknown }).prompt === 'string' ? (body as { prompt: string }).prompt.trim() : ''

  if (!prompt || prompt.length > 200) {
    res.status(400).json({ error: 'Give me a short mood or activity to work with.' })
    return
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' })
    return
  }

  try {
    const accessToken = await getAccessToken()
    const candidates = await fetchCandidateTracks(accessToken)

    if (candidates.length < 3) {
      res.status(200).json({ tracks: [], blurb: 'Not enough listening history yet to build from.' })
      return
    }

    const byId = new Map(candidates.map((t) => [t.id, t]))
    const poolText = candidates
      .map((t) => `[${t.id}] ${t.name} — ${(t.artists ?? []).map((a) => a.name).join(', ')}`)
      .join('\n')

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        tools: [
          {
            name: 'select_tracks',
            description: 'Select and order tracks from the given library that fit the requested mood or activity.',
            input_schema: {
              type: 'object',
              properties: {
                trackIds: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 3,
                  maxItems: 8,
                  description: 'Track ids from the given list, in listening order.',
                },
                blurb: {
                  type: 'string',
                  description: 'One short, vivid, specific sentence (max 25 words) about this selection.',
                },
              },
              required: ['trackIds', 'blurb'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'select_tracks' },
        messages: [
          {
            role: 'user',
            content:
              `Here is a real listener's Spotify library (id, title, artist), each line one track:\n\n${poolText}\n\n` +
              `Pick 5-8 tracks ONLY from this exact list (use the bracketed ids exactly as given) that best fit ` +
              `this mood or activity: "${prompt}". Sequence them into a natural listening arc. Then write one ` +
              `short, evocative sentence about the selection — specific to these actual songs, not generic.`,
          },
        ],
      }),
    })

    if (!aiRes.ok) {
      res.status(502).json({ error: `AI request failed: ${aiRes.status}` })
      return
    }

    interface AnthropicContentBlock {
      type: string
      input?: unknown
    }
    const aiData = (await aiRes.json()) as { content?: AnthropicContentBlock[] }
    const toolUse = (aiData.content ?? []).find((c) => c.type === 'tool_use')
    if (!toolUse) {
      res.status(502).json({ error: 'AI did not return a selection' })
      return
    }

    const toolInput = toolUse.input as { trackIds?: unknown; blurb?: unknown }
    const orderedIds = Array.isArray(toolInput.trackIds)
      ? toolInput.trackIds.filter((id): id is string => typeof id === 'string' && byId.has(id))
      : []
    const blurb = typeof toolInput.blurb === 'string' ? toolInput.blurb : ''

    const tracks = orderedIds.map((id) => normalizeTrack(byId.get(id)!))

    res.status(200).json({ tracks, blurb })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
