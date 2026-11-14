import { clamp, wrapLon } from './coords'

export const LUNAR_DAY_DAYS = 29.530588853
export const LUNAR_DAY_MS = LUNAR_DAY_DAYS * 24 * 60 * 60 * 1000
const EPOCH_MS = Date.UTC(2024, 0, 1)
const MS_PER_DAY = 24 * 60 * 60 * 1000

export type Sky = {
  solarElevation: number
  solarAzimuth: number
  earthElevation: number
  earthAzimuth: number
  light: number
  comms: number
}

export type Countdown = {
  hoursUntilSunset: number | null
  hoursUntilEarthset: number | null
}

type Place = { lat: number; lon: number }

function rad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function deg(radians: number): number {
  return (radians * 180) / Math.PI
}

function lookAt(lat: number, lon: number, targetLat: number, targetLon: number): { elevation: number; azimuth: number } {
  const phi1 = rad(lat)
  const phi2 = rad(targetLat)
  const delta = rad(wrapLon(targetLon - lon))
  const sinEl = Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(delta)
  const elevation = deg(Math.asin(clamp(sinEl, -1, 1)))
  const y = Math.sin(delta) * Math.cos(phi2)
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(delta)
  const azimuth = (deg(Math.atan2(y, x)) + 360) % 360
  return { elevation, azimuth }
}

function subsolar(ms: number): Place {
  const days = (ms - EPOCH_MS) / MS_PER_DAY
  return {
    lat: 1.54 * Math.sin((2 * Math.PI * days) / 365.25),
    lon: wrapLon((-360 * days) / LUNAR_DAY_DAYS),
  }
}

function subearth(ms: number): Place {
  const days = (ms - EPOCH_MS) / MS_PER_DAY
  return {
    lat: 6.5 * Math.sin((2 * Math.PI * days) / 27.212),
    lon: 7.5 * Math.sin((2 * Math.PI * days) / 27.555 + 0.7),
  }
}

function exposure(elevation: number): number {
  if (elevation <= 0) return 0
  return Math.sin(rad(Math.min(elevation, 90)))
}

export function lunarDayStart(ms: number): number {
  return EPOCH_MS + Math.floor((ms - EPOCH_MS) / LUNAR_DAY_MS) * LUNAR_DAY_MS
}

export function skyAt(site: Place, ms: number): Sky {
  const sun = subsolar(ms)
  const earth = subearth(ms)
  const solar = lookAt(site.lat, site.lon, sun.lat, sun.lon)
  const terrestrial = lookAt(site.lat, site.lon, earth.lat, earth.lon)
  return {
    solarElevation: solar.elevation,
    solarAzimuth: solar.azimuth,
    earthElevation: terrestrial.elevation,
    earthAzimuth: terrestrial.azimuth,
    light: exposure(solar.elevation),
    comms: exposure(terrestrial.elevation),
  }
}

function hoursUntilSet(site: Place, ms: number, body: 'sun' | 'earth'): number | null {
  const read = (time: number) => (body === 'sun' ? skyAt(site, time).solarElevation : skyAt(site, time).earthElevation)
  let previous = read(ms)
  if (previous <= 0) return null
  const stepHours = 3
  for (let hour = stepHours; hour <= 220 * 24; hour += stepHours) {
    const elevation = read(ms + hour * 60 * 60 * 1000)
    if (elevation <= 0) {
      const fraction = previous / (previous - elevation)
      return hour - stepHours + fraction * stepHours
    }
    previous = elevation
  }
  return null
}

const countdownCache = new Map<string, Countdown>()

export function countdownAt(siteId: string, site: Place, ms: number): Countdown {
  const key = `${siteId}:${Math.floor(ms / (30 * 60 * 1000))}`
  const cached = countdownCache.get(key)
  if (cached) return cached
  const value = {
    hoursUntilSunset: hoursUntilSet(site, ms, 'sun'),
    hoursUntilEarthset: hoursUntilSet(site, ms, 'earth'),
  }
  countdownCache.set(key, value)
  if (countdownCache.size > 400) {
    const oldest = countdownCache.keys().next().value
    if (oldest) countdownCache.delete(oldest)
  }
  return value
}

export function formatLead(hours: number | null, event: string, down: string): string {
  if (hours == null) return down
  const rounded = Math.max(0, Math.round(hours))
  const days = Math.floor(rounded / 24)
  const rest = rounded % 24
  const span = days > 0 ? `${days}d ${rest}h` : `${rest}h`
  return `${span} until ${event}`
}

export function formatInstant(ms: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(ms))
}

export function dateInputValue(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

export function instantFromDateInput(value: string): number {
  return Date.parse(`${value}T12:00:00Z`)
}
