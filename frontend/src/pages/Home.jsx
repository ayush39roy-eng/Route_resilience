// Home.jsx — cinematic space-mission landing page with Three.js hero
import { useNavigate } from 'react-router-dom'
import { useDataset } from '../context/DatasetContext.jsx'
import { COLORS } from '../colors.js'
import SpaceHero from '../components/SpaceHero.jsx'

const FEATURES = [
  {
    icon: '🛰',
    title: 'Satellite Imagery',
    desc: 'Road networks extracted via segmentation → skeletonisation → graph pipeline.',
    link: '/layers',
    cta: 'View Layers',
    accent: COLORS.secondary,
    accentSubtle: COLORS.secondarySubtle,
  },
  {
    icon: '🔥',
    title: 'Criticality Heatmap',
    desc: 'Betweenness centrality reveals which intersections are true bottlenecks.',
    link: '/criticality',
    cta: 'Open Heatmap',
    accent: COLORS.accent,
    accentSubtle: COLORS.accentSubtle,
  },
  {
    icon: '⚡',
    title: 'Disaster Simulation',
    desc: 'Disable any node — resilience index and global efficiency update live.',
    link: '/simulation',
    cta: 'Simulate',
    accent: COLORS.danger,
    accentSubtle: COLORS.dangerSubtle,
  },
  {
    icon: '🗺',
    title: 'Dataset Gallery',
    desc: 'Browse extracted graphs with thumbnails, stats and quick actions.',
    link: '/gallery',
    cta: 'Browse',
    accent: COLORS.success,
    accentSubtle: COLORS.successSubtle,
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { activeDataset } = useDataset()

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>

      {/* ── Hero section — full viewport height ── */}
      <div style={{
        position: 'relative',
        minHeight: 'calc(100vh - 54px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>

        {/* Three.js node-network scene */}
        <SpaceHero />

        {/* Amber glow from below-left */}
        <div className="rr-hero-glow" style={{
          position: 'absolute', bottom: 0, left: 0,
          width: '70%', height: '50%',
          background: 'radial-gradient(ellipse 80% 100% at 20% 100%, rgba(217,123,26,0.14) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 1,
        }} />

        {/* Strong blue rim from top-right */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '65%', height: '55%',
          background: 'radial-gradient(ellipse 80% 100% at 100% 0%, rgba(59,158,255,0.18) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 1,
        }} />

        {/* Blue bottom-right accent */}
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: '40%', height: '30%',
          background: 'radial-gradient(ellipse 100% 100% at 100% 100%, rgba(56,189,248,0.10) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 1,
        }} />

        {/* ── Hero content ── */}
        <div style={{
          position: 'relative', zIndex: 10,
          textAlign: 'center',
          padding: '0 24px',
          maxWidth: 700,
        }}>

          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 16px', borderRadius: 999,
            background: `${COLORS.accent}18`,
            border: `1px solid ${COLORS.accent}35`,
            fontSize: 10, fontWeight: 700, color: COLORS.accent,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            marginBottom: 28,
            boxShadow: `0 0 20px ${COLORS.accent}18`,
          }}>
            <span style={{
              display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
              background: COLORS.accent,
              boxShadow: `0 0 6px ${COLORS.accent}`,
            }} />
            ISRO · Road Network Intelligence
          </div>

          {/* Main title */}
          <h1 className="rr-display" style={{
            fontSize: 'clamp(42px, 7vw, 72px)',
            fontWeight: 800,
            color: COLORS.text,
            lineHeight: 1.03,
            letterSpacing: '-0.04em',
            marginBottom: 20,
            textShadow: '0 2px 40px rgba(0,0,0,0.9)',
          }}>
            Route{' '}
            <span style={{
              background: `linear-gradient(135deg, ${COLORS.accentBright} 0%, ${COLORS.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(209,130,40,0.35))',
            }}>
              Resilience
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 15, color: COLORS.textMuted, lineHeight: 1.75,
            maxWidth: 440, margin: '0 auto 36px',
            textShadow: '0 1px 12px rgba(0,0,0,0.9)',
          }}>
            Satellite road extraction&nbsp;·&nbsp;criticality analysis&nbsp;·&nbsp;disaster simulation
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/criticality')}
              className="rr-btn rr-btn-primary"
              style={{
                padding: '12px 28px',
                background: COLORS.accent,
                border: 'none',
                borderRadius: 10,
                color: '#0A0A0F',
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                boxShadow: `0 4px 24px ${COLORS.accent}50, 0 0 0 1px ${COLORS.accent}`,
              }}
            >
              Open Heatmap
            </button>
            <button
              onClick={() => navigate('/simulation')}
              className="rr-btn"
              style={{
                padding: '12px 28px',
                background: 'rgba(255,122,26,0.10)',
                border: `1px solid ${COLORS.accent}40`,
                borderRadius: 10,
                color: COLORS.accent,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
              }}
            >
              Simulate Disaster
            </button>
            <button
              onClick={() => navigate('/gallery')}
              className="rr-btn"
              style={{
                padding: '12px 28px',
                background: `${COLORS.panelElevated}cc`,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                color: COLORS.textMuted,
                fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
              }}
            >
              Browse Datasets
            </button>
          </div>

          {/* Active dataset pill */}
          {activeDataset && (
            <div style={{
              marginTop: 24, fontSize: 12, color: COLORS.textCaption,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: COLORS.success, flexShrink: 0,
                boxShadow: `0 0 7px ${COLORS.success}80`,
              }} />
              <span>
                Active:{' '}
                <span style={{ color: COLORS.accent, fontWeight: 600 }}>
                  {activeDataset.name}
                </span>
                {' '}·{' '}{activeDataset.node_count} nodes · {activeDataset.edge_count} edges
              </span>
            </div>
          )}
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          fontSize: 11, color: COLORS.textCaption, letterSpacing: '0.1em',
          textTransform: 'uppercase', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
          <span>Scroll</span>
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <path d="M6 2v10M2 8l4 5 4-5" stroke={COLORS.textCaption} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── Feature cards ── */}
      <div style={{
        maxWidth: 960, margin: '0 auto',
        padding: '72px 24px 80px',
      }}>

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
            color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 12,
          }}>
            Mission Capabilities
          </div>
          <h2 className="rr-display" style={{
            fontSize: 30, fontWeight: 700, color: COLORS.text,
            letterSpacing: '-0.03em',
          }}>
            Everything you need to analyse road resilience
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
        }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="rr-card"
              onClick={() => navigate(f.link)}
              style={{
                background: `${COLORS.panelElevated}ee`,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 16,
                padding: '24px 20px',
                cursor: 'pointer',
                animationDelay: `${i * 60}ms`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle accent glow corner */}
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: 80, height: 80,
                background: `radial-gradient(circle at 100% 0%, ${f.accent}18 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${f.accent}15`,
                border: `1px solid ${f.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 8,
                letterSpacing: '-0.01em',
              }}>
                {f.title}
              </div>
              <p style={{
                fontSize: 12, color: COLORS.textMuted, lineHeight: 1.65, marginBottom: 20,
              }}>
                {f.desc}
              </p>
              <span style={{
                fontSize: 12, color: f.accent, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {f.cta}
                <span style={{ opacity: 0.7 }}>→</span>
              </span>
            </div>
          ))}
        </div>

        {/* Bottom pipeline strip */}
        <div style={{
          marginTop: 56,
          padding: '20px 24px',
          background: `${COLORS.panelElevated}aa`,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          backdropFilter: 'blur(18px)',
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
            color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 14,
          }}>
            Processing Pipeline
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
            {['Satellite Image', 'Segmentation Mask', 'Skeletonisation', 'Graph Extraction', 'Criticality Analysis'].map((s, i, arr) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  padding: '5px 12px',
                  background: COLORS.background,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 6,
                  fontSize: 11, color: COLORS.text, fontWeight: 500,
                }}>
                  {s}
                </div>
                {i < arr.length - 1 && (
                  <div style={{ color: COLORS.accent, fontSize: 12, margin: '0 4px', opacity: 0.5 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
