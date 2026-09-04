import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopNav } from './components/TopNav'
import { GreetingHeader } from './components/GreetingHeader'
import { CardRow } from './components/CardRow'
import { NowPlayingBar } from './components/NowPlayingBar'
import { TrackDetailModal } from './components/TrackDetailModal'
import { useMadeForYou, usePopularAlbums, useRecentlyPlayed } from './lib/queries'
import type { Track } from './types/music'

function App() {
  const [openTrack, setOpenTrack] = useState<Track | null>(null)

  const recentlyPlayed = useRecentlyPlayed()
  const madeForYou = useMadeForYou()
  const popularAlbums = usePopularAlbums()

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <Sidebar />

      <main className="thin-scrollbar min-w-0 flex-1 overflow-y-auto pb-28">
        <TopNav />
        <GreetingHeader />

        <CardRow
          index={0}
          title="Recently played"
          items={recentlyPlayed.data}
          isLoading={recentlyPlayed.isLoading}
          isError={recentlyPlayed.isError}
          onOpenTrack={setOpenTrack}
        />
        <CardRow
          index={1}
          title="Made for you"
          items={madeForYou.data}
          isLoading={madeForYou.isLoading}
          isError={madeForYou.isError}
          onOpenTrack={setOpenTrack}
        />
        <CardRow
          index={2}
          title="Popular albums"
          items={popularAlbums.data}
          isLoading={popularAlbums.isLoading}
          isError={popularAlbums.isError}
          onOpenTrack={setOpenTrack}
        />
      </main>

      <NowPlayingBar />
      <TrackDetailModal track={openTrack} onClose={() => setOpenTrack(null)} />
    </div>
  )
}

export default App
