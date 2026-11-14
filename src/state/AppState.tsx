import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { otherSiteId } from '../data/sites'
import { LUNAR_DAY_MS, lunarDayStart } from '../model/conditions'
import { clamp } from '../model/coords'

export type View = 'globe' | 'map' | 'site' | 'compare'

type Center = { lat: number; lon: number }

type AppContextValue = {
  view: View
  mapCenter: Center
  mapSpan: number
  globeFocus: Center
  primaryId: string
  compareId: string
  instantMs: number
  playing: boolean
  descendToMap: (lat: number, lon: number) => void
  returnToGlobe: () => void
  setMapCenter: (center: Center) => void
  setMapSpan: (span: number) => void
  openSite: (id: string) => void
  backToMap: () => void
  openCompare: () => void
  closeCompare: () => void
  setCompareId: (id: string) => void
  setInstant: (ms: number) => void
  togglePlaying: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

const PLAYBACK_SECONDS = 28

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('globe')
  const [mapCenter, setMapCenterState] = useState<Center>({ lat: -70, lon: 15 })
  const [mapSpan, setMapSpanState] = useState(48)
  const [globeFocus, setGlobeFocus] = useState<Center>({ lat: -28, lon: 18 })
  const [primaryId, setPrimaryId] = useState('shackleton')
  const [compareId, setCompareIdState] = useState('de-gerlache')
  const [instantMs, setInstantMs] = useState(Date.UTC(2026, 10, 14, 12))
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    let carry = 0
    const tick = (now: number) => {
      const delta = Math.min(0.1, (now - last) / 1000)
      last = now
      carry += delta
      if (carry >= 0.08) {
        const step = carry
        carry = 0
        setInstantMs((current) => {
          const start = lunarDayStart(current)
          const next = current + step * (LUNAR_DAY_MS / PLAYBACK_SECONDS)
          if (next >= start + LUNAR_DAY_MS) return start
          return next
        })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  const value = useMemo<AppContextValue>(
    () => ({
      view,
      mapCenter,
      mapSpan,
      globeFocus,
      primaryId,
      compareId,
      instantMs,
      playing,
      descendToMap: (lat, lon) => {
        const center = { lat, lon }
        setMapCenterState(center)
        setGlobeFocus(center)
        setMapSpanState(42)
        setPlaying(false)
        setView('map')
      },
      returnToGlobe: () => {
        setGlobeFocus(mapCenter)
        setPlaying(false)
        setView('globe')
      },
      setMapCenter: setMapCenterState,
      setMapSpan: (span) => setMapSpanState(clamp(span, 8, 160)),
      openSite: (id) => {
        setPrimaryId(id)
        setCompareIdState((current) => (current === id ? otherSiteId(id) : current))
        setPlaying(false)
        setView('site')
      },
      backToMap: () => {
        setPlaying(false)
        setView('map')
      },
      openCompare: () => {
        setCompareIdState((current) => (current === primaryId ? otherSiteId(primaryId) : current))
        setView('compare')
      },
      closeCompare: () => setView('site'),
      setCompareId: (id) => {
        if (id === primaryId) return
        setCompareIdState(id)
      },
      setInstant: (ms) => {
        if (Number.isNaN(ms)) return
        setInstantMs(ms)
      },
      togglePlaying: () => setPlaying((current) => !current),
    }),
    [view, mapCenter, mapSpan, globeFocus, primaryId, compareId, instantMs, playing],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used within AppStateProvider')
  return value
}
