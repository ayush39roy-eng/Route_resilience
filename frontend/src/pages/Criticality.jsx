// Criticality.jsx — betweenness centrality heatmap page
import { useState } from 'react'
import { useDataset } from '../context/DatasetContext.jsx'
import { useGraphState } from '../hooks/useGraphState.js'
import NetworkMap from '../components/NetworkMap.jsx'
import {
  SidebarShell, SidebarSection, StatRow, StatGrid, MiniStat,
  Toggle, GatekeeperRow, Divider,
} from '../components/SidebarShell.jsx'
import { COLORS } from '../colors.js'
import { MapOverlay } from '../components/SpaceLoader.jsx'

export default function Criticality() {
  const { activeDataset } = useDataset()
  const ds = activeDataset

  const {
    graphData, criticality, loading, error,
    hoveredNode, setHoveredNode,
    highlightGatekeeper,
  } = useGraphState(ds?.id)

  const [showHealed, setShowHealed] = useState(true)

  const topGatekeepers  = criticality?.top_gatekeepers ?? []
  const centralityNorms = criticality?.centrality_norm ?? {}

  return (
    <div className="rr-page" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

      {/* ── Map area ── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <MapOverlay loading={loading} error={error} empty={!loading && !error && !ds} />
        {graphData && (
          <NetworkMap
            graphData={graphData}
            criticality={criticality}
            disabledNodes={new Set()}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            showHealed={showHealed}
            showHeatmap={false}
          />
        )}
      </div>

      {/* ── Sidebar ── */}
      <SidebarShell>

        <SidebarSection title="Dataset">
          {ds ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
                {ds.name}
              </div>
              <StatGrid>
                <MiniStat label="Nodes"       value={ds.node_count} />
                <MiniStat label="Edges"       value={ds.edge_count} />
                <MiniStat label="Components"  value={ds.component_count}
                  color={ds.component_count > 1 ? COLORS.warning : undefined} />
                <MiniStat label="Efficiency"  value={ds.base_efficiency?.toFixed(4)}
                  color={COLORS.accent} />
              </StatGrid>
              {ds.healed_edge_count > 0 && (
                <div style={{ marginTop: 8 }}>
                  <StatRow label="Healed edges" value={ds.healed_edge_count}
                    accent={COLORS.healed} />
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>No dataset selected.</div>
          )}
        </SidebarSection>

        <SidebarSection title="Display">
          <Toggle label="Show healed edges" value={showHealed} onChange={setShowHealed} />
        </SidebarSection>

        <SidebarSection title="Top Gatekeepers" noBorder>
          <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
            Nodes ranked by betweenness centrality. Click a row to highlight it on the map.
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
                isDisabled={false}
                onClick={() => highlightGatekeeper(gk.id)}
              />
            ))
          )}
        </SidebarSection>

      </SidebarShell>
    </div>
  )
}

