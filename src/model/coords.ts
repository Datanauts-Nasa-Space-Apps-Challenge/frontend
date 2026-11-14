export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function wrapLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180
}

export function latLonToVec(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lon + 180) * Math.PI) / 180
  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return [x, y, z]
}

export function vectorToLatLon(x: number, y: number, z: number): { lat: number; lon: number } {
  const length = Math.hypot(x, y, z) || 1
  const ny = clamp(y / length, -1, 1)
  const lat = (Math.asin(ny) * 180) / Math.PI
  const theta = Math.atan2(z / length, -(x / length))
  const lon = wrapLon((theta * 180) / Math.PI - 180)
  return { lat, lon }
}

export function formatCoord(lat: number, lon: number): string {
  const latHem = lat >= 0 ? 'N' : 'S'
  const lonHem = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(2)}°${latHem}  ${Math.abs(lon).toFixed(2)}°${lonHem}`
}
