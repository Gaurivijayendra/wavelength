import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopNav } from './components/TopNav'
import { GreetingHeader } from './components/GreetingHeader'
import { AskLibrary } from './components/AskLibrary'
import { CardRow } from './components/CardRow'
import { NowPlayingBar } from './components/NowPlayingBar'
import { TrackDetailModal } from './components/TrackDetailModal'
import { useLikedSongs, useMadeForYou, useRecentlyPlayed } from './lib/queries'
import type { Track } from './types/music'

function App() {
  const [openTrack, setOpenTrack] = useState<Track | null>(null)

  const recentlyPlayed = useRecentlyPlayed()
  const madeForYou = useMadeForYou()
  const likedSongs = useLikedSongs()

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <Sidebar />

      <main className="thin-scrollbar min-w-0 flex-1 overflow-y-auto pb-28">
        <TopNav />
        <GreetingHeader />
        <AskLibrary onOpenTrack={setOpenTrack} />

        <CardRow
          index={0}
          title="Recently played"
          items={recentlyPlayed.data}
          isLoading={recentlyPlayed.isLoading}
          isError={recentlyPlayed.isError}
          onRetry={recentlyPlayed.refetch}
          onOpenTrack={setOpenTrack}
        />
        <CardRow
          index={1}
          title="Made for you"
          items={madeForYou.data}
          isLoading={madeForYou.isLoading}
          isError={madeForYou.isError}
          onRetry={madeForYou.refetch}
          onOpenTrack={setOpenTrack}
        />
        <CardRow
          index={2}
          title="Liked songs"
          items={likedSongs.data}
          isLoading={likedSongs.isLoading}
          isError={likedSongs.isError}
          onRetry={likedSongs.refetch}
          onOpenTrack={setOpenTrack}
        />
      </main>

      <NowPlayingBar />
      <TrackDetailModal track={openTrack} onClose={() => setOpenTrack(null)} />
    </div>
  )
}

export default App
