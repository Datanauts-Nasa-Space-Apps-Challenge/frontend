import { AppStateProvider } from './state/AppState'
import { CompareView, GlobeView, MapView, SiteView } from './view/Screens'
import { useApp } from './state/AppState'

function Shell() {
  const { view } = useApp()
  return (
    <div className="app">
      {view === 'globe' ? <GlobeView /> : null}
      {view === 'map' ? <MapView /> : null}
      {view === 'site' ? <SiteView /> : null}
      {view === 'compare' ? <CompareView /> : null}
    </div>
  )
}

export function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  )
}
