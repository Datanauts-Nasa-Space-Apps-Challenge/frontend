import { siteById, sites } from '../data/sites'
import { useApp } from '../state/AppState'
import { MapGrid } from './MapGrid'
import { MoonGlobe } from './MoonGlobe'
import { SitePane } from './SitePane'
import { Timeline } from './Timeline'

export function GlobeView() {
  const { globeFocus, descendToMap, openSite } = useApp()
  return (
    <div className="screen screen--enter">
      <MoonGlobe focus={globeFocus} onDescend={descendToMap} onSelect={openSite} />
      <div className="chrome">
        <header>
          <p className="kicker">Lunar surface</p>
          <h1>Landing sites</h1>
          <p>Scroll in. Near the ground the view becomes a latitude and longitude grid.</p>
        </header>
        <footer>
          <p>{sites.length} sites</p>
          <p>Click a name, or descend into the grid.</p>
        </footer>
      </div>
    </div>
  )
}

export function MapView() {
  const { mapCenter, mapSpan, setMapCenter, setMapSpan, returnToGlobe, openSite } = useApp()
  return (
    <div className="screen screen--enter map-screen">
      <div className="map-bar">
        <button type="button" className="text-action" onClick={returnToGlobe}>
          Back to Moon
        </button>
        <div>
          <p className="kicker">Surface grid</p>
          <h1>Sites in view stay marked</h1>
        </div>
        <div className="zoom-pair">
          <button type="button" onClick={() => setMapSpan(mapSpan / 1.25)} aria-label="Zoom in">
            +
          </button>
          <button type="button" onClick={() => setMapSpan(mapSpan * 1.25)} aria-label="Zoom out">
            −
          </button>
        </div>
      </div>
      <MapGrid center={mapCenter} span={mapSpan} onCenter={setMapCenter} onSpan={setMapSpan} onSelect={openSite} />
    </div>
  )
}

export function SiteView() {
  const { primaryId, instantMs, backToMap } = useApp()
  const site = siteById(primaryId)
  return (
    <div className="screen screen--enter site-screen">
      <SitePane
        site={site}
        instantMs={instantMs}
        heading={
          <button type="button" className="text-action" onClick={backToMap}>
            Back to grid
          </button>
        }
      />
      <Timeline mode="site" />
    </div>
  )
}

export function CompareView() {
  const { primaryId, compareId, instantMs, backToMap } = useApp()
  return (
    <div className="screen screen--enter compare-screen">
      <div className="compare-bar">
        <button type="button" className="text-action" onClick={backToMap}>
          Back to grid
        </button>
        <p className="kicker">Same date, two sites</p>
      </div>
      <div className="compare-split">
        <SitePane site={siteById(primaryId)} instantMs={instantMs} />
        <SitePane site={siteById(compareId)} instantMs={instantMs} />
      </div>
      <Timeline mode="compare" />
    </div>
  )
}
