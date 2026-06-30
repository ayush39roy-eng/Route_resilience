// NetworkMap.jsx — SVG road network renderer
import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import { centralityColor, COLORS } from './colors.js'

const PAD = 48  // canvas padding in pixels

function useBounds(nodes) {
  return useMemo(() => {
    if (!nodes || nodes.length === 0) return { minC: 0, maxC: 1, minR: 0, maxR: 1 }
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

export default function NetworkMap({
  graphData, criticality,
  disabledNodes, hoveredNode, setHoveredNode,
  routeStart, routeEnd, routeData, rerouteData,
  ablateResult,
  showHealed, showHeatmap,
  onNodeClick,
}) {
  const containerRef = useRef(null)
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })   // for tooltip positioning
  const isPanning = useRef(false)
  const panStart = useRef(null)

  // Measure container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const nodes = graphData?.nodes || []
  const edges = graphData?.edges || []
  const bounds = useBounds(nodes)

  // Map (col, row) pixel coords → SVG (x, y)
  const toSvg = useCallback((col, row) => {
    const { minC, maxC, minR, maxR } = bounds
    const rangeC = maxC - minC || 1
    const rangeR = maxR - minR || 1
    const availW = size.w - 2 * PAD
    const availH = size.h - 2 * PAD
    const scale = Math.min(availW / rangeC, availH / rangeR)
    const offX = PAD + (availW - rangeC * scale) / 2
    const offY = PAD + (availH - rangeR * scale) / 2
    return {
      x: offX + (col - minC) * scale,
      y: offY + (row - minR) * scale,
    }
  }, [bounds, size])

  // Fast node lookup
  const nodeMap = useMemo(() => {
    const m = {}
    for (const n of nodes) m[n.id] = n
    return m
  }, [nodes])

  // Disconnected node set (nodes isolated after ablation)
  const disconnectedSet = useMemo(() => {
    return new Set(ablateResult?.disconnected_nodes || [])
  }, [ablateResult])

  // ── Edge path builder ────────────────────────────────────────────────────
  function edgePathD(edge) {
    const geom = edge.geometry || []
    if (geom.length < 2) {
      const u = nodeMap[edge.u], v = nodeMap[edge.v]
      if (!u || !v) return ''
      const p1 = toSvg(u.col, u.row)
      const p2 = toSvg(v.col, v.row)
      return `M${p1.x},${p1.y} L${p2.x},${p2.y}`
    }
    const pts = geom.map(([r, c]) => toSvg(c, r))
    let d = `M${pts[0].x},${pts[0].y}`
    for (let i = 1; i < pts.length; i++) d += ` L${pts[i].x},${pts[i].y}`
    return d
  }

  // Check if edge lies on a given path
  function isOnPath(edge, pathData) {
    if (!pathData?.edges) return false
    return pathData.edges.some(
      pe => (pe.u === edge.u && pe.v === edge.v) || (pe.u === edge.v && pe.v === edge.u)
    )
  }

  // ── Mouse handlers ───────────────────────────────────────────────────────
  function handleNodeMouseEnter(id) { setHoveredNode(id) }
  function handleNodeMouseLeave()   { setHoveredNode(null) }
  function handleNodeClick(id, e)   { e.stopPropagation(); onNodeClick(id) }

  function handleWheel(e) {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.12 : 0.89
    setTransform(t => ({
      ...t,
      scale: Math.max(0.25, Math.min(10, t.scale * factor)),
    }))
  }

  function handleMouseDown(e) {
    if (e.button !== 1 && !e.altKey) return
    isPanning.current = true
    panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y }
    e.preventDefault()
  }

  function handleMouseMove(e) {
    if (isPanning.current) {
      setTransform(t => ({ ...t, x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }))
    }
    // Track cursor for tooltip
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  function handleMouseUp() { isPanning.current = false }

  // ── Node sizing & color ───────────────────────────────────────────────────
  function nodeRadius(node) {
    // Range: 5px (low centrality) → 14px (max centrality), scaled by zoom
    const c = node.centrality_norm || 0
    return 5 + c * 9
  }

  function nodeColor(node) {
    if (disabledNodes.has(node.id))  return COLORS.nodeDisabled
    if (disconnectedSet.has(node.id)) return COLORS.disconnected
    if (node.id === hoveredNode)     return COLORS.nodeHovered
    if (showHeatmap) return centralityColor(node.centrality_norm || 0)
    if (node.type === 'endpoint')    return COLORS.nodeEndpoint
    return COLORS.nodeDefault
  }

  // Tooltip node data
  const tooltipNode = hoveredNode != null ? nodeMap[hoveredNode] : null

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: COLORS.background,
        cursor: isPanning.current ? 'grabbing' : 'crosshair',
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
          {/* Radial vignette — darkens edges to frame the network */}
          <radialGradient id="rr-vignette" cx="50%" cy="50%" r="68%" gradientUnits="userSpaceOnUse"
            x1={0} y1={0} x2={size.w} y2={size.h}>
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>

          {/* Drop shadow filter for highlighted path edges */}
          <filter id="rr-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Transformed network group ── */}
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>

          {/* ═══ PASS 1: Road casings (rendered below road colors) ══════════
              Each non-special road gets a slightly wider dark stroke underneath.
              This creates clean road-map intersections by "cutting through" at junctions. */}
          {edges.map((edge, i) => {
            if (edge.healed && !showHealed) return null
            const isDisabledEdge = disabledNodes.has(edge.u) || disabledNodes.has(edge.v)
            if (isDisabledEdge) return null   // no casing for dead edges
            if (edge.healed) return null       // healed edges: dashed, no casing
            const onRoute   = isOnPath(edge, routeData)
            const onReroute = isOnPath(edge, rerouteData)
            const d = edgePathD(edge)
            if (!d) return null

            const casingWidth = (onRoute || onReroute) ? 6 : 4.5

            return (
              <path
                key={`casing-${i}`}
                d={d}
                fill="none"
                stroke={COLORS.edgeCasing}
                strokeWidth={casingWidth / transform.scale}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          })}

          {/* ═══ PASS 2: Road colors (rendered above casings) ════════════ */}
          {edges.map((edge, i) => {
            if (edge.healed && !showHealed) return null
            const onRoute      = isOnPath(edge, routeData)
            const onReroute    = isOnPath(edge, rerouteData)
            const isDisabledEdge = disabledNodes.has(edge.u) || disabledNodes.has(edge.v)
            const d = edgePathD(edge)
            if (!d) return null

            let stroke      = COLORS.edge
            let strokeWidth = 2.5
            let strokeDash  = 'none'
            let opacity     = 0.92
            let filter      = undefined

            if (isDisabledEdge) {
              stroke = COLORS.disconnected; strokeWidth = 1.2; opacity = 0.2
            } else if (onReroute) {
              stroke = COLORS.pathRerouted; strokeWidth = 3.5; opacity = 1; filter = 'url(#rr-glow)'
            } else if (onRoute) {
              stroke = COLORS.path; strokeWidth = 3.5; opacity = 1; filter = 'url(#rr-glow)'
            } else if (edge.healed) {
              stroke = COLORS.healed; strokeDash = '7,5'; strokeWidth = 2; opacity = 0.88
            }

            return (
              <path
                key={`road-${i}`}
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth / transform.scale}
                strokeDasharray={strokeDash}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={opacity}
                filter={filter}
              />
            )
          })}

          {/* ═══ Nodes ═══ */}
          {nodes.map(node => {
            const { x, y } = toSvg(node.col, node.row)
            const r = nodeRadius(node) / transform.scale
            const isRoute       = node.id === routeStart || node.id === routeEnd
            const isHovered     = node.id === hoveredNode
            const isDisabled    = disabledNodes.has(node.id)
            const isDisconnected = disconnectedSet.has(node.id)

            const color = isRoute
              ? (node.id === routeStart ? COLORS.success : COLORS.danger)
              : nodeColor(node)

            const ringColor = isDisabled ? '#555f6a'
              : isDisconnected ? '#3a4250'
              : isHovered || isRoute ? '#ffffff33'
              : '#00000040'

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => handleNodeMouseEnter(node.id)}
                onMouseLeave={handleNodeMouseLeave}
                onClick={(e) => handleNodeClick(node.id, e)}
              >
                {/* Outer glow halo for hovered or route endpoints */}
                {(isHovered || isRoute) && (
                  <circle
                    cx={x} cy={y}
                    r={(r + 5) / transform.scale}
                    fill={color}
                    opacity={0.18}
                  />
                )}

                {/* Node fill circle */}
                <circle
                  cx={x} cy={y}
                  r={Math.max(3.5 / transform.scale, r)}
                  fill={color}
                  stroke={ringColor}
                  strokeWidth={2 / transform.scale}
                  opacity={isDisabled ? 0.4 : isDisconnected ? 0.3 : 1}
                />

                {/* Disabled indicator: X marks */}
                {isDisabled && (
                  <>
                    <line x1={x - r * 0.7} y1={y - r * 0.7} x2={x + r * 0.7} y2={y + r * 0.7}
                      stroke={COLORS.danger} strokeWidth={2 / transform.scale}
                      strokeLinecap="round" />
                    <line x1={x + r * 0.7} y1={y - r * 0.7} x2={x - r * 0.7} y2={y + r * 0.7}
                      stroke={COLORS.danger} strokeWidth={2 / transform.scale}
                      strokeLinecap="round" />
                  </>
                )}
              </g>
            )
          })}
        </g>

        {/* ── Vignette overlay (fixed, outside transform, non-interactive) ── */}
        <rect
          x={0} y={0} width={size.w} height={size.h}
          fill="url(#rr-vignette)"
          style={{ pointerEvents: 'none' }}
        />
      </svg>

      {/* ── Node tooltip ── */}
      {tooltipNode && (
        <div
          className="rr-tooltip"
          style={{
            left: Math.min(mousePos.x + 14, size.w - 170),
            top: Math.max(mousePos.y - 64, 8),
          }}
        >
          <div style={{
            fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 5,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: nodeColor(tooltipNode),
              display: 'inline-block',
            }} />
            Node {tooltipNode.id}
            {disabledNodes.has(tooltipNode.id) && (
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 4,
                background: COLORS.dangerSubtle, color: COLORS.danger, fontWeight: 500,
              }}>Disabled</span>
            )}
          </div>
          <TooltipRow label="Type" value={tooltipNode.type} />
          <TooltipRow label="Degree" value={tooltipNode.degree} />
          <TooltipRow
            label="Centrality"
            value={(tooltipNode.centrality || 0).toFixed(5)}
            mono
          />
        </div>
      )}

      {/* ── Zoom controls ── */}
      <div style={{
        position: 'absolute', bottom: 20, right: 16,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {[
          { label: '+', title: 'Zoom in',    action: () => setTransform(t => ({ ...t, scale: Math.min(10, t.scale * 1.25) })) },
          { label: '−', title: 'Zoom out',   action: () => setTransform(t => ({ ...t, scale: Math.max(0.25, t.scale * 0.8) })) },
          { label: '⊙', title: 'Reset view', action: () => setTransform({ x: 0, y: 0, scale: 1 }) },
        ].map(({ label, title, action }) => (
          <button
            key={label}
            title={title}
            onClick={action}
            className="rr-zoom-btn"
            style={{
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textMuted,
              borderRadius: 8,
              width: 34, height: 34,
              fontSize: 17, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >{label}</button>
        ))}
        <div style={{
          textAlign: 'center', fontSize: 10, color: COLORS.textCaption, marginTop: 2,
        }}>
          {(transform.scale * 100).toFixed(0)}%
        </div>
      </div>

      {/* ── Heatmap legend ── */}
      {showHeatmap && <HeatmapLegend />}
    </div>
  )
}

function TooltipRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 3 }}>
      <span style={{ fontSize: 11, color: COLORS.textMuted }}>{label}</span>
      <span style={{
        fontSize: 11, color: COLORS.text,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: mono ? "'Fira Code', monospace" : 'inherit',
      }}>
        {value}
      </span>
    </div>
  )
}

function HeatmapLegend() {
  const stops = ['#1a9850', '#66bd63', '#fee08b', '#fc8d59', '#d73027']
  const gradient = stops.map((c, i) => `${c} ${i * 25}%`).join(', ')

  return (
    <div style={{
      position: 'absolute', bottom: 20, left: 16,
      background: `${COLORS.panel}ee`,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      padding: '12px 15px',
      minWidth: 175,
      boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
      backdropFilter: 'blur(6px)',
    }}>
      {/* Gradient bar */}
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
        color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 8,
      }}>
        Betweenness Centrality
      </div>
      <div style={{
        height: 8, borderRadius: 4,
        background: `linear-gradient(to right, ${gradient})`,
        marginBottom: 5,
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 10, color: COLORS.textCaption, marginBottom: 10,
      }}>
        <span>Low</span><span>High</span>
      </div>

      {/* Edge / node legend items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          { color: COLORS.healed,       label: 'Healed edge',   dashed: true  },
          { color: COLORS.path,         label: 'Shortest path',  dashed: false },
          { color: COLORS.pathRerouted, label: 'Rerouted path',  dashed: false },
          { color: COLORS.success,      label: 'Route start',    dashed: false },
          { color: COLORS.danger,       label: 'Route end / off',dashed: false },
        ].map(({ color, label, dashed }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width={22} height={6} style={{ flexShrink: 0 }}>
              <line
                x1={1} y1={3} x2={21} y2={3}
                stroke={color} strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={dashed ? '4,3' : 'none'}
              />
            </svg>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
