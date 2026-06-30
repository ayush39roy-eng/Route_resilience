// Simulation.jsx — disaster simulation + route planner page
import { useState } from 'react'
import { useDataset } from '../context/DatasetContext.jsx'
import { useGraphState } from '../hooks/useGraphState.js'
import NetworkMap from '../components/NetworkMap.jsx'
import {
  SidebarShell, SidebarSection, StatRow, StatGrid, MiniStat,
  Toggle, GatekeeperRow, Divider, EfficiencyBadge,
} from '../components/SidebarShell.jsx'
import { COLORS } from '../colors.js'

export default function Simulation() {
  const { activeDataset } = useDataset()
  const ds = activeDataset

  const {
    graphData, criticality, loading, error,
    disabledNodes, hoveredNode, setHoveredNode,
    routeStart, routeEnd, routeData, rerouteData, ablateResult,
    routeMode, setRouteMode,
    handleNodeClick, addDisabledNodes, reset, highlightGatekeeper,
  } = useGraphState(ds?.id)

  const [showHealed,    setShowHealed]    = useState(true)
  const [showHint,      setShowHint]      = useState(true)
  const [disasterMode,  setDisasterMode]  = useState(false)
  const [disasterNodes, setDisasterNodes] = useState(new Set())
  const [disasterResult,setDisasterResult]= useState(null)

  // ── Derived resilience values ─────────────────────────────────────────────
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

  // ── Reset (also clears disaster state) ───────────────────────────────────
  function handleReset() {
    reset()
    setDisasterNodes(new Set())
    setDisasterResult(null)
    setDisasterMode(false)
  }

  // ── Disaster selection callback (called by NetworkMap after box drawn) ────
  function handleDisasterSelect({ selected, insideCount }) {
    setDisasterMode(false)

    if (selected.length === 0) {
      setDisasterResult({ selected: [], insideCount, message: 'No eligible nodes in this area.' })
      return
    }

    // Count junctions in the selected set for the summary
    const nodeMap = Object.fromEntries((graphData?.nodes || []).map(n => [n.id, n]))
    const junctionCount = selected.filter(id => (nodeMap[id]?.degree ?? 0) >= 3).length

    addDisabledNodes(selected)
    setDisasterNodes(new Set(selected))
    setDisasterResult({ selected, insideCount, junctionCount })
  }

  return (
    <div className="rr-page" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

      {/* ── Map area (with overlays) ── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {/* ── Feature 2: Routing-area HUD frame ── */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20,
        }}>
          {/* Corner brackets */}
          {[
            { top: 8, left: 8,  borderTop: `1px solid ${COLORS.accent}50`, borderLeft:  `1px solid ${COLORS.accent}50` },
            { top: 8, right: 8, borderTop: `1px solid ${COLORS.accent}50`, borderRight: `1px solid ${COLORS.accent}50` },
            { bottom: 8, left: 8,  borderBottom: `1px solid ${COLORS.accent}50`, borderLeft:  `1px solid ${COLORS.accent}50` },
            { bottom: 8, right: 8, borderBottom: `1px solid ${COLORS.accent}50`, borderRight: `1px solid ${COLORS.accent}50` },
          ].map((style, i) => (
            <div key={i} style={{ position: 'absolute', width: 18, height: 18, ...style }} />
          ))}
          {/* Label */}
          <div style={{
            position: 'absolute', top: 10, right: 30,
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
            color: `${COLORS.accent}60`, textTransform: 'uppercase',
          }}>
            Routing Area
          </div>
        </div>

        {loading && <Overlay>Loading network…</Overlay>}
        {error   && <Overlay color={COLORS.danger}>{error}</Overlay>}
        {!loading && !error && !ds && (
          <Overlay>No dataset selected — pick one in the Gallery.</Overlay>
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
            disasterMode={disasterMode}
            onDisasterSelect={handleDisasterSelect}
            disasterNodes={disasterNodes}
          />
        )}

        {/* ── Feature 1: Instruction hint (top-left) ── */}
        {showHint && graphData && (
          <div style={{
            position: 'absolute', top: 20, left: 20, zIndex: 50,
            background: `${COLORS.panel}f0`,
            border: `1px solid rgba(255,255,255,0.10)`,
            borderTop: `1px solid rgba(255,255,255,0.16)`,
            borderRadius: 10, padding: '10px 14px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            maxWidth: 210,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>
                Tap any node to disable it
              </div>
              <button
                onClick={() => setShowHint(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: COLORS.textCaption, fontSize: 14, lineHeight: 1,
                  padding: 0, flexShrink: 0, marginTop: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.55 }}>
              Disabled nodes turn off and the network recomputes resilience live.
            </div>
          </div>
        )}

        {/* Route-mode status banner */}
        {routeMode !== 'none' && !disasterMode && (
          <div style={{
            position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
            background: `${COLORS.panel}f0`,
            border: `1px solid rgba(255,255,255,0.12)`,
            borderTop: `1px solid rgba(255,255,255,0.18)`,
            borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 500,
            color: COLORS.warning, pointerEvents: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}>
            {routeMode === 'pickStart'
              ? '▶ Click a node to set the route start'
              : '▶ Click a node to set the route end'}
          </div>
        )}

        {/* Disaster-mode draw banner */}
        {disasterMode && (
          <div style={{
            position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
            background: `${COLORS.panel}f0`,
            border: `1px solid ${COLORS.danger}44`,
            borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 500,
            color: COLORS.danger, pointerEvents: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            Click and drag to select the disaster area
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <SidebarShell>

        {/* Dataset */}
        <SidebarSection title="Dataset">
          {ds ? (
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{ds.name}</div>
          ) : (
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>No dataset selected.</div>
          )}
        </SidebarSection>

        {/* Resilience metrics */}
        <SidebarSection title="Resilience Metrics">
          <StatGrid>
            <MiniStat label="Disabled"    value={disabledNodes.size}
              color={disabledNodes.size > 0 ? COLORS.danger : undefined} />
            <MiniStat label="Isolated"    value={disconnCt}
              color={disconnCt > 0 ? COLORS.warning : undefined} />
            <MiniStat label="Resilience"  value={`${(ri * 100).toFixed(0)}%`}
              color={ri < 0.8 ? COLORS.danger : ri < 0.95 ? COLORS.warning : COLORS.success} />
            <MiniStat label="Eff. drop"   value={`${pctDrop.toFixed(1)}%`}
              color={pctDrop > 10 ? COLORS.danger : pctDrop > 3 ? COLORS.warning : COLORS.success} />
          </StatGrid>
          <EfficiencyBadge
            pctDrop={pctDrop} effColor={effColor} effBg={effBg} effBorder={effBorder}
          />
        </SidebarSection>

        {/* Route planner */}
        <SidebarSection title="Route Planner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
            <RouteBtn
              active={routeMode === 'pickStart'}
              color={COLORS.success}
              onClick={() => setRouteMode(routeMode === 'pickStart' ? 'none' : 'pickStart')}
            >
              {routeMode === 'pickStart' ? '▶ Click start node…' : 'Set Start'}
              {routeStart != null && routeMode !== 'pickStart' && (
                <NodeTag id={routeStart} />
              )}
            </RouteBtn>

            <RouteBtn
              active={routeMode === 'pickEnd'}
              color={COLORS.danger}
              onClick={() => setRouteMode(routeMode === 'pickEnd' ? 'none' : 'pickEnd')}
              disabled={routeStart == null}
            >
              {routeMode === 'pickEnd' ? '▶ Click end node…' : 'Set End'}
              {routeEnd != null && routeMode !== 'pickEnd' && (
                <NodeTag id={routeEnd} />
              )}
            </RouteBtn>
          </div>

          {routeData && !routeData.error && (
            <>
              <StatRow label="Path nodes" value={routeData.path?.length ?? '—'} />
              <StatRow label="Length (px)" value={routeData.total_length?.toFixed(1) ?? '—'} />
            </>
          )}
          {routeData?.error && (
            <div style={{ fontSize: 12, color: COLORS.danger, marginTop: 4 }}>
              {routeData.error}
            </div>
          )}
          {rerouteData && (
            <div style={{ marginTop: 6, fontSize: 11, fontWeight: 500, color: COLORS.pathRerouted }}>
              ↺ Rerouted around disabled nodes
            </div>
          )}
        </SidebarSection>

        {/* Controls */}
        <SidebarSection title="Controls">
          <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
            Click nodes to disable / re-enable them. Disabled nodes show ×.
          </div>
          <Toggle label="Show healed edges" value={showHealed} onChange={setShowHealed} />

          {/* Feature 3 — Simulate Disaster button */}
          <button
            onClick={() => {
              setDisasterMode(m => !m)
              if (routeMode !== 'none') setRouteMode('none')
            }}
            disabled={!graphData}
            className="rr-btn"
            style={{
              width: '100%', marginTop: 6, padding: '8px', borderRadius: 8,
              background: disasterMode ? `${COLORS.danger}22` : COLORS.warningSubtle,
              border: `1px solid ${disasterMode ? COLORS.danger : COLORS.warning}55`,
              color: disasterMode ? COLORS.danger : COLORS.warning,
              fontSize: 12, fontWeight: 600,
              cursor: graphData ? 'pointer' : 'not-allowed',
              opacity: graphData ? 1 : 0.4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span>{disasterMode ? '■' : '⚡'}</span>
            {disasterMode ? 'Cancel Disaster' : 'Simulate Disaster'}
          </button>

          <button
            onClick={handleReset}
            disabled={!canReset}
            className="rr-btn"
            style={{
              width: '100%', marginTop: 6, padding: '8px', borderRadius: 8,
              background: COLORS.dangerSubtle, border: `1px solid ${COLORS.danger}44`,
              color: COLORS.danger, fontSize: 12, fontWeight: 600,
              cursor: canReset ? 'pointer' : 'not-allowed',
              opacity: canReset ? 1 : 0.4,
            }}
          >
            Reset All
          </button>
        </SidebarSection>

        {/* Disaster result summary */}
        {disasterResult && (
          <SidebarSection title="Disaster Report">
            {disasterResult.message ? (
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                {disasterResult.message}
              </div>
            ) : (
              <>
                <StatRow label="Nodes in area"   value={disasterResult.insideCount} />
                <StatRow label="Disabled"         value={disasterResult.selected.length}
                  accent={COLORS.danger} />
                <StatRow label="Junctions hit"    value={disasterResult.junctionCount}
                  accent={disasterResult.junctionCount > 0 ? COLORS.warning : undefined} />
                <div style={{ marginTop: 8 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                    color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 6,
                  }}>
                    Disabled node IDs
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {disasterResult.selected.map(id => (
                      <span key={id} style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4,
                        background: `${COLORS.pathRerouted}22`,
                        border: `1px solid ${COLORS.pathRerouted}44`,
                        color: COLORS.pathRerouted,
                        fontFamily: "'JetBrains Mono','Fira Code',monospace",
                        fontWeight: 600,
                      }}>
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </SidebarSection>
        )}

        {/* Top gatekeepers */}
        <SidebarSection title="Top Gatekeepers" noBorder>
          <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
            Click a row to highlight that node; click on the map to disable it.
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

function Overlay({ children, color }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: color || COLORS.textMuted, fontSize: 14,
    }}>
      {children}
    </div>
  )
}

function RouteBtn({ children, active, color, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rr-btn"
      style={{
        width: '100%', padding: '8px 12px', borderRadius: 8, textAlign: 'left',
        background: active ? `${color}18` : COLORS.panelElevated,
        border: `1px solid ${active ? `${color}40` : COLORS.border}`,
        color: active ? color : COLORS.textMuted,
        fontSize: 12, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'flex', alignItems: 'center',
        boxShadow: active ? `0 0 12px ${color}18` : 'none',
      }}
    >
      {children}
    </button>
  )
}

function NodeTag({ id }) {
  return (
    <span style={{
      marginLeft: 'auto', fontSize: 10, color: COLORS.textCaption,
      fontFamily: "'JetBrains Mono','Fira Code',monospace",
    }}>
      node {id}
    </span>
  )
}
