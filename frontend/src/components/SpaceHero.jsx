// SpaceHero.jsx — cinematic Three.js floating node-network hero
// Renders ONLY on Home page. Full dispose on unmount — no GPU leaks.
import { useEffect, useRef } from 'react'

export default function SpaceHero() {
  const mountRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // Respect reduced-motion preference & skip on mobile (fall back to CSS gradient)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth < 768
    if (reducedMotion || isMobile) return

    let THREE, renderer, animId

    // Dynamic import — keeps Three.js out of every page's bundle
    import('three').then(mod => {
      THREE = mod

      // ── Renderer ────────────────────────────────────────────────────────
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(el.clientWidth, el.clientHeight)
      renderer.setClearColor(0x000000, 0)
      el.appendChild(renderer.domElement)

      // ── Scene & Camera ───────────────────────────────────────────────────
      const scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0x080508, 0.028)

      const camera = new THREE.PerspectiveCamera(58, el.clientWidth / el.clientHeight, 0.1, 120)
      camera.position.set(0, 0, 9)

      // ── Starfield ────────────────────────────────────────────────────────
      const STAR_COUNT = 280
      const starPos = new Float32Array(STAR_COUNT * 3)
      for (let i = 0; i < STAR_COUNT; i++) {
        starPos[i * 3]     = (Math.random() - 0.5) * 50
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 40
        starPos[i * 3 + 2] = (Math.random() - 0.5) * 25 - 8
      }
      const starGeo = new THREE.BufferGeometry()
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
      const starMat = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.055,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.75,
      })
      const starField = new THREE.Points(starGeo, starMat)
      scene.add(starField)

      // ── Node network ─────────────────────────────────────────────────────
      const NODE_COUNT = 110
      const nodeVecs = []
      const flatPos = []

      for (let i = 0; i < NODE_COUNT; i++) {
        // Distribute in a squished sphere — like a city seen from above
        const r = 1.2 + Math.random() * 5.5
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const x = r * Math.sin(phi) * Math.cos(theta)
        const y = r * Math.sin(phi) * Math.sin(theta) * 0.55  // squish vertically
        const z = r * Math.cos(phi) * 0.45
        nodeVecs.push(new THREE.Vector3(x, y, z))
        flatPos.push(x, y, z)
      }

      // Amber nodes (main)
      const nodeGeo = new THREE.BufferGeometry()
      nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(flatPos), 3))
      const nodeMat = new THREE.PointsMaterial({
        color: 0xFF7A1A,
        size: 0.14,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.92,
      })
      const nodePoints = new THREE.Points(nodeGeo, nodeMat)

      // Blue accent nodes (fewer, scattered)
      const bluePos = []
      for (let i = 0; i < 30; i++) {
        const r = 0.8 + Math.random() * 4.5
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        bluePos.push(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.55,
          r * Math.cos(phi) * 0.45,
        )
      }
      const blueGeo = new THREE.BufferGeometry()
      blueGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bluePos), 3))
      const blueMat = new THREE.PointsMaterial({
        color: 0x3B9EFF,
        size: 0.10,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.75,
      })
      const blueNodes = new THREE.Points(blueGeo, blueMat)

      // Edges — connect nodes within threshold
      const edgePos = []
      const CONNECT_DIST = 2.0
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          if (edgePos.length >= 1800) break
          if (nodeVecs[i].distanceTo(nodeVecs[j]) < CONNECT_DIST) {
            edgePos.push(
              nodeVecs[i].x, nodeVecs[i].y, nodeVecs[i].z,
              nodeVecs[j].x, nodeVecs[j].y, nodeVecs[j].z,
            )
          }
        }
      }
      const edgeGeo = new THREE.BufferGeometry()
      edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgePos), 3))
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0xFF7A1A,
        transparent: true,
        opacity: 0.13,
      })
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat)

      // Blue accent edges
      const blueEdgePos = []
      const blueVecs = []
      for (let i = 0; i < 30; i++) {
        blueVecs.push(new THREE.Vector3(bluePos[i*3], bluePos[i*3+1], bluePos[i*3+2]))
      }
      for (let i = 0; i < blueVecs.length; i++) {
        for (let j = i + 1; j < blueVecs.length; j++) {
          if (blueVecs[i].distanceTo(blueVecs[j]) < 2.4) {
            blueEdgePos.push(
              blueVecs[i].x, blueVecs[i].y, blueVecs[i].z,
              blueVecs[j].x, blueVecs[j].y, blueVecs[j].z,
            )
          }
        }
      }
      const blueEdgeGeo = new THREE.BufferGeometry()
      blueEdgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(blueEdgePos), 3))
      const blueEdgeMat = new THREE.LineBasicMaterial({
        color: 0x3B9EFF,
        transparent: true,
        opacity: 0.10,
      })
      const blueEdgeLines = new THREE.LineSegments(blueEdgeGeo, blueEdgeMat)

      // Group everything for unified rotation
      const networkGroup = new THREE.Group()
      networkGroup.add(edgeLines)
      networkGroup.add(blueEdgeLines)
      networkGroup.add(nodePoints)
      networkGroup.add(blueNodes)
      scene.add(networkGroup)

      // ── Mouse parallax ───────────────────────────────────────────────────
      const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
      const onMouseMove = (e) => {
        mouse.tx = (e.clientX / window.innerWidth  - 0.5) * 0.5
        mouse.ty = (e.clientY / window.innerHeight - 0.5) * 0.25
      }
      window.addEventListener('mousemove', onMouseMove, { passive: true })

      // ── Animation loop ───────────────────────────────────────────────────
      const clock = new THREE.Clock()

      const animate = () => {
        animId = requestAnimationFrame(animate)
        const t = clock.getElapsedTime()

        // Smooth mouse follow (lerp)
        mouse.x += (mouse.tx - mouse.x) * 0.025
        mouse.y += (mouse.ty - mouse.y) * 0.025

        // Slow drift rotation + parallax tilt
        networkGroup.rotation.y = t * 0.04  + mouse.x * 0.35
        networkGroup.rotation.x = t * 0.015 + mouse.y * 0.18

        // Star drift (much slower)
        starField.rotation.y = t * 0.006
        starField.rotation.x = t * 0.003

        renderer.render(scene, camera)
      }
      animate()

      // ── Resize handler ───────────────────────────────────────────────────
      const onResize = () => {
        if (!el) return
        const w = el.clientWidth, h = el.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', onResize)

      // Store cleanup refs so the outer cleanup function can call them
      el._rrCleanup = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('resize', onResize)

        // Dispose all GPU resources
        starGeo.dispose();   starMat.dispose()
        nodeGeo.dispose();   nodeMat.dispose()
        blueGeo.dispose();   blueMat.dispose()
        edgeGeo.dispose();   edgeMat.dispose()
        blueEdgeGeo.dispose(); blueEdgeMat.dispose()
        renderer.dispose()

        if (renderer.domElement.parentNode === el) {
          el.removeChild(renderer.domElement)
        }
        delete el._rrCleanup
      }
    })

    // Cleanup: called when component unmounts (navigating away)
    return () => {
      if (animId) cancelAnimationFrame(animId)
      if (el._rrCleanup) el._rrCleanup()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
