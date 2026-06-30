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
    handleNodeClick, reset, highlightGatekeeper,
  } = useGraphState(ds?.id)

  const [showHealed, setShowHealed] = useState(true)

  const topGatekeepers  = criticality?.top_gatekeepers ?? []
  const centralityNorms = criticality?.centrality_norm ?? {}

  const pctDrop    = ablateResult?.pct_drop         ?? 0
  const ri         = ablateResult?.resilience_index ?? 1
  const disconnCt  = ablateResult?.disconnected_nodes?.length ?? 0

  let effColor = COLORS.success
  if (pctDrop > 20)     effColor = COLORS.danger
  else if (pctDrop > 8) effColor = COLORS.warning
  const effBg     = pctDrop > 20 ? COLORS.dangerSubtle  : pctDrop > 8  ? COLORS.warningSubtle : COLORS.successSubtle
  const effBorder = pctDrop > 20 ? COLORS.danger        : pctDrop > 8  ? COLORS.warning       : COLORS.success

  const canReset = disabledNodes.size > 0 || routeStart != null

  return (
    <div className="rr-page" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
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
          />
        )}

        {/* Route-mode status banner */}
        {routeMode !== 'none' && (
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
          <button
            onClick={reset}
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
