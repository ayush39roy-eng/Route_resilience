// Home.jsx — cinematic mission-control landing page
import { useNavigate } from 'react-router-dom'
import { useDataset } from '../context/DatasetContext.jsx'
import { COLORS } from '../colors.js'

const FEATURES = [
  {
    icon: '🛰',
    title: 'Satellite Imagery',
    desc: 'Road networks extracted via segmentation → skeletonisation → graph pipeline.',
    link: '/layers',
    cta: 'View Layers',
    color: COLORS.accent,
  },
  {
    icon: '🔥',
    title: 'Criticality Heatmap',
    desc: 'Betweenness centrality reveals which intersections are true bottlenecks.',
    link: '/criticality',
    cta: 'Open Heatmap',
    color: COLORS.warning,
  },
  {
    icon: '💥',
    title: 'Disaster Simulation',
    desc: 'Disable any node — resilience index and global efficiency update live.',
    link: '/simulation',
    cta: 'Simulate',
    color: COLORS.danger,
  },
  {
    icon: '🗺',
    title: 'Dataset Gallery',
    desc: 'Browse extracted graphs with thumbnails, stats and quick actions.',
    link: '/gallery',
    cta: 'Browse',
    color: COLORS.success,
  },
]

export default function Home() {
  const navigate          = useNavigate()
  const { activeDataset } = useDataset()

  return (
    <div className="rr-page" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 24px 72px' }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>

          {/* Eyebrow badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px', borderRadius: 999,
            background: COLORS.accentSubtle,
            border: `1px solid ${COLORS.accent}33`,
            fontSize: 10, fontWeight: 700, color: COLORS.accent,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            Road Network Intelligence
          </div>

          <h1 className="rr-display" style={{
            fontSize: 52, fontWeight: 700, color: COLORS.text,
            lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 18,
          }}>
            Route Resilience
          </h1>

          <p style={{
            fontSize: 15, color: COLORS.textMuted, lineHeight: 1.7,
            maxWidth: 420, margin: '0 auto 32px',
          }}>
            Satellite road extraction · criticality analysis · disaster simulation
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/criticality')}
              className="rr-btn rr-btn-primary"
              style={{
                padding: '11px 26px',
                background: COLORS.accent,
                border: 'none',
                borderRadius: 9,
                color: '#fff',
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                boxShadow: `0 4px 20px ${COLORS.accent}40`,
              }}
            >
              Open Heatmap
            </button>
            <button
              onClick={() => navigate('/gallery')}
              className="rr-btn"
              style={{
                padding: '11px 26px',
                background: COLORS.panelElevated,
                border: `1px solid ${COLORS.borderMid}`,
                borderRadius: 9,
                color: COLORS.text,
                fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Browse Datasets
            </button>
          </div>

          {/* Active dataset indicator */}
          {activeDataset && (
            <div style={{
              marginTop: 20, fontSize: 12, color: COLORS.textCaption,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: COLORS.success, flexShrink: 0,
                boxShadow: `0 0 6px ${COLORS.success}60`,
              }} />
              <span>
                Active:{' '}
                <span style={{ color: COLORS.accent, fontWeight: 600 }}>
                  {activeDataset.name}
                </span>
                {' '}· {activeDataset.node_count} nodes · {activeDataset.edge_count} edges
              </span>
            </div>
          )}
        </div>

        {/* ── Feature cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
          gap: 12,
        }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="rr-card"
              style={{
                background: COLORS.panelElevated,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                padding: '22px 20px',
                cursor: 'pointer',
                animationDelay: `${i * 60}ms`,
              }}
              onClick={() => navigate(f.link)}
            >
              <div style={{ fontSize: 26, marginBottom: 14, lineHeight: 1 }}>{f.icon}</div>
              <div style={{
                fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 8,
                letterSpacing: '-0.01em',
              }}>
                {f.title}
              </div>
              <p style={{
                fontSize: 12, color: COLORS.textMuted, lineHeight: 1.65, marginBottom: 18,
              }}>
                {f.desc}
              </p>
              <span style={{ fontSize: 12, color: f.color, fontWeight: 600 }}>
                {f.cta} →
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
