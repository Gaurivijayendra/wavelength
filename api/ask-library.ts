// Serverless: "Ask your library" — an LLM picks a real mini-playlist out of
// the owner's actual listening history (not Spotify's recommendation
// engine, not canned data) based on a free-text mood/activity prompt.
//
// The model can ONLY respond via a schema-constrained tool call (forced
// tool_choice), so even an adversarial prompt can't make it emit free-form
// text — the worst case is a low-quality selection, not a prompt-injection
// escape. Track ids are re-validated server-side against the real pool
// before being returned, so a hallucinated id can never reach the client.

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

interface CandidateTrack {
  id: string
  name: string
  artist: string
}

interface RawTrackLike {
  id?: string
  name?: string
  artists?: { name: string }[]
}

interface ItemsResponse<T> {
  items?: T[]
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

async function fetchCandidatePool(accessToken: string): Promise<CandidateTrack[]> {
  const headers = { Authorization: `Bearer ${accessToken}` }

  const [recentlyPlayed, topTracks, likedSongs] = await Promise.all([
    fetchJson<ItemsResponse<{ track: RawTrackLike }>>(
      'https://api.spotify.com/v1/me/player/recently-played?limit=25',
      headers,
      {},
    ),
    fetchJson<ItemsResponse<RawTrackLike>>(
      'https://api.spotify.com/v1/me/top/tracks?limit=25&time_range=medium_term',
      headers,
      {},
    ),
    fetchJson<ItemsResponse<{ track: RawTrackLike }>>('https://api.spotify.com/v1/me/tracks?limit=25', headers, {}),
  ])

  const rawTracks: RawTrackLike[] = [
    ...(recentlyPlayed.items ?? []).map((i) => i.track),
    ...(topTracks.items ?? []),
    ...(likedSongs.items ?? []).map((i) => i.track),
  ]

  const seen = new Set<string>()
  const pool: CandidateTrack[] = []
  for (const t of rawTracks) {
    if (!t?.id || seen.has(t.id)) continue
    seen.add(t.id)
    pool.push({ id: t.id, name: t.name ?? 'Unknown', artist: (t.artists ?? []).map((a) => a.name).join(', ') })
  }
  return pool
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
    const pool = await fetchCandidatePool(accessToken)

    if (pool.length < 3) {
      res.status(200).json({ trackIds: [], blurb: 'Not enough listening history yet to build from.' })
      return
    }

    const poolText = pool.map((t) => `[${t.id}] ${t.name} — ${t.artist}`).join('\n')

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
    const validIds = new Set(pool.map((t) => t.id))
    const filteredIds = Array.isArray(toolInput.trackIds)
      ? toolInput.trackIds.filter((id): id is string => typeof id === 'string' && validIds.has(id))
      : []
    const blurb = typeof toolInput.blurb === 'string' ? toolInput.blurb : ''

    res.status(200).json({ trackIds: filteredIds, blurb })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
