// Simulation.jsx — 3D-widget route planner + disaster simulation
import { useState } from 'react'
import { useDataset } from '../context/DatasetContext.jsx'
import { useGraphState } from '../hooks/useGraphState.js'
import NetworkMap from '../components/NetworkMap.jsx'
import {
  SidebarShell, SidebarSection,
  Toggle, GatekeeperRow,
} from '../components/SidebarShell.jsx'
import { COLORS } from '../colors.js'
import { MapOverlay } from '../components/SpaceLoader.jsx'

// ── Glass 3D widget shell ──────────────────────────────────────────────────
function Widget({ accentColor = COLORS.secondary, icon, title, subtitle, children }) {
  return (
    <div style={{
      background: `linear-gradient(145deg, ${accentColor}0D 0%, rgba(10,9,14,0.55) 100%)`,
      border: `1px solid ${accentColor}28`,
      borderTop: `1px solid ${accentColor}45`,
      borderRadius: 14,
      padding: '14px 13px',
      boxShadow: `
        0 8px 32px rgba(0,0,0,0.6),
        inset 0 1px 0 rgba(255,255,255,0.07),
        0 0 40px ${accentColor}06
      `,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
    }}>
      {/* Widget header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: `linear-gradient(135deg, ${accentColor}2A 0%, ${accentColor}10 100%)`,
          border: `1px solid ${accentColor}38`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15,
          boxShadow: `0 0 12px ${accentColor}18`,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, lineHeight: 1.2 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 10, color: COLORS.textCaption, marginTop: 1 }}>
              {subtitle}
            </div>
          )}
        </div>
        {/* Corner accent */}
        <div style={{
          marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%',
          background: accentColor,
          boxShadow: `0 0 6px ${accentColor}`,
          opacity: 0.8,
        }} />
      </div>
      {children}
    </div>
  )
}

// ── Big glassy route button ───────────────────────────────────────────────
function GlassRouteBtn({ label, sublabel, active, color, onClick, disabled }) {
  const c = color
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rr-btn"
      style={{
        width: '100%', padding: '11px 14px',
        borderRadius: 10, textAlign: 'left',
        background: active
          ? `linear-gradient(135deg, ${c}1C 0%, ${c}08 100%)`
          : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: `1px solid ${active ? `${c}48` : 'rgba(255,255,255,0.09)'}`,
        borderTop: `1px solid ${active ? `${c}68` : 'rgba(255,255,255,0.15)'}`,
        color: active ? c : COLORS.text,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        display: 'flex', alignItems: 'center', gap: 11,
        boxShadow: active
          ? `0 4px 20px ${c}18, inset 0 1px 0 ${c}18`
          : '0 2px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        transition: 'all 0.18s ease',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: active ? `${c}22` : 'rgba(255,255,255,0.06)',
        border: `1px solid ${active ? `${c}44` : 'rgba(255,255,255,0.10)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: active ? c : COLORS.textMuted,
        boxShadow: active ? `0 0 10px ${c}18` : 'none',
      }}>
        {active ? '▶' : '○'}
      </div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: active ? `${c}aa` : COLORS.textCaption, marginTop: 1 }}>
          {sublabel}
        </div>
      </div>
    </button>
  )
}

export default function Simulation() {
  const { activeDataset } = useDataset()
  const ds = activeDataset

  const {
    graphData, criticality, loading, error,
    disabledNodes, hoveredNode, setHoveredNode,
    routeStart, routeEnd, routeData, rerouteData, ablateResult,
    routeMode, setRouteMode,
    handleNodeClick, addDisabledNodes, reset, highlightGatekeeper,
    repairLog,
  } = useGraphState(ds?.id)

  const [showHealed,    setShowHealed]    = useState(true)
  const [showHint,      setShowHint]      = useState(true)
  const [disasterMode,  setDisasterMode]  = useState(false)
  const [disasterNodes, setDisasterNodes] = useState(new Set())
  const [disasterResult,setDisasterResult]= useState(null)

  const topGatekeepers  = criticality?.top_gatekeepers ?? []
  const centralityNorms = criticality?.centrality_norm ?? {}

  const pctDrop   = ablateResult?.pct_drop         ?? 0
  const ri        = ablateResult?.resilience_index ?? 1
  const disconnCt = ablateResult?.disconnected_nodes?.length ?? 0

  let effColor = COLORS.success
  if (pctDrop > 20)     effColor = COLORS.danger
  else if (pctDrop > 8) effColor = COLORS.warning
  const effBg     = pctDrop > 20 ? COLORS.dangerSubtle  : pctDrop > 8  ? COLORS.warningSubtle : COLORS.successSubtle
  const effBorder = pctDrop > 20 ? COLORS.danger        : pctDrop > 8  ? COLORS.warning       : COLORS.success

  const canReset = disabledNodes.size > 0 || routeStart != null

  function handleReset() {
    reset()
    setDisasterNodes(new Set())
    setDisasterResult(null)
    setDisasterMode(false)
  }

  function handleDisasterSelect({ selected, insideCount }) {
    setDisasterMode(false)
    if (selected.length === 0) {
      setDisasterResult({ selected: [], insideCount, message: 'No eligible nodes in this area.' })
      return
    }
    const nodeMap = Object.fromEntries((graphData?.nodes || []).map(n => [n.id, n]))
    const junctionCount = selected.filter(id => (nodeMap[id]?.degree ?? 0) >= 3).length
    addDisabledNodes(selected)
    setDisasterNodes(new Set(selected))
    setDisasterResult({ selected, insideCount, junctionCount })
  }

  const startLabel  = routeStart != null ? `Node ${routeStart} selected` : 'Click a node on the map'
  const endLabel    = routeEnd   != null ? `Node ${routeEnd} selected`   : 'Click a node on the map'

  return (
    <div className="rr-page" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

      {/* ── Map area ── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {/* HUD corner brackets */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
          {[
            { top: 8,    left: 8,  borderTop:    `1px solid ${COLORS.secondary}40`, borderLeft:   `1px solid ${COLORS.secondary}40` },
            { top: 8,    right: 8, borderTop:    `1px solid ${COLORS.secondary}40`, borderRight:  `1px solid ${COLORS.secondary}40` },
            { bottom: 8, left: 8,  borderBottom: `1px solid ${COLORS.accent}40`,   borderLeft:   `1px solid ${COLORS.accent}40`   },
            { bottom: 8, right: 8, borderBottom: `1px solid ${COLORS.accent}40`,   borderRight:  `1px solid ${COLORS.accent}40`   },
          ].map((style, i) => (
            <div key={i} style={{ position: 'absolute', width: 16, height: 16, ...style }} />
          ))}
          <div style={{
            position: 'absolute', top: 11, right: 28,
            fontSize: 8, fontWeight: 700, letterSpacing: '0.16em',
            color: `${COLORS.secondary}55`, textTransform: 'uppercase',
          }}>
            Routing Area
          </div>
        </div>

        <MapOverlay loading={loading} error={error} empty={!loading && !error && !ds} />

        {/* ── Resilience HUD — floating top-left ── */}
        {graphData && (
          <div style={{
            position: 'absolute', top: 20, left: 20, zIndex: 40,
            background: 'rgba(13,11,8,0.90)',
            border: `1px solid rgba(255,255,255,0.08)`,
            borderTop: `1px solid ${COLORS.secondary}35`,
            borderLeft: `1px solid ${COLORS.secondary}20`,
            borderRadius: 12,
            padding: '12px 14px',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow: `0 8px 32px rgba(0,0,0,0.75), 0 0 24px ${COLORS.secondary}08`,
            minWidth: 188,
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
              color: COLORS.secondary, textTransform: 'uppercase',
              marginBottom: 10, opacity: 0.8,
            }}>
              Resilience Metrics
            </div>

            {/* 2×2 stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
              {[
                { label: 'Disabled',   value: disabledNodes.size,          color: disabledNodes.size > 0 ? COLORS.danger   : COLORS.secondary },
                { label: 'Isolated',   value: disconnCt,                   color: disconnCt > 0          ? COLORS.warning  : COLORS.secondary },
                { label: 'Resilience', value: `${(ri*100).toFixed(0)}%`,   color: ri < 0.8 ? COLORS.danger : ri < 0.95 ? COLORS.warning : COLORS.success },
                { label: 'Eff. Drop',  value: `${pctDrop.toFixed(1)}%`,    color: pctDrop > 10 ? COLORS.danger : pctDrop > 3 ? COLORS.warning : COLORS.success },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '6px 8px', borderRadius: 7,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: 8, color: COLORS.textCaption, textTransform: 'uppercase',
                    letterSpacing: '0.11em', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: s.color, lineHeight: 1,
                    fontFamily: "'Space Grotesk','JetBrains Mono',monospace",
                    textShadow: `0 0 10px ${s.color}50` }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Efficiency badge */}
            <div style={{
              padding: '8px 10px', borderRadius: 8,
              background: effBg, border: `1px solid ${effBorder}40`,
              textAlign: 'center',
            }}>
              {pctDrop > 0 ? (
                <>
                  <div style={{ fontSize: 19, fontWeight: 700, color: effColor,
                    fontFamily: "'Space Grotesk',monospace", lineHeight: 1,
                    textShadow: `0 0 14px ${effColor}55` }}>
                    -{pctDrop.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 3 }}>
                    efficiency drop
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.success }}>
                  Network intact
                </div>
              )}
            </div>

            {/* Healed connections count */}
            {(repairLog?.healed_paths?.length ?? 0) > 0 && (
              <div style={{
                marginTop: 6, display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 8px', borderRadius: 6,
                background: `${COLORS.healed}10`, border: `1px solid ${COLORS.healed}30`,
              }}>
                <div style={{
                  width: 10, height: 2, borderRadius: 1, flexShrink: 0,
                  borderTop: `2px dashed ${COLORS.healed}`,
                }} />
                <div style={{ fontSize: 10, color: COLORS.healed, fontWeight: 600 }}>
                  {repairLog.healed_paths.length} healed connection{repairLog.healed_paths.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        )}

        {graphData && (
          <NetworkMap
            graphData={graphData}
            criticality={criticality}
            disabledNodes={disabledNodes}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            routeStart={routeStart}
            routeEnd={routeEnd}
            routeData={routeData}
            rerouteData={rerouteData}
            ablateResult={ablateResult}
            showHealed={showHealed}
            showHeatmap={true}
            onNodeClick={handleNodeClick}
            healedPaths={repairLog?.healed_paths ?? []}
            disasterMode={disasterMode}
            onDisasterSelect={handleDisasterSelect}
            disasterNodes={disasterNodes}
          />
        )}

        {/* Compact hint pill at bottom */}
        {showHint && graphData && routeMode === 'none' && !disasterMode && (
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 50, whiteSpace: 'nowrap',
            background: 'rgba(13,11,8,0.88)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderTop: `1px solid ${COLORS.secondary}28`,
            borderRadius: 999,
            padding: '5px 14px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
              background: COLORS.secondary, display: 'inline-block',
              boxShadow: `0 0 5px ${COLORS.secondary}`,
            }} />
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>
              Click nodes to disable · Drag to pan · Scroll to zoom
            </span>
            <button
              onClick={() => setShowHint(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: COLORS.textCaption, fontSize: 14, padding: 0, marginLeft: 2, lineHeight: 1 }}
            >×</button>
          </div>
        )}

        {/* Route-pick banner */}
        {routeMode !== 'none' && !disasterMode && (
          <div style={{
            position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(13,11,8,0.92)',
            border: `1px solid ${COLORS.secondary}40`,
            borderTop: `1px solid ${COLORS.secondary}60`,
            borderRadius: 10, padding: '8px 20px', fontSize: 12, fontWeight: 600,
            color: COLORS.secondary, pointerEvents: 'none',
            boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${COLORS.secondary}12`,
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.secondary,
              boxShadow: `0 0 6px ${COLORS.secondary}`, flexShrink: 0 }} />
            {routeMode === 'pickStart'
              ? 'Click a node to set the start point'
              : 'Click a node to set the end point'}
          </div>
        )}

        {/* Disaster draw banner */}
        {disasterMode && (
          <div style={{
            position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(13,11,8,0.92)',
            border: `1px solid ${COLORS.danger}44`,
            borderTop: `1px solid ${COLORS.danger}66`,
            borderRadius: 10, padding: '8px 20px', fontSize: 12, fontWeight: 600,
            color: COLORS.danger, pointerEvents: 'none',
            boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${COLORS.danger}10`,
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span>⚡</span>
            Click and drag to draw the disaster zone
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <SidebarShell width={320}>

        {/* Dataset */}
        {ds && (
          <SidebarSection title="Mission">
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{ds.name}</div>
            <div style={{ fontSize: 11, color: COLORS.textCaption, marginTop: 3 }}>
              {ds.node_count} nodes · {ds.edge_count} edges
            </div>
          </SidebarSection>
        )}

        {/* ── Route Planner — 3D widget ── */}
        <SidebarSection title="Route Planner">
          <Widget
            accentColor={COLORS.secondary}
            icon="🗺"
            title="Shortest Path"
            subtitle="Select start → end on the map"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <GlassRouteBtn
                label="Set Start"
                sublabel={routeStart != null && routeMode !== 'pickStart' ? `Node ${routeStart} ✓` : (routeMode === 'pickStart' ? 'Click a node now…' : 'Click to activate')}
                active={routeMode === 'pickStart'}
                color={COLORS.success}
                onClick={() => setRouteMode(routeMode === 'pickStart' ? 'none' : 'pickStart')}
              />
              <GlassRouteBtn
                label="Set End"
                sublabel={routeEnd != null && routeMode !== 'pickEnd' ? `Node ${routeEnd} ✓` : (routeMode === 'pickEnd' ? 'Click a node now…' : 'Select start first')}
                active={routeMode === 'pickEnd'}
                color={COLORS.danger}
                onClick={() => setRouteMode(routeMode === 'pickEnd' ? 'none' : 'pickEnd')}
                disabled={routeStart == null}
              />
            </div>

            {/* Route results */}
            {routeData && !routeData.error && (
              <div style={{
                marginTop: 10,
                padding: '10px 12px',
                background: `${COLORS.secondary}0A`,
                border: `1px solid ${COLORS.secondary}20`,
                borderRadius: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>Path length</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.secondary,
                    fontFamily: "'JetBrains Mono',monospace" }}>
                    {routeData.path?.length ?? '—'} nodes
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>Distance</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.secondary,
                    fontFamily: "'JetBrains Mono',monospace" }}>
                    {routeData.total_length?.toFixed(1) ?? '—'} px
                  </span>
                </div>
                {rerouteData && (
                  <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: COLORS.pathRerouted,
                    display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>↺</span> Rerouted around blocked nodes
                  </div>
                )}
              </div>
            )}
            {routeData?.error && (
              <div style={{ marginTop: 8, fontSize: 11, color: COLORS.danger, padding: '6px 8px',
                background: COLORS.dangerSubtle, borderRadius: 6 }}>
                {routeData.error}
              </div>
            )}
          </Widget>
        </SidebarSection>

        {/* ── Disaster Simulation — 3D widget ── */}
        <SidebarSection title="Disaster Simulation">
          <Widget
            accentColor={COLORS.danger}
            icon="⚡"
            title="Zone Strike"
            subtitle="Drag a box on the map to knock out nodes"
          >
            <button
              onClick={() => {
                setDisasterMode(m => !m)
                if (routeMode !== 'none') setRouteMode('none')
              }}
              disabled={!graphData}
              className="rr-btn"
              style={{
                width: '100%', padding: '11px', borderRadius: 10,
                background: disasterMode
                  ? `linear-gradient(135deg, ${COLORS.danger}22 0%, ${COLORS.danger}0A 100%)`
                  : `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
                border: `1px solid ${disasterMode ? COLORS.danger + '55' : 'rgba(255,255,255,0.09)'}`,
                borderTop: `1px solid ${disasterMode ? COLORS.danger + '80' : 'rgba(255,255,255,0.15)'}`,
                color: disasterMode ? COLORS.danger : COLORS.text,
                fontSize: 13, fontWeight: 700,
                cursor: graphData ? 'pointer' : 'not-allowed',
                opacity: graphData ? 1 : 0.4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                backdropFilter: 'blur(16px)',
                boxShadow: disasterMode
                  ? `0 4px 20px ${COLORS.danger}20, inset 0 1px 0 ${COLORS.danger}18`
                  : '0 2px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <span style={{ fontSize: 16 }}>{disasterMode ? '■' : '⚡'}</span>
              {disasterMode ? 'Cancel Strike' : 'Simulate Disaster'}
            </button>

            {disasterResult && (
              <div style={{ marginTop: 10, paddingTop: 10,
                borderTop: `1px solid ${COLORS.danger}20` }}>
                {disasterResult.message ? (
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{disasterResult.message}</div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                      {[
                        { label: 'In zone', value: disasterResult.insideCount, color: COLORS.textMuted },
                        { label: 'Disabled', value: disasterResult.selected.length, color: COLORS.danger },
                        { label: 'Junctions', value: disasterResult.junctionCount, color: COLORS.warning },
                      ].map(s => (
                        <div key={s.label} style={{
                          padding: '7px 9px', borderRadius: 7,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}>
                          <div style={{ fontSize: 9, color: COLORS.textCaption, textTransform: 'uppercase',
                            letterSpacing: '0.1em', marginBottom: 2 }}>{s.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: s.color,
                            fontFamily: "'Space Grotesk',monospace", lineHeight: 1 }}>
                            {s.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {disasterResult.selected.map(id => (
                        <span key={id} style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4,
                          background: `${COLORS.danger}15`,
                          border: `1px solid ${COLORS.danger}35`,
                          color: COLORS.danger,
                          fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
                        }}>{id}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </Widget>
        </SidebarSection>

        {/* Controls */}
        <SidebarSection title="Controls">
          <Toggle label="Show healed edges" value={showHealed} onChange={setShowHealed} />
          <button
            onClick={handleReset}
            disabled={!canReset}
            className="rr-btn"
            style={{
              width: '100%', marginTop: 8, padding: '9px',
              borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.danger}18 0%, ${COLORS.danger}08 100%)`,
              border: `1px solid ${COLORS.danger}40`,
              borderTop: `1px solid ${COLORS.danger}60`,
              color: COLORS.danger, fontSize: 12, fontWeight: 600,
              cursor: canReset ? 'pointer' : 'not-allowed',
              opacity: canReset ? 1 : 0.38,
              backdropFilter: 'blur(12px)',
            }}
          >
            Reset All
          </button>
        </SidebarSection>

        {/* Top gatekeepers */}
        <SidebarSection title="Top Gatekeepers" noBorder>
          <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
            Ranked by betweenness centrality. Click a row to highlight.
          </div>
          {topGatekeepers.length === 0 ? (
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
              {loading ? 'Computing…' : 'No data.'}
            </div>
          ) : (
            topGatekeepers.map((gk, i) => (
              <GatekeeperRow
                key={gk.id}
                rank={i + 1}
                nodeId={gk.id}
                centrality={gk.centrality}
                centralityNorm={centralityNorms[String(gk.id)] ?? 0}
                isDisabled={disabledNodes.has(gk.id)}
                onClick={() => highlightGatekeeper(gk.id)}
              />
            ))
          )}
        </SidebarSection>

      </SidebarShell>
    </div>
  )
}
