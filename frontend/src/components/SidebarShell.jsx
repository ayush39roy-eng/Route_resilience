// SidebarShell.jsx — glassmorphism sidebar + all shared UI primitives
import { centralityColorHex, COLORS } from '../colors.js'

/* ── Outer shell ──────────────────────────────────────────────────────────── */
export function SidebarShell({ children, width = 300 }) {
  return (
    <div style={{
      width,
      minWidth: Math.min(width, 260),
      flexShrink: 0,
      background: `${COLORS.panel}ec`,
      borderLeft: `1px solid ${COLORS.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minHeight: 0,
      backdropFilter: 'blur(24px) saturate(130%)',
      WebkitBackdropFilter: 'blur(24px) saturate(130%)',
      /* Light catch on the left edge */
      boxShadow: `inset 1px 0 0 ${COLORS.borderMid}40`,
    }}>
      <div
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
        className="rr-sidebar-scroll"
      >
        {children}
      </div>
    </div>
  )
}

/* ── Section ──────────────────────────────────────────────────────────────── */
export function SidebarSection({ title, children, noBorder }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: noBorder ? 'none' : `1px solid ${COLORS.border}`,
    }}>
      {title && (
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: COLORS.secondary,
          textTransform: 'uppercase',
          marginBottom: 12,
          opacity: 0.85,
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

/* ── StatRow — label/value pair ───────────────────────────────────────────── */
export function StatRow({ label, value, accent }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '5px 0',
      borderBottom: `1px solid ${COLORS.border}55`,
    }}>
      <span style={{ fontSize: 12, color: COLORS.textMuted }}>{label}</span>
      <span className="rr-stat-value" style={{
        fontSize: 12,
        fontWeight: 600,
        color: accent || COLORS.text,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace",
        letterSpacing: '-0.01em',
      }}>
        {value}
      </span>
    </div>
  )
}

/* ── StatGrid — 2-col mini stat layout ───────────────────────────────────── */
export function StatGrid({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {children}
    </div>
  )
}

/* ── MiniStat — numbered KPI tile ────────────────────────────────────────── */
export function MiniStat({ label, value, color }) {
  return (
    <div style={{
      background: COLORS.background,
      border: `1px solid ${COLORS.border}`,
      borderTop: `1px solid ${COLORS.borderMid}`,
      borderRadius: 9,
      padding: '9px 11px',
    }}>
      <div style={{
        fontSize: 9,
        fontWeight: 700,
        color: COLORS.textCaption,
        textTransform: 'uppercase',
        letterSpacing: '0.10em',
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div className="rr-stat-value" style={{
        fontSize: 20,
        fontWeight: 700,
        color: color || COLORS.text,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        fontFamily: "'Space Grotesk','JetBrains Mono','Fira Code',monospace",
        letterSpacing: '-0.02em',
      }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

/* ── Toggle switch ────────────────────────────────────────────────────────── */
export function Toggle({ label, value, onChange }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '4px 0',
      marginBottom: 8,
    }}>
      <span style={{ fontSize: 13, color: COLORS.text }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="rr-toggle-track"
        style={{
          width: 36, height: 20, borderRadius: 10, border: 'none',
          background: value ? COLORS.accent : COLORS.borderMid,
          position: 'relative', cursor: 'pointer', flexShrink: 0,
          boxShadow: value ? `0 0 0 2px ${COLORS.accent}28, 0 0 8px ${COLORS.accent}20` : 'none',
          padding: 0,
        }}
      >
        <span
          className="rr-toggle-thumb"
          style={{
            display: 'block',
            width: 14, height: 14, borderRadius: '50%',
            background: '#fff',
            position: 'absolute', top: 3,
            left: value ? 19 : 3,
            boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}
        />
      </button>
    </div>
  )
}

/* ── BgLayerSelector ──────────────────────────────────────────────────────── */
export function BgLayerSelector({ value, onChange, available }) {
  const layers = [
    { key: 'dark',              label: 'Dark'      },
    { key: 'satellite',         label: 'Satellite'  },
    { key: 'mask',              label: 'Mask'       },
    { key: 'skeleton',          label: 'Skeleton'   },
    { key: 'graph_on_satellite',label: 'Graph+Sat'  },
  ]
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
        color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 8,
      }}>
        Background
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {layers.map(({ key, label }) => {
          const isAvail = key === 'dark' || (available?.[key])
          if (!isAvail) return null
          const active = value === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="rr-btn"
              style={{
                padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 500,
                cursor: 'pointer',
                border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                background: active ? COLORS.accentSubtle : COLORS.panelElevated,
                color: active ? COLORS.accent : COLORS.textMuted,
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── GatekeeperRow ────────────────────────────────────────────────────────── */
export function GatekeeperRow({ rank, nodeId, centrality, centralityNorm, isDisabled, onClick }) {
  const norm  = centralityNorm ?? Math.min(1, centrality * 200)
  const color = centralityColorHex(norm)

  return (
    <button
      onClick={onClick}
      className="rr-gk-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        width: '100%', padding: '6px 6px',
        background: 'transparent', border: 'none', cursor: 'pointer',
      }}
    >
      {/* Rank badge */}
      <div style={{
        width: 22, height: 22, borderRadius: 5, flexShrink: 0,
        background: isDisabled ? `${COLORS.border}80` : `${color}1A`,
        border: `1px solid ${isDisabled ? COLORS.border : `${color}44`}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700,
        color: isDisabled ? COLORS.textCaption : color,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {rank}
      </div>

      {/* Label + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 500,
          color: isDisabled ? COLORS.textMuted : COLORS.text,
          display: 'flex', alignItems: 'center', gap: 5,
          marginBottom: 4,
        }}>
          Node {nodeId}
          {isDisabled && (
            <span style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 3,
              background: COLORS.dangerSubtle, color: COLORS.danger,
              fontWeight: 600,
            }}>
              off
            </span>
          )}
        </div>
        <div style={{
          height: 3, background: COLORS.border,
          borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            width: `${(norm * 100).toFixed(1)}%`, height: '100%',
            background: isDisabled ? COLORS.borderMid : color,
            borderRadius: 2,
            transition: 'width 0.4s ease',
            boxShadow: isDisabled ? 'none' : `0 0 6px ${color}80`,
          }} />
        </div>
      </div>

      {/* Score */}
      <div style={{
        fontSize: 10, color: COLORS.textCaption,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        flexShrink: 0,
        letterSpacing: '-0.01em',
      }}>
        {centrality.toFixed(4)}
      </div>
    </button>
  )
}

/* ── Divider ──────────────────────────────────────────────────────────────── */
export function Divider({ my = 8 }) {
  return (
    <div style={{
      height: 1,
      background: COLORS.border,
      margin: `${my}px 0`,
      opacity: 0.7,
    }} />
  )
}

/* ── EfficiencyBadge ──────────────────────────────────────────────────────── */
export function EfficiencyBadge({ pctDrop, effColor, effBg, effBorder }) {
  return (
    <div className="rr-eff-badge" style={{
      marginTop: 10, padding: '12px 14px', borderRadius: 10,
      background: effBg, border: `1px solid ${effBorder}44`,
      textAlign: 'center',
    }}>
      {pctDrop > 0 ? (
        <div>
          <div style={{
            fontFamily: "'Space Grotesk','JetBrains Mono',monospace",
            color: effColor, fontWeight: 700, fontSize: 26, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
            textShadow: `0 0 20px ${effColor}50`,
          }}>
            −{pctDrop.toFixed(1)}%
          </div>
          <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 5 }}>
            efficiency drop
          </div>
        </div>
      ) : (
        <div style={{ color: COLORS.success, fontWeight: 600, fontSize: 13 }}>
          Network intact
        </div>
      )}
    </div>
  )
}
