import * as THREE from 'three'

type Maps = { color: THREE.CanvasTexture; bump: THREE.CanvasTexture }

function paintMoon(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const base = ctx.createLinearGradient(0, 0, 0, height)
  base.addColorStop(0, '#d2cdc4')
  base.addColorStop(0.5, '#b7b1a8')
  base.addColorStop(1, '#c8c2b8')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)

  const image = ctx.getImageData(0, 0, width, height)
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18
    image.data[i] = Math.max(0, Math.min(255, image.data[i] + n))
    image.data[i + 1] = Math.max(0, Math.min(255, image.data[i + 1] + n))
    image.data[i + 2] = Math.max(0, Math.min(255, image.data[i + 2] + n - 3))
  }
  ctx.putImageData(image, 0, 0)

  const maria: Array<[number, number, number, number]> = [
    [-20, 30, 70, 48],
    [16, 24, 42, 34],
    [28, 8, 36, 28],
    [58, 16, 28, 32],
    [-48, 12, 64, 40],
    [-30, -18, 34, 22],
  ]
  for (const [lon, lat, rx, ry] of maria) {
    const x = ((lon + 180) / 360) * width
    const y = ((90 - lat) / 180) * height
    const gradient = ctx.createRadialGradient(x, y, 4, x, y, Math.max(rx, ry))
    gradient.addColorStop(0, 'rgba(72, 68, 62, 0.42)')
    gradient.addColorStop(1, 'rgba(72, 68, 62, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 220; i += 1) {
    const x = Math.random() * width
    const y = Math.random() * height
    const r = Math.random() ** 2 * 11 + 0.6
    const gradient = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.2, x, y, r)
    gradient.addColorStop(0, 'rgba(90, 86, 80, 0.35)')
    gradient.addColorStop(0.72, 'rgba(70, 66, 60, 0.05)')
    gradient.addColorStop(0.86, 'rgba(210, 206, 198, 0.28)')
    gradient.addColorStop(1, 'rgba(210, 206, 198, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function paintBump(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, width, height)
  for (let i = 0; i < 420; i += 1) {
    const x = Math.random() * width
    const y = Math.random() * height
    const r = Math.random() ** 2 * 18 + 1
    const gradient = ctx.createRadialGradient(x, y, r * 0.2, x, y, r)
    gradient.addColorStop(0, '#5a5a5a')
    gradient.addColorStop(0.72, '#6e6e6e')
    gradient.addColorStop(0.86, '#bdbdbd')
    gradient.addColorStop(1, '#808080')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function createMoonMaps(): Maps {
  const width = 1024
  const height = 512
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = width
  colorCanvas.height = height
  paintMoon(colorCanvas.getContext('2d')!, width, height)

  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = width
  bumpCanvas.height = height
  paintBump(bumpCanvas.getContext('2d')!, width, height)

  const color = new THREE.CanvasTexture(colorCanvas)
  color.colorSpace = THREE.SRGBColorSpace
  color.anisotropy = 8
  const bump = new THREE.CanvasTexture(bumpCanvas)
  bump.anisotropy = 8
  return { color, bump }
}
