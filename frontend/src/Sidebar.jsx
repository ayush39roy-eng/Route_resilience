// Sidebar.jsx — Stats, Gatekeepers, Route Planner, Controls
import { centralityColorHex, COLORS } from './colors.js'

export default function Sidebar({
  graphData, criticality, ablateResult,
  disabledNodes, routeStart, routeEnd,
  routeData, rerouteData, routeMode,
  showHealed, setShowHealed,
  showHeatmap, setShowHeatmap,
  onSetRouteMode, onReset,
  onHighlightGatekeeper,
}) {
  const stats = graphData?.stats || {}
  const baseEff     = stats.base_efficiency ?? 0
  const currentEff  = ablateResult?.efficiency_after ?? baseEff
  const resilienceIdx = ablateResult?.resilience_index ?? 1
  const pctDrop     = ablateResult?.pct_drop ?? 0
  const topNodes    = criticality?.top_gatekeepers || []

  const effColor = resilienceIdx < 0.7
    ? COLORS.danger
    : resilienceIdx < 0.9
    ? COLORS.warning
    : COLORS.success

  const effBg = resilienceIdx < 0.7
    ? COLORS.dangerSubtle
    : resilienceIdx < 0.9
    ? COLORS.warningSubtle
    : COLORS.successSubtle

  const effBorder = resilienceIdx < 0.7
    ? `${COLORS.danger}55`
    : resilienceIdx < 0.9
    ? `${COLORS.warning}55`
    : `${COLORS.success}55`

  return (
    <div style={{
      width: 316,
      minWidth: 280,
      background: COLORS.panel,
      borderLeft: `1px solid ${COLORS.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div
        className="rr-sidebar-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px' }}
      >

        {/* ══ Network Stats ══════════════════════════════════════════════════ */}
        <Section title="Network Stats">
          <StatGrid>
            <MiniStat label="Nodes"      value={stats.node_count ?? '—'} />
            <MiniStat label="Edges"      value={stats.edge_count ?? '—'} />
            <MiniStat label="Healed"     value={stats.healed_edge_count ?? '—'} color={COLORS.healed} />
            <MiniStat label="Components" value={stats.component_count ?? '—'} />
          </StatGrid>

          <div style={{ height: 1, background: COLORS.border, margin: '10px 0' }} />

          <StatRow label="Base efficiency"    value={baseEff.toFixed(5)} />
          <StatRow
            label="Current efficiency"
            value={currentEff.toFixed(5)}
            accent={disabledNodes.size > 0 ? effColor : undefined}
          />
          <StatRow
            label="Resilience index"
            value={disabledNodes.size > 0 ? resilienceIdx.toFixed(4) : '1.0000'}
            accent={disabledNodes.size > 0 ? effColor : undefined}
          />

          {disabledNodes.size > 0 && (
            <div className="rr-eff-badge" style={{
              marginTop: 10, padding: '10px 14px', borderRadius: 8,
              background: pctDrop > 0 ? effBg : COLORS.panelElevated,
              border: `1px solid ${pctDrop > 0 ? effBorder : COLORS.border}`,
              display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6,
            }}>
              {pctDrop > 0 ? (
                <>
                  <span style={{ color: effColor, fontWeight: 700, fontSize: 22, lineHeight: 1 }}>
                    −{pctDrop.toFixed(1)}%
                  </span>
                  <span style={{ color: COLORS.textMuted, fontSize: 12 }}>efficiency drop</span>
                </>
              ) : (
                <span style={{ color: COLORS.success, fontWeight: 600, fontSize: 13 }}>
                  Network intact
                </span>
              )}
            </div>
          )}
        </Section>

        {/* ══ Controls ══════════════════════════════════════════════════════ */}
        <Section title="Controls">
          <Toggle label="Criticality Heatmap"  value={showHeatmap} onChange={setShowHeatmap} />
          <Toggle label="Show Healed Edges"    value={showHealed}  onChange={setShowHealed} />

          <div style={{ height: 1, background: COLORS.border, margin: '10px 0 12px' }} />

          <button
            className="rr-btn rr-btn-reset"
            onClick={onReset}
            style={{
              width: '100%', padding: '8px 0',
              background: 'transparent',
              border: `1px solid ${COLORS.danger}66`,
              borderRadius: 8,
              color: COLORS.danger,
              fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reset All
          </button>

          <p style={{ fontSize: 11, color: COLORS.textCaption, marginTop: 8, lineHeight: 1.6 }}>
            Click any node to disable / re-enable it.
            <br />Alt + drag or middle-mouse to pan.
          </p>
        </Section>

        {/* ══ Route Planner ════════════════════════════════════════════════ */}
        <Section title="Route Planner">
          <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
            <RoutePickBtn
              active={routeMode === 'pickStart'}
              set={routeStart != null}
              label={routeStart != null ? `Start · ${routeStart}` : 'Set Start'}
              color={COLORS.success}
              activeBg="#0d2a1a"
              activeBorder={`${COLORS.success}66`}
              className="rr-btn-start"
              onClick={() => onSetRouteMode('pickStart')}
            />
            <RoutePickBtn
              active={routeMode === 'pickEnd'}
              set={routeEnd != null}
              label={routeEnd != null ? `End · ${routeEnd}` : 'Set End'}
              color={COLORS.danger}
              activeBg={COLORS.dangerSubtle}
              activeBoard={`${COLORS.danger}66`}
              className="rr-btn-end"
              onClick={() => onSetRouteMode('pickEnd')}
            />
          </div>

          {routeMode !== 'none' && (
            <div style={{
              padding: '7px 10px', borderRadius: 6, marginBottom: 8,
              background: COLORS.warningSubtle,
              border: `1px solid ${COLORS.warning}44`,
              fontSize: 12, color: COLORS.warning, lineHeight: 1.5,
            }}>
              Click a node on the map to select the{' '}
              <strong>{routeMode === 'pickStart' ? 'start' : 'end'}</strong> point.
            </div>
          )}

          {routeData?.error && (
            <div style={{
              padding: '7px 10px', borderRadius: 6,
              background: COLORS.dangerSubtle,
              border: `1px solid ${COLORS.danger}44`,
              fontSize: 12, color: COLORS.danger,
            }}>
              {routeData.error}
            </div>
          )}

          {routeData && !routeData.error && (
            <div>
              <StatRow label="Hops"     value={routeData.nodes?.length ?? 0} />
              <StatRow
                label="Distance"
                value={`${routeData.total_length?.toFixed(1)} px`}
                accent={COLORS.path}
              />
              {rerouteData && (
                <>
                  <div style={{ height: 1, background: COLORS.border, margin: '8px 0' }} />
                  <div style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
                    color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 6,
                  }}>
                    Rerouted path
                  </div>
                  <StatRow
                    label="New distance"
                    value={`${rerouteData.total_length?.toFixed(1)} px`}
                    accent={COLORS.pathRerouted}
                  />
                  <StatRow
                    label="Extra distance"
                    value={`+${(rerouteData.total_length - routeData.total_length).toFixed(1)} px`}
                    accent={COLORS.warning}
                  />
                </>
              )}
            </div>
          )}
        </Section>

        {/* ══ Top Gatekeepers ══════════════════════════════════════════════ */}
        <Section title={`Top Gatekeepers`}>
          <p style={{ fontSize: 11, color: COLORS.textCaption, marginBottom: 10, lineHeight: 1.5 }}>
            Nodes carrying the most shortest paths. Click to highlight.
          </p>
          {topNodes.length === 0 && (
            <p style={{ color: COLORS.textMuted, fontSize: 12 }}>Loading…</p>
          )}
          {topNodes.map((gk, i) => {
            const maxC = topNodes[0]?.centrality || 1
            return (
              <GatekeeperRow
                key={gk.id}
                rank={i + 1}
                nodeId={gk.id}
                centrality={gk.centrality}
                centralityNorm={maxC > 0 ? gk.centrality / maxC : 0}
                isDisabled={disabledNodes.has(gk.id)}
                onClick={() => onHighlightGatekeeper(gk.id)}
              />
            )
          })}
        </Section>

      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{
      borderBottom: `1px solid ${COLORS.border}`,
      padding: '16px 16px',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 12,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function StatGrid({ children }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
    }}>
      {children}
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{
      background: COLORS.panelElevated,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 7,
      padding: '7px 10px',
    }}>
      <div style={{ fontSize: 10, color: COLORS.textCaption, marginBottom: 2 }}>{label}</div>
      <div style={{
        fontSize: 16, fontWeight: 700,
        color: color || COLORS.text,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.1,
      }}>
        {value}
      </div>
    </div>
  )
}

function StatRow({ label, value, accent }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 5,
    }}>
      <span style={{ fontSize: 12, color: COLORS.textMuted }}>{label}</span>
      <span className="rr-stat-value" style={{
        fontSize: 11.5, fontWeight: 600,
        color: accent || COLORS.text,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      }}>
        {value}
      </span>
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 10,
    }}>
      <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 400 }}>{label}</span>

      {/* Toggle track */}
      <button
        onClick={() => onChange(!value)}
        aria-checked={value}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: value ? COLORS.accent : '#2a2f3a',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s ease',
          flexShrink: 0,
          boxShadow: value ? `0 0 0 2px ${COLORS.accent}33` : 'none',
        }}
      >
        {/* Thumb */}
        <span style={{
          display: 'block',
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 3,
          left: value ? 23 : 3,
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }} />
      </button>
    </div>
  )
}

function RoutePickBtn({ active, set, label, color, activeBg, className, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rr-btn ${className}`}
      style={{
        flex: 1,
        padding: '8px 10px',
        background: active ? activeBg : COLORS.panelElevated,
        border: `1px solid ${active ? color + 'aa' : COLORS.border}`,
        borderRadius: 8,
        color: active || set ? color : COLORS.textMuted,
        fontSize: 12, fontWeight: 500,
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.15s ease',
      }}
    >
      {set && !active && (
        <span style={{
          display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
          background: color, marginRight: 5, verticalAlign: 'middle',
        }} />
      )}
      {label}
    </button>
  )
}

function GatekeeperRow({ rank, nodeId, centrality, centralityNorm, isDisabled, onClick }) {
  const normApprox = centralityNorm ?? Math.min(1, centrality * 200)
  const color = centralityColorHex(normApprox)

  return (
    <button
      onClick={onClick}
      className="rr-gk-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        width: '100%',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '6px 4px',
        textAlign: 'left',
      }}
    >
      {/* Rank badge */}
      <span style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        background: isDisabled ? COLORS.nodeDisabled : color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: '#000',
        opacity: isDisabled ? 0.4 : 1,
        transition: 'transform 0.12s',
      }}>
        {rank}
      </span>

      {/* Node id + centrality score */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 500,
          color: isDisabled ? COLORS.textMuted : COLORS.text,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          Node {nodeId}
          {isDisabled && (
            <span style={{
              fontSize: 10, padding: '1px 5px', borderRadius: 4,
              background: COLORS.dangerSubtle, color: COLORS.danger,
            }}>off</span>
          )}
        </div>
        <div style={{
          fontSize: 10.5,
          color: COLORS.textCaption,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}>
          {centrality.toFixed(5)}
        </div>
      </div>

      {/* Centrality bar */}
      <div style={{
        width: 52, height: 5,
        background: COLORS.panelElevated,
        borderRadius: 3,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          width: `${(normApprox * 100).toFixed(0)}%`,
          height: '100%',
          background: color,
          borderRadius: 3,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </button>
  )
}
