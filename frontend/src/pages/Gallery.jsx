// Gallery.jsx — dataset grid with glass cards + active selection
import { useNavigate } from 'react-router-dom'
import { useDataset } from '../context/DatasetContext.jsx'
import { API } from '../api.js'
import { COLORS } from '../colors.js'

export default function Gallery() {
  const { datasets, activeId, setActiveId } = useDataset()
  const navigate = useNavigate()

  function selectAndGo(id, path) {
    setActiveId(id)
    navigate(path)
  }

  return (
    <div className="rr-page" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
            color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 8,
          }}>
            Dataset Gallery
          </div>
          <h1 className="rr-display" style={{
            fontSize: 26, fontWeight: 700, color: COLORS.text,
            letterSpacing: '-0.02em', marginBottom: 6,
          }}>
            Extracted Road Networks
          </h1>
          <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6 }}>
            {datasets.length} dataset{datasets.length !== 1 ? 's' : ''} available.
            Select a card, then open Criticality or Simulation to analyse.
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))',
          gap: 16,
        }}>
          {datasets.filter(ds => !ds.is_test).map((ds, i) => (
            <DatasetCard
              key={ds.id}
              ds={ds}
              isActive={ds.id === activeId}
              index={i}
              onSelect={() => setActiveId(ds.id)}
              onAnalyse={() => selectAndGo(ds.id, '/criticality')}
              onSimulate={() => selectAndGo(ds.id, '/simulation')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function DatasetCard({ ds, isActive, index, onSelect, onAnalyse, onSimulate }) {
  const thumbUrl     = ds.thumbnail_url ? `${API}${ds.thumbnail_url}` : null
  const hasMultiComp = ds.component_count > 1

  return (
    <div
      onClick={onSelect}
      className="rr-dataset-card"
      style={{
        background: COLORS.panelElevated,
        border: `1px solid ${isActive ? `${COLORS.accent}60` : COLORS.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: isActive
          ? `0 0 0 1px ${COLORS.accent}30, 0 8px 32px rgba(0,0,0,0.5), 0 0 24px ${COLORS.accent}14`
          : 'none',
        display: 'flex', flexDirection: 'column',
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* ── Thumbnail ── */}
      <div style={{
        width: '100%', aspectRatio: '1/1', position: 'relative',
        background: COLORS.background, overflow: 'hidden',
      }}>
        {thumbUrl ? (
          <img
            src={thumbUrl} alt={ds.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: COLORS.textCaption, fontSize: 12,
          }}>
            No preview
          </div>
        )}

        {/* Active badge */}
        {isActive && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: COLORS.secondary, color: '#fff',
            fontSize: 9, fontWeight: 700, padding: '3px 8px',
            borderRadius: 4, letterSpacing: '0.07em',
            boxShadow: `0 0 10px ${COLORS.secondary}60`,
          }}>
            ACTIVE
          </div>
        )}

        {/* Blue tint overlay on thumbnail */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(59,158,255,0.10) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
          background: `linear-gradient(transparent, ${COLORS.panelElevated}cc)`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Info ── */}
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Name */}
        <div style={{
          fontSize: 14, fontWeight: 700, color: COLORS.text,
          marginBottom: 10, letterSpacing: '-0.01em',
        }}>
          {ds.name}
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '4px 0', marginBottom: 12,
        }}>
          <Stat label="Nodes"      value={ds.node_count} color={COLORS.secondary} />
          <Stat label="Edges"      value={ds.edge_count} color={COLORS.secondary} />
          <Stat label="Components" value={ds.component_count}
            color={hasMultiComp ? COLORS.warning : undefined} />
          <Stat label="Efficiency" value={ds.base_efficiency?.toFixed(5)} wide />
        </div>

        {/* PNG availability dots */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 12 }}>
          {['satellite', 'mask', 'skeleton', 'graph_on_satellite'].map(k => (
            <div
              key={k}
              title={k}
              style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: ds.pngs?.[k] ? COLORS.success : COLORS.borderMid,
                boxShadow: ds.pngs?.[k] ? `0 0 4px ${COLORS.success}60` : 'none',
              }}
            />
          ))}
          <span style={{ fontSize: 10, color: COLORS.textCaption, marginLeft: 3 }}>
            layers
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
          <ActionBtn
            onClick={e => { e.stopPropagation(); onAnalyse() }}
            color={COLORS.secondary}
            bg={COLORS.secondarySubtle}
          >
            Heatmap
          </ActionBtn>
          <ActionBtn
            onClick={e => { e.stopPropagation(); onSimulate() }}
            color={COLORS.warning}
            bg={COLORS.warningSubtle}
          >
            Simulate
          </ActionBtn>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color, wide }) {
  return (
    <div style={{ gridColumn: wide ? 'span 2' : undefined }}>
      <span style={{ fontSize: 11, color: COLORS.textCaption }}>{label}: </span>
      <span style={{
        fontSize: 11, fontWeight: 600,
        color: color || COLORS.text,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
      }}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function ActionBtn({ children, onClick, color, bg }) {
  return (
    <button
      onClick={onClick}
      className="rr-btn"
      style={{
        flex: 1,
        padding: '7px 0',
        background: bg,
        border: `1px solid ${color}40`,
        borderRadius: 8,
        color,
        fontSize: 12, fontWeight: 600,
        cursor: 'pointer',
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </button>
  )
}
