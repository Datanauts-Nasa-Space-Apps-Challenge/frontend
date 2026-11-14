import { useEffect, useRef, useState } from 'react'
import { sites, type Site } from '../data/sites'
import { clamp, formatCoord, wrapLon } from '../model/coords'

function gridStep(span: number): number {
  if (span > 90) return 30
  if (span > 40) return 10
  if (span > 18) return 5
  return 2
}

function project(lat: number, lon: number, centerLat: number, centerLon: number, widthDeg: number, heightDeg: number) {
  const x = (wrapLon(lon - centerLon) / widthDeg + 0.5) * 100
  const y = (0.5 - (lat - centerLat) / heightDeg) * 100
  return { x, y }
}

export function MapGrid({
  center,
  span,
  onCenter,
  onSpan,
  onSelect,
}: {
  center: { lat: number; lon: number }
  span: number
  onCenter: (center: { lat: number; lon: number }) => void
  onSpan: (span: number) => void
  onSelect: (id: string) => void
}) {
  const boardRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; lat: number; lon: number } | null>(null)
  const moved = useRef(false)
  const [aspect, setAspect] = useState(0.72)

  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const observer = new ResizeObserver(() => {
      const rect = board.getBoundingClientRect()
      if (rect.width > 0) setAspect(rect.height / rect.width)
    })
    observer.observe(board)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const factor = event.deltaY > 0 ? 1.08 : 0.92
      onSpan(span * factor)
    }
    board.addEventListener('wheel', onWheel, { passive: false })
    return () => board.removeEventListener('wheel', onWheel)
  }, [onSpan, span])

  const widthDeg = span
  const heightDeg = Math.min(150, span * aspect)
  const boardHeight = 100 * aspect
  const step = gridStep(span)
  const lonStart = Math.ceil((center.lon - widthDeg / 2) / step) * step
  const latStart = Math.ceil((center.lat - heightDeg / 2) / step) * step
  const lonLines: number[] = []
  const latLines: number[] = []
  for (let lon = lonStart; lon < center.lon + widthDeg / 2; lon += step) lonLines.push(lon)
  for (let lat = latStart; lat < center.lat + heightDeg / 2; lat += step) {
    if (lat >= -90 && lat <= 90) latLines.push(lat)
  }

  const placed = sites.map((site) => {
    const deltaLon = wrapLon(site.lon - center.lon)
    const deltaLat = site.lat - center.lat
    const inView = Math.abs(deltaLon) <= widthDeg / 2 && Math.abs(deltaLat) <= heightDeg / 2
    const near = Math.abs(deltaLon) <= widthDeg && Math.abs(deltaLat) <= heightDeg
    const raw = project(site.lat, site.lon, center.lat, center.lon, widthDeg, heightDeg)
    const x = clamp(raw.x, 2.5, 97.5)
    const y = clamp(raw.y * aspect, 2.2, boardHeight - 2.2)
    return { site, inView, near, x: inView ? raw.x : x, y: inView ? raw.y * aspect : y }
  })

  const inViewIds = new Set(placed.filter((pin) => pin.inView).map((pin) => pin.site.id))

  const panTo = (clientX: number, clientY: number) => {
    const origin = drag.current
    const board = boardRef.current
    if (!origin || !board) return
    const rect = board.getBoundingClientRect()
    const dx = clientX - origin.x
    const dy = clientY - origin.y
    if (Math.hypot(dx, dy) > 4) moved.current = true
    onCenter({
      lat: clamp(origin.lat + (dy / rect.height) * heightDeg, -89, 89),
      lon: wrapLon(origin.lon - (dx / rect.width) * widthDeg),
    })
  }

  const select = (site: Site) => {
    if (moved.current) return
    onSelect(site.id)
  }

  return (
    <div className="map-layout">
      <div
        className="map-board"
        ref={boardRef}
        onPointerDown={(event) => {
          moved.current = false
          drag.current = { x: event.clientX, y: event.clientY, lat: center.lat, lon: center.lon }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (drag.current) panTo(event.clientX, event.clientY)
        }}
        onPointerUp={() => {
          drag.current = null
        }}
      >
        <svg viewBox={`0 0 100 ${boardHeight}`} preserveAspectRatio="none" role="img" aria-label="Lunar latitude and longitude grid">
          {lonLines.map((lon) => {
            const x = project(center.lat, lon, center.lat, center.lon, widthDeg, heightDeg).x
            return (
              <g key={`lon-${lon}`}>
                <line x1={x} x2={x} y1={0} y2={boardHeight} />
                <text x={x + 0.6} y={2.6}>
                  {Math.abs(lon).toFixed(0)}°{lon >= 0 ? 'E' : 'W'}
                </text>
              </g>
            )
          })}
          {latLines.map((lat) => {
            const y = project(lat, center.lon, center.lat, center.lon, widthDeg, heightDeg).y * aspect
            return (
              <g key={`lat-${lat}`}>
                <line x1={0} x2={100} y1={y} y2={y} />
                <text x={1.2} y={y - 0.7}>
                  {Math.abs(lat).toFixed(0)}°{lat >= 0 ? 'N' : 'S'}
                </text>
              </g>
            )
          })}
          {placed
            .filter((pin) => pin.inView || pin.near)
            .map((pin) => (
              <g
                key={pin.site.id}
                className={pin.inView ? 'map-pin map-pin--hot' : 'map-pin'}
                transform={`translate(${pin.x} ${pin.y})`}
                onClick={() => select(pin.site)}
              >
                <circle r={pin.inView ? 1.15 : 0.7} />
                <line y1={-2.1} y2={-0.2} />
                {pin.inView ? <text y={-2.8}>{pin.site.name}</text> : null}
              </g>
            ))}
        </svg>
        <div className="map-readout">{formatCoord(center.lat, center.lon)}</div>
      </div>
      <aside className="site-rail">
        <p className="kicker">In view</p>
        <ul>
          {sites
            .slice()
            .sort((a, b) => Number(inViewIds.has(b.id)) - Number(inViewIds.has(a.id)) || a.name.localeCompare(b.name))
            .map((site) => (
              <li key={site.id}>
                <button type="button" className={inViewIds.has(site.id) ? 'rail-site rail-site--hot' : 'rail-site'} onClick={() => onSelect(site.id)}>
                  <span>{site.program}</span>
                  {site.name}
                </button>
              </li>
            ))}
        </ul>
      </aside>
    </div>
  )
}
