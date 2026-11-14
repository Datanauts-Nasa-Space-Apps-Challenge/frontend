import { Html, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { sites, type Site } from '../data/sites'
import { latLonToVec, vectorToLatLon } from '../model/coords'
import { createMoonMaps } from './moonTexture'

const DESCEND_DISTANCE = 1.78

function FrameCamera({ lat, lon }: { lat: number; lon: number }) {
  const camera = useThree((state) => state.camera)
  useLayoutEffect(() => {
    const [x, y, z] = latLonToVec(lat, lon, 3.35)
    camera.position.set(x, y, z)
    camera.lookAt(0, 0, 0)
  }, [camera, lat, lon])
  return null
}

function ZoomWatcher({ onDescend }: { onDescend: (lat: number, lon: number) => void }) {
  const camera = useThree((state) => state.camera)
  const fired = useRef(false)
  useFrame(() => {
    if (fired.current) return
    if (camera.position.length() >= DESCEND_DISTANCE) return
    fired.current = true
    const { lat, lon } = vectorToLatLon(camera.position.x, camera.position.y, camera.position.z)
    onDescend(lat, lon)
  })
  return null
}

function MoonBody() {
  const maps = useMemo(() => createMoonMaps(), [])
  return (
    <mesh>
      <sphereGeometry args={[1, 128, 128]} />
      <meshStandardMaterial map={maps.color} bumpMap={maps.bump} bumpScale={0.03} roughness={1} metalness={0} color="#ded8cf" />
    </mesh>
  )
}

function SiteMarker({ site, onSelect }: { site: Site; onSelect: (id: string) => void }) {
  const position = latLonToVec(site.lat, site.lon, 1.018)
  const group = useRef<THREE.Group>(null)
  const [facing, setFacing] = useState(true)
  const scratch = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera }) => {
    if (!group.current) return
    group.current.getWorldPosition(scratch)
    const normal = scratch.clone().normalize()
    const towardCamera = camera.position.clone().sub(scratch).normalize()
    const next = normal.dot(towardCamera) > 0.2
    setFacing((current) => (current === next ? current : next))
  })

  return (
    <group ref={group} position={position}>
      <mesh visible={facing}>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshBasicMaterial color="#f0a35e" />
      </mesh>
      {facing ? (
        <Html distanceFactor={2.8} center zIndexRange={[20, 0]} style={{ pointerEvents: 'auto' }}>
          <button type="button" className="globe-pin" onClick={() => onSelect(site.id)}>
            <i />
            {site.name}
          </button>
        </Html>
      ) : null}
    </group>
  )
}

export function MoonGlobe({
  focus,
  onDescend,
  onSelect,
}: {
  focus: { lat: number; lon: number }
  onDescend: (lat: number, lon: number) => void
  onSelect: (id: string) => void
}) {
  return (
    <Canvas camera={{ fov: 38, near: 0.01, far: 20 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={['#07080c']} />
      <ambientLight intensity={0.045} />
      <directionalLight position={[4.5, 1.4, 2.2]} intensity={2.6} color="#fff4e8" />
      <FrameCamera lat={focus.lat} lon={focus.lon} />
      <MoonBody />
      {sites.map((site) => (
        <SiteMarker key={site.id} site={site} onSelect={onSelect} />
      ))}
      <ZoomWatcher onDescend={onDescend} />
      <OrbitControls enablePan={false} enableDamping minDistance={1.62} maxDistance={6.5} rotateSpeed={0.55} zoomSpeed={0.7} />
    </Canvas>
  )
}
