import type { Playlist } from '../types/music'

// Sidebar playlists are static by design (see build spec) — no network needed.
export const SIDEBAR_PLAYLISTS: Playlist[] = [
  { id: 'pl-1', name: 'Late Night Focus', description: 'Deep work, low tempo', gradient: ['#7c5cfc', '#22d3c8'] },
  { id: 'pl-2', name: 'Sunday Morning', description: 'Slow coffee, soft light', gradient: ['#f97316', '#f43f5e'] },
  { id: 'pl-3', name: 'Drive South', description: 'Windows down anthems', gradient: ['#0ea5e9', '#22d3c8'] },
  { id: 'pl-4', name: 'Analog Feelings', description: 'Warm, tape-saturated', gradient: ['#eab308', '#f97316'] },
  { id: 'pl-5', name: 'Deep Focus', description: 'Instrumental, no lyrics', gradient: ['#8b5cf6', '#3b82f6'] },
  { id: 'pl-6', name: 'Basement Tapes', description: 'Lo-fi & unreleased', gradient: ['#ec4899', '#7c5cfc'] },
  { id: 'pl-7', name: 'Golden Hour', description: 'Gold light, slow build', gradient: ['#f59e0b', '#ef4444'] },
  { id: 'pl-8', name: 'Night Drive', description: 'Synths after dark', gradient: ['#22d3c8', '#0ea5e9'] },
]
