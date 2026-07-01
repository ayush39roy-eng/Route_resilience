// SpaceLoader.jsx — animated space-themed loading, error, and empty states
import { COLORS } from '../colors.js'

/* ── Full-page overlay used on map pages ─────────────────────────────────── */
export function MapOverlay({ loading, error, empty }) {
  if (!loading && !error && !empty) return null

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 30,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 18,
    }}>
      {loading && (
        <>
          <div className="rr-space-loader" />
          <div style={{ fontSize: 13, color: COLORS.textMuted, letterSpacing: '0.04em' }}>
            Loading network…
          </div>
        </>
      )}
      {error && (
        <>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: `2px solid ${COLORS.danger}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: COLORS.danger,
          }}>
            ✕
          </div>
          <div style={{ fontSize: 13, color: COLORS.danger }}>{error}</div>
        </>
      )}
      {empty && (
        <>
          <OrbitIcon />
          <div style={{ fontSize: 13, color: COLORS.textMuted, textAlign: 'center', maxWidth: 200 }}>
            No dataset selected — pick one in the Gallery.
          </div>
        </>
      )}
    </div>
  )
}

/* ── Spinning orbit illustration ─────────────────────────────────────────── */
function OrbitIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ opacity: 0.6 }}>
      {/* Planet */}
      <circle cx="26" cy="26" r="7" fill={COLORS.accent} opacity="0.25" />
      <circle cx="26" cy="26" r="5" fill={COLORS.accent} opacity="0.5" />
      {/* Orbit ring */}
      <ellipse cx="26" cy="26" rx="20" ry="8" stroke={COLORS.accent} strokeWidth="1" strokeOpacity="0.3" />
      {/* Satellite dot */}
      <circle cx="46" cy="26" r="2.5" fill={COLORS.secondary} />
    </svg>
  )
}

/* ── Inline spinner for buttons/small contexts ───────────────────────────── */
export function InlineSpinner({ size = 16 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `${size < 20 ? 1.5 : 2}px solid rgba(255,122,26,0.2)`,
      borderTopColor: COLORS.accent,
      animation: 'rr-orbit 0.9s linear infinite',
      flexShrink: 0,
    }} />
  )
}
