import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Site } from '../data/sites'
import type { Sky } from '../model/conditions'

function enu(azimuth: number, elevation: number, radius: number): [number, number, number] {
  const az = (azimuth * Math.PI) / 180
  const el = (elevation * Math.PI) / 180
  const east = Math.cos(el) * Math.sin(az)
  const north = Math.cos(el) * Math.cos(az)
  const up = Math.sin(el)
  return [east * radius, up * radius, -north * radius]
}

function hashSeed(id: string): number {
  let hash = 2166136261
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return hash >>> 0
}

function unitRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildGround(siteId: string): THREE.BufferGeometry {
  const random = unitRandom(hashSeed(siteId))
  const craters = Array.from({ length: 16 }, () => ({
    x: (random() - 0.5) * 54,
    z: (random() - 0.5) * 54,
    r: 0.8 + random() ** 1.4 * 6.5,
    depth: 0.1 + random() * 0.28,
  }))
  const geometry = new THREE.PlaneGeometry(90, 90, 150, 150)
  geometry.rotateX(-Math.PI / 2)
  const position = geometry.attributes.position
  const colors = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const z = position.getZ(i)
    let height = Math.sin(x * 0.31 + siteId.length) * 0.035 + Math.cos(z * 0.21) * 0.03
    for (const crater of craters) {
      const distance = Math.hypot(x - crater.x, z - crater.z)
      if (distance > crater.r) continue
      const u = distance / crater.r
      const bowl = Math.exp(-u * u * 3.2)
      const rim = Math.exp(-((u - 0.82) ** 2) * 48)
      height += crater.depth * (-bowl + rim * 0.45)
    }
    const distance = Math.hypot(x, z)
    if (distance > 22) height *= 0.2
    position.setY(i, height)
    const shade = THREE.MathUtils.clamp(0.42 + height * 0.35, 0.22, 0.72)
    colors[i * 3] = shade
    colors[i * 3 + 1] = shade * 0.98
    colors[i * 3 + 2] = shade * 0.93
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}

function viewTarget(sky: Sky): { azimuth: number; elevation: number } {
  const sunUp = sky.solarElevation > 0
  const earthUp = sky.earthElevation > 0
  let azimuth = 0
  let elevation = 8
  if (sunUp && earthUp) {
    const delta = ((sky.earthAzimuth - sky.solarAzimuth + 540) % 360) - 180
    azimuth = Math.abs(delta) < 80 ? (sky.solarAzimuth + delta / 2 + 360) % 360 : sky.solarAzimuth
    elevation = Math.abs(delta) < 80 ? (sky.solarElevation + sky.earthElevation) / 2 : sky.solarElevation
  } else if (sunUp) {
    azimuth = sky.solarAzimuth
    elevation = sky.solarElevation
  } else if (earthUp) {
    azimuth = sky.earthAzimuth
    elevation = sky.earthElevation
  }
  return { azimuth, elevation: Math.min(Math.max(elevation, 6), 42) }
}

function AimCamera({ sky }: { sky: Sky }) {
  const camera = useThree((state) => state.camera)
  const heading = useRef(0)
  const pitch = useRef(8)
  const ready = useRef(false)
  const skyRef = useRef(sky)
  skyRef.current = sky
  useFrame(() => {
    const desired = viewTarget(skyRef.current)
    if (!ready.current) {
      heading.current = desired.azimuth
      pitch.current = desired.elevation
      ready.current = true
    } else {
      const delta = ((desired.azimuth - heading.current + 540) % 360) - 180
      heading.current = (heading.current + delta * 0.08 + 360) % 360
      pitch.current += (desired.elevation - pitch.current) * 0.08
    }
    const az = (heading.current * Math.PI) / 180
    const el = (pitch.current * Math.PI) / 180
    const east = Math.sin(az)
    const north = Math.cos(az)
    const lookX = east * Math.cos(el)
    const lookY = Math.sin(el)
    const lookZ = -north * Math.cos(el)
    camera.position.set(-east * 8, 1.8, north * 8)
    camera.lookAt(lookX * 10, 1.2 + lookY * 10, lookZ * 10)
  })
  return null
}

function Stars() {
  const positions = useMemo(() => {
    const data = new Float32Array(280 * 3)
    for (let i = 0; i < 280; i += 1) {
      const azimuth = Math.random() * Math.PI * 2
      const elevation = Math.acos(1 - Math.random()) * 0.5
      const radius = 40
      const east = Math.cos(elevation) * Math.sin(azimuth)
      const north = Math.cos(elevation) * Math.cos(azimuth)
      const up = Math.sin(elevation)
      data[i * 3] = east * radius
      data[i * 3 + 1] = up * radius
      data[i * 3 + 2] = -north * radius
    }
    return data
  }, [])
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d7d2c8" size={0.045} sizeAttenuation />
    </points>
  )
}

export function SiteCanvas({ site, sky }: { site: Site; sky: Sky }) {
  const ground = useMemo(() => buildGround(site.id), [site.id])
  const sun = enu(sky.solarAzimuth, Math.max(sky.solarElevation, -8), 14)
  const earth = enu(sky.earthAzimuth, sky.earthElevation, 16)
  const sunVisible = sky.solarElevation > 0
  const earthVisible = sky.earthElevation > 0

  return (
    <Canvas dpr={[1, 1.75]} camera={{ fov: 68, near: 0.1, far: 80 }} gl={{ antialias: true }}>
      <color attach="background" args={['#050506']} />
      <AimCamera sky={sky} />
      <Stars />
      <ambientLight intensity={0.02 + sky.comms * 0.14 + sky.light * 0.05} color="#c5d0dc" />
      <directionalLight position={sun} intensity={sunVisible ? 2.1 + sky.light * 2.6 : 0} color="#fff1dc" />
      <mesh geometry={ground}>
        <meshStandardMaterial vertexColors roughness={1} metalness={0} />
      </mesh>
      {sunVisible ? (
        <mesh position={enu(sky.solarAzimuth, sky.solarElevation, 18)}>
          <sphereGeometry args={[0.62, 24, 24]} />
          <meshBasicMaterial color="#ffb15a" />
        </mesh>
      ) : null}
      {earthVisible ? (
        <mesh position={earth}>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial color="#2c6d98" emissive="#7eb0cc" emissiveIntensity={0.85} roughness={0.45} />
        </mesh>
      ) : null}
    </Canvas>
  )
}
