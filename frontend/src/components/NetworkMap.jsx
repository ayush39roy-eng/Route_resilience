// NetworkMap.jsx — SVG road network with pan/zoom, glass tooltip, glow effects
import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import { centralityColor, COLORS } from '../colors.js'

const PAD = 48

function useBounds(nodes) {
  return useMemo(() => {
    if (!nodes || nodes.length === 0) return { minC: 0, maxC: 512, minR: 0, maxR: 512 }
    let minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity
    for (const n of nodes) {
      if (n.col < minC) minC = n.col
      if (n.col > maxC) maxC = n.col
      if (n.row < minR) minR = n.row
      if (n.row > maxR) maxR = n.row
    }
    return { minC, maxC, minR, maxR }
  }, [nodes])
}

// ── Disaster node picker (pure util — no React) ────────────────────────────
function pickDisasterNodes(rect, nodes, transform, toSvgFn) {
  const minX = Math.min(rect.x1, rect.x2)
  const maxX = Math.max(rect.x1, rect.x2)
  const minY = Math.min(rect.y1, rect.y2)
  const maxY = Math.max(rect.y1, rect.y2)

  // Nodes whose screen positions fall inside the drawn box
  const inside = nodes.filter(node => {
    const { x, y } = toSvgFn(node.col, node.row)
    const sx = x * transform.scale + transform.x
    const sy = y * transform.scale + transform.y
    return sx >= minX && sx <= maxX && sy >= minY && sy <= maxY
  })

  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)
  const junctions    = shuffle(inside.filter(n => n.degree >= 3))
  const nonJunctions = shuffle(inside.filter(n => n.degree < 3))

  // Up to 3 junctions + fill non-junctions, total 5-8 nodes for real impact
  const jPick = junctions.slice(0, 3)
  const maxTotal = jPick.length + nonJunctions.length
  const targetTotal = maxTotal >= 8
    ? 5 + Math.floor(Math.random() * 4)   // 5, 6, 7, or 8
    : maxTotal
  const nPick = nonJunctions.slice(0, Math.max(0, targetTotal - jPick.length))
  const chosen = [...jPick, ...nPick]

  return {
    selected: chosen.map(n => n.id),
    insideCount: inside.length,
  }
}

export default function NetworkMap({
  graphData, criticality,
  disabledNodes, hoveredNode, setHoveredNode,
  routeStart, routeEnd, routeData, rerouteData,
  ablateResult,
  showHealed = true, showHeatmap = true,
  onNodeClick,
  bgMode = 'dark',
  bgImageUrls = {},
  bgImageSize = null,
  // disaster mode
  disasterMode = false,
  onDisasterSelect = null,
  disasterNodes = new Set(),
}) {
  const containerRef = useRef(null)
  const [size,      setSize]      = useState({ w: 800, h: 600 })
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [mousePos,  setMousePos]  = useState({ x: 0, y: 0 })
  const [dragRect,  setDragRect]  = useState(null)  // disaster selection box
  const [cursor,    setCursor]    = useState('grab')
  const isPanning          = useRef(false)
  const panStart           = useRef(null)
  const isDraggingDisaster = useRef(false)
  const dragStart          = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const nodes = graphData?.nodes || []
  const edges = graphData?.edges || []
  const bounds = useBounds(nodes)

  // ── Base layout transform ──────────────────────────────────────────────────
  const layoutTransform = useMemo(() => {
    const { minC, maxC, minR, maxR } = bounds
    const rangeC = maxC - minC || 1
    const rangeR = maxR - minR || 1
    const availW = size.w - 2 * PAD
    const availH = size.h - 2 * PAD
    const scale  = Math.min(availW / rangeC, availH / rangeR)
    const offX   = PAD + (availW - rangeC * scale) / 2
    const offY   = PAD + (availH - rangeR * scale) / 2
    return { scale, offX, offY }
  }, [bounds, size])

  const toSvg = useCallback((col, row) => {
    const { scale, offX, offY } = layoutTransform
    const { minC, minR }        = bounds
    return { x: offX + (col - minC) * scale, y: offY + (row - minR) * scale }
  }, [layoutTransform, bounds])

  const bgRect = useMemo(() => {
    if (!bgImageSize) return null
    const { scale, offX, offY } = layoutTransform
    const { minC, minR }        = bounds
    return {
      x: offX - minC * scale,
      y: offY - minR * scale,
      w: bgImageSize.w * scale,
      h: bgImageSize.h * scale,
    }
  }, [bgImageSize, layoutTransform, bounds])

  const nodeMap = useMemo(() => {
    const m = {}
    for (const n of nodes) m[n.id] = n
    return m
  }, [nodes])

  const disconnectedSet = useMemo(() =>
    new Set(ablateResult?.disconnected_nodes || []), [ablateResult])

  // ── Edge path ─────────────────────────────────────────────────────────────
  function edgePathD(edge) {
    const geom = edge.geometry || []
    if (geom.length < 2) {
      const u = nodeMap[edge.u], v = nodeMap[edge.v]
      if (!u || !v) return ''
      const p1 = toSvg(u.col, u.row), p2 = toSvg(v.col, v.row)
      return `M${p1.x},${p1.y} L${p2.x},${p2.y}`
    }
    const pts = geom.map(([r, c]) => toSvg(c, r))
    let d = `M${pts[0].x},${pts[0].y}`
    for (let i = 1; i < pts.length; i++) d += ` L${pts[i].x},${pts[i].y}`
    return d
  }

  function isOnPath(edge, pathData) {
    if (!pathData?.edges) return false
    return pathData.edges.some(
      pe => (pe.u === edge.u && pe.v === edge.v) || (pe.u === edge.v && pe.v === edge.u)
    )
  }

  // ── Event handlers ────────────────────────────────────────────────────────
  function handleNodeMouseEnter(id) { setHoveredNode(id) }
  function handleNodeMouseLeave()   { setHoveredNode(null) }
  function handleNodeClick(id, e) {
    if (disasterMode) return   // suppress normal clicks while drawing disaster box
    e.stopPropagation()
    onNodeClick?.(id)
  }

  function handleWheel(e) {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.12 : 0.89
    setTransform(t => ({ ...t, scale: Math.max(0.2, Math.min(12, t.scale * factor)) }))
  }

  function handleMouseDown(e) {
    if (disasterMode && e.button === 0) {
      const elRect = containerRef.current?.getBoundingClientRect()
      if (!elRect) return
      const x = e.clientX - elRect.left
      const y = e.clientY - elRect.top
      isDraggingDisaster.current = true
      dragStart.current = { x, y }
      setDragRect({ x1: x, y1: y, x2: x, y2: y })
      e.preventDefault()
      return
    }
    // Allow left-click drag to pan (nodes stop propagation of their own mouseDown)
    if (e.button === 0 || e.button === 1 || e.altKey) {
      isPanning.current = true
      panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y }
      setCursor('grabbing')
      if (e.button === 1) e.preventDefault()
    }
  }

  function handleMouseMove(e) {
    if (isDraggingDisaster.current) {
      const elRect = containerRef.current?.getBoundingClientRect()
      if (elRect) {
        setDragRect(dr => dr
          ? { ...dr, x2: e.clientX - elRect.left, y2: e.clientY - elRect.top }
          : null)
      }
      return
    }
    if (isPanning.current)
      setTransform(t => ({ ...t, x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }))
    const elRect = containerRef.current?.getBoundingClientRect()
    if (elRect) setMousePos({ x: e.clientX - elRect.left, y: e.clientY - elRect.top })
  }

  function handleMouseUp() {
    setCursor(disasterMode ? 'crosshair' : 'grab')
    if (isDraggingDisaster.current) {
      isDraggingDisaster.current = false
      if (dragRect) {
        const w = Math.abs(dragRect.x2 - dragRect.x1)
        const h = Math.abs(dragRect.y2 - dragRect.y1)
        if (w > 8 && h > 8) {
          onDisasterSelect?.(pickDisasterNodes(dragRect, nodes, transform, toSvg))
        }
        setDragRect(null)
      }
      return
    }
    isPanning.current = false
  }

  // ── Node appearance ───────────────────────────────────────────────────────
  function nodeRadius(node) {
    const base = 4, range = 8
    return base + (node.centrality_norm || 0) * range
  }

  function nodeColor(node) {
    // Disaster-disabled nodes get a distinct orange tint
    if (disabledNodes.has(node.id) && disasterNodes.has(node.id)) return COLORS.pathRerouted
    if (disabledNodes.has(node.id))   return COLORS.nodeDisabled
    if (disconnectedSet.has(node.id)) return COLORS.disconnected
    if (node.id === hoveredNode)       return COLORS.nodeHovered
    if (showHeatmap) return centralityColor(node.centrality_norm || 0)
    if (node.type === 'endpoint')      return COLORS.nodeEndpoint
    return COLORS.nodeDefault
  }

  const bgUrl      = bgMode !== 'dark' ? (bgImageUrls[bgMode] ?? null) : null
  const tooltipNode = hoveredNode != null ? nodeMap[hoveredNode] : null

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden',
        background: COLORS.background,
        cursor: disasterMode ? 'crosshair' : cursor,
        userSelect: 'none',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        style={{ width: '100%', height: '100%', display: 'block' }}
        viewBox={`0 0 ${size.w} ${size.h}`}
      >
        <defs>
          {/* Fine dot grid — space-map texture */}
          <pattern id="rr-dot-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="0.7" cy="0.7" r="0.55" fill="#1C1408" />
          </pattern>

          {/* Radial vignette */}
          <radialGradient id="rr-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="0%"   stopColor="transparent" stopOpacity="0" />
            <stop offset="100%" stopColor="#000"         stopOpacity="0.65" />
          </radialGradient>

          {/* Glow filter for highlighted paths */}
          <filter id="rr-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Softer glow for nodes */}
          <filter id="rr-node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle road ambient glow */}
          <filter id="rr-road-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Canvas texture */}
        <rect x={0} y={0} width={size.w} height={size.h} fill="url(#rr-dot-grid)" />

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>

          {/* Background image overlay */}
          {bgUrl && bgRect && (
            <image
              href={bgUrl}
              x={bgRect.x} y={bgRect.y}
              width={bgRect.w} height={bgRect.h}
              preserveAspectRatio="none"
              opacity={bgMode === 'satellite' ? 0.82 : bgMode === 'graph_on_satellite' ? 0.9 : 0.65}
            />
          )}

          {/* ═══ PASS 1 — Road casings ════════════════════════════════════ */}
          {edges.map((edge, i) => {
            if (edge.healed && !showHealed) return null
            if (disabledNodes.has(edge.u) || disabledNodes.has(edge.v)) return null
            if (edge.healed) return null
            const onHighlight = isOnPath(edge, rerouteData) ||
              (!rerouteData && isOnPath(edge, routeData))
            const d = edgePathD(edge)
            if (!d) return null
            return (
              <path key={`c${i}`} d={d} fill="none"
                stroke={COLORS.edgeCasing}
                strokeWidth={(onHighlight ? 8 : 5.5) / transform.scale}
                strokeLinecap="round" strokeLinejoin="round"
              />
            )
          })}

          {/* ═══ PASS 2 — Road surfaces ═══════════════════════════════════ */}
          {edges.map((edge, i) => {
            if (edge.healed && !showHealed) return null
            if (disabledNodes.has(edge.u) || disabledNodes.has(edge.v)) return null
            const onReroute = isOnPath(edge, rerouteData)
            const onRoute   = !rerouteData && isOnPath(edge, routeData)
            const d = edgePathD(edge)
            if (!d) return null

            let stroke = COLORS.edge, strokeWidth = 2.5,
                strokeDash = 'none', opacity = 1, filter

            if (onReroute)     { stroke = COLORS.pathRerouted; strokeWidth = 3.5; filter = 'url(#rr-glow)' }
            else if (onRoute)  { stroke = COLORS.path;         strokeWidth = 3.5; filter = 'url(#rr-glow)' }
            else if (edge.healed) {
              stroke = COLORS.healed; strokeDash = '6,5'; strokeWidth = 2; opacity = 0.8
            } else {
              filter = 'url(#rr-road-glow)'
            }

            return (
              <path key={`r${i}`} d={d} fill="none"
                stroke={stroke} strokeWidth={strokeWidth / transform.scale}
                strokeDasharray={strokeDash} strokeLinecap="round" strokeLinejoin="round"
                opacity={opacity} filter={filter}
              />
            )
          })}

          {/* ═══ Nodes ════════════════════════════════════════════════════ */}
          {nodes.map(node => {
            const { x, y }   = toSvg(node.col, node.row)
            const r          = nodeRadius(node) / transform.scale
            const isRoute    = node.id === routeStart || node.id === routeEnd
            const isHovered  = node.id === hoveredNode
            const isDisabled = disabledNodes.has(node.id)
            const isDisconn  = disconnectedSet.has(node.id)
            const color      = isRoute
              ? (node.id === routeStart ? COLORS.success : COLORS.danger)
              : nodeColor(node)

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => handleNodeMouseEnter(node.id)}
                onMouseLeave={handleNodeMouseLeave}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => handleNodeClick(node.id, e)}
              >
                {/* Outer glow halo for hovered/route nodes */}
                {(isHovered || isRoute) && (
                  <circle
                    cx={x} cy={y} r={(r + 7) / transform.scale}
                    fill={color} opacity={0.12}
                    filter="url(#rr-node-glow)"
                  />
                )}

                {/* Node body */}
                <circle
                  cx={x} cy={y}
                  r={Math.max(3 / transform.scale, r)}
                  fill={color}
                  stroke={isHovered || isRoute ? '#FFFFFF' : `${COLORS.background}90`}
                  strokeWidth={(isHovered || isRoute ? 1.8 : 1) / transform.scale}
                  opacity={isDisabled ? 0.35 : isDisconn ? 0.18 : 1}
                  filter={(isHovered || isRoute) ? 'url(#rr-node-glow)' : undefined}
                />

                {/* Disabled cross */}
                {isDisabled && (
                  <>
                    <line
                      x1={x - r * .65} y1={y - r * .65}
                      x2={x + r * .65} y2={y + r * .65}
                      stroke={COLORS.danger} strokeWidth={1.8 / transform.scale}
                      strokeLinecap="round"
                    />
                    <line
                      x1={x + r * .65} y1={y - r * .65}
                      x2={x - r * .65} y2={y + r * .65}
                      stroke={COLORS.danger} strokeWidth={1.8 / transform.scale}
                      strokeLinecap="round"
                    />
                  </>
                )}
              </g>
            )
          })}
        </g>

        {/* Disaster selection rectangle */}
        {dragRect && (
          <rect
            x={Math.min(dragRect.x1, dragRect.x2)}
            y={Math.min(dragRect.y1, dragRect.y2)}
            width={Math.abs(dragRect.x2 - dragRect.x1)}
            height={Math.abs(dragRect.y2 - dragRect.y1)}
            fill={`${COLORS.danger}1A`}
            stroke={COLORS.danger}
            strokeWidth={1.5}
            strokeDasharray="6,4"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Vignette overlay */}
        <rect
          x={0} y={0} width={size.w} height={size.h}
          fill="url(#rr-vignette)"
          style={{ pointerEvents: 'none' }}
        />
      </svg>

      {/* ── Tooltip ── */}
      {tooltipNode && (
        <div
          className="rr-tooltip"
          style={{
            left: Math.min(mousePos.x + 16, size.w - 190),
            top:  Math.max(mousePos.y - 72, 10),
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9,
          }}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%',
              background: nodeColor(tooltipNode), flexShrink: 0,
              boxShadow: `0 0 8px ${nodeColor(tooltipNode)}80`,
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>
              Node {tooltipNode.id}
            </span>
            {disabledNodes.has(tooltipNode.id) && (
              <span style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 4,
                background: COLORS.dangerSubtle, color: COLORS.danger,
                fontWeight: 700, letterSpacing: '0.06em', marginLeft: 'auto',
              }}>
                DISABLED
              </span>
            )}
          </div>
          <TRow label="Type"       value={tooltipNode.type} />
          <TRow label="Degree"     value={tooltipNode.degree} />
          <TRow label="Centrality" value={(tooltipNode.centrality || 0).toFixed(5)} mono />
        </div>
      )}

      {/* ── Zoom controls ── */}
      <div style={{
        position: 'absolute', bottom: 24, right: 16,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {[
          ['+', () => setTransform(t => ({ ...t, scale: Math.min(12, t.scale * 1.25) }))],
          ['−', () => setTransform(t => ({ ...t, scale: Math.max(0.2, t.scale * 0.8) }))],
          ['⊙', () => setTransform({ x: 0, y: 0, scale: 1 })],
        ].map(([label, action]) => (
          <button
            key={label}
            onClick={action}
            className="rr-zoom-btn"
            style={{
              background: `${COLORS.panel}ee`,
              border: `1px solid ${COLORS.borderMid}`,
              color: COLORS.textMuted,
              borderRadius: 9,
              width: 32, height: 32,
              fontSize: 15, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.55)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {label}
          </button>
        ))}
        <div style={{
          textAlign: 'center', fontSize: 9,
          color: COLORS.textCaption, marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {(transform.scale * 100).toFixed(0)}%
        </div>
      </div>

      {/* ── Heatmap legend ── */}
      {showHeatmap && <HeatmapLegend />}
    </div>
  )
}

function TRow({ label, value, mono }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', gap: 16, marginTop: 5,
      paddingTop: 5, borderTop: `1px solid ${COLORS.border}60`,
    }}>
      <span style={{ fontSize: 11, color: COLORS.textMuted }}>{label}</span>
      <span style={{
        fontSize: 11, color: COLORS.text,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: mono ? "'JetBrains Mono','Fira Code',monospace" : 'inherit',
        fontWeight: mono ? 500 : 400,
      }}>
        {value}
      </span>
    </div>
  )
}

function HeatmapLegend() {
  const gradStops = '#10B981, #34D399 25%, #FCD34D 50%, #F59E0B 75%, #DC2626'
  return (
    <div style={{
      position: 'absolute', bottom: 24, left: 16,
      background: `${COLORS.panel}f0`,
      border: `1px solid rgba(255,255,255,0.10)`,
      borderTop: `1px solid rgba(255,255,255,0.15)`,
      borderLeft: `1px solid rgba(255,255,255,0.12)`,
      borderRadius: 14,
      padding: '13px 15px',
      minWidth: 184,
      boxShadow: '0 8px 36px rgba(0,0,0,0.65)',
      backdropFilter: 'blur(24px) saturate(130%)',
      WebkitBackdropFilter: 'blur(24px) saturate(130%)',
    }}>
      {/* Title */}
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
        color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 9,
      }}>
        Betweenness Centrality
      </div>

      {/* Gradient bar */}
      <div style={{
        height: 5, borderRadius: 3, marginBottom: 5,
        background: `linear-gradient(to right, ${gradStops})`,
        boxShadow: '0 0 8px rgba(245,158,11,0.2)',
      }} />
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 10, color: COLORS.textCaption, marginBottom: 11,
      }}>
        <span>Low</span><span>High</span>
      </div>

      {/* Legend items */}
      {[
        [COLORS.healed,       'Healed edge',         true ],
        [COLORS.path,         'Shortest path',        false],
        [COLORS.pathRerouted, 'Rerouted path',        false],
        [COLORS.success,      'Route start',          false],
        [COLORS.danger,       'Route end / disabled', false],
      ].map(([color, label, dashed]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 5 }}>
          <svg width={20} height={6} style={{ flexShrink: 0 }}>
            <line x1={1} y1={3} x2={19} y2={3}
              stroke={color} strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={dashed ? '4,3' : 'none'}
              filter={`drop-shadow(0 0 3px ${color}80)`}
            />
          </svg>
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
