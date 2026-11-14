import { sites } from '../data/sites'
import {
  dateInputValue,
  formatInstant,
  instantFromDateInput,
  LUNAR_DAY_MS,
  lunarDayStart,
} from '../model/conditions'
import { useApp } from '../state/AppState'

export function Timeline({ mode }: { mode: 'site' | 'compare' }) {
  const { instantMs, playing, setInstant, togglePlaying, openCompare, closeCompare, primaryId, compareId, setCompareId } = useApp()
  const start = lunarDayStart(instantMs)
  const scrub = (instantMs - start) / LUNAR_DAY_MS

  return (
    <footer className="timeline">
      <label className="date-field">
        <span>Date</span>
        <input
          type="date"
          value={dateInputValue(instantMs)}
          onChange={(event) => setInstant(instantFromDateInput(event.target.value))}
        />
      </label>
      <button type="button" className="play" onClick={togglePlaying} aria-label={playing ? 'Pause timeline' : 'Play lunar day'}>
        {playing ? 'Pause' : 'Play'}
      </button>
      <label className="scrub">
        <span>Lunar day</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={scrub}
          aria-label="Time within the lunar day"
          onChange={(event) => setInstant(start + Number(event.target.value) * LUNAR_DAY_MS)}
        />
      </label>
      <p className="timestamp">
        {formatInstant(instantMs)} UTC
        <small>Approximate</small>
      </p>
      {mode === 'site' ? (
        <button type="button" className="text-action" onClick={openCompare}>
          Compare
        </button>
      ) : (
        <label className="date-field">
          <span>Second site</span>
          <select value={compareId} onChange={(event) => setCompareId(event.target.value)} aria-label="Site to compare">
            {sites
              .filter((site) => site.id !== primaryId)
              .map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
          </select>
          <button type="button" className="text-action" onClick={closeCompare}>
            Close
          </button>
        </label>
      )}
    </footer>
  )
}
