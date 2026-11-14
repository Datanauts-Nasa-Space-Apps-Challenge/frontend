import type { ReactNode } from 'react'
import type { Site } from '../data/sites'
import { countdownAt, formatLead, skyAt } from '../model/conditions'
import { formatCoord } from '../model/coords'
import { SiteCanvas } from './SiteCanvas'

export function SitePane({
  site,
  instantMs,
  heading,
}: {
  site: Site
  instantMs: number
  heading?: ReactNode
}) {
  const sky = skyAt(site, instantMs)
  const countdown = countdownAt(site.id, site, instantMs)
  const sunLead =
    sky.solarElevation > 0 ? formatLead(countdown.hoursUntilSunset, 'sunset', 'Sun stays up') : 'Sun is down'
  const earthLead =
    sky.earthElevation > 0 ? formatLead(countdown.hoursUntilEarthset, 'Earthset', 'Earth stays up') : 'Earth is down'

  return (
    <section className="stage">
      <SiteCanvas site={site} sky={sky} />
      <div className="stage-copy">
        {heading}
        <p className="kicker">{site.program}</p>
        <h2>{site.name}</h2>
        <p className="coords">{formatCoord(site.lat, site.lon)}</p>
        <p className="note">{site.note}</p>
        <div className="meters">
          <Meter label="Light" tone="sun" value={sky.light} detail={`${sky.solarElevation.toFixed(1)}° solar elevation`} lead={sunLead} />
          <Meter label="Earth link" tone="earth" value={sky.comms} detail={`${sky.earthElevation.toFixed(1)}° Earth elevation`} lead={earthLead} />
        </div>
      </div>
    </section>
  )
}

function Meter({
  label,
  tone,
  value,
  detail,
  lead,
}: {
  label: string
  tone: 'sun' | 'earth'
  value: number
  detail: string
  lead: string
}) {
  const percent = Math.round(value * 100)
  return (
    <div className={`meter meter--${tone}`}>
      <div className="meter-top">
        <span>{label}</span>
        <strong>{percent}%</strong>
      </div>
      <div className="meter-track" aria-hidden="true">
        <i style={{ width: `${percent}%` }} />
      </div>
      <p>{detail}</p>
      <p>{lead}</p>
    </div>
  )
}
