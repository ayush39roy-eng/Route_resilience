// NavBar.jsx — HUD-style top navigation
import { NavLink, useNavigate } from 'react-router-dom'
import { useDataset } from '../context/DatasetContext.jsx'
import { COLORS } from '../colors.js'

const NAV_LINKS = [
  { to: '/',            label: 'Home'        },
  { to: '/gallery',     label: 'Gallery'     },
  { to: '/criticality', label: 'Criticality' },
  { to: '/simulation',  label: 'Simulation'  },
  { to: '/layers',      label: 'Layers'      },
  { to: '/upload',      label: 'Upload'      },
]

export default function NavBar() {
  const { activeDataset, datasets, setActiveId } = useDataset()
  const navigate = useNavigate()

  return (
    <nav style={{
      height: 54,
      background: `${COLORS.panel}e8`,
      borderBottom: `1px solid ${COLORS.border}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      flexShrink: 0,
      zIndex: 100,
      position: 'relative',
      backdropFilter: 'blur(24px) saturate(140%)',
      WebkitBackdropFilter: 'blur(24px) saturate(140%)',
    }}>
      {/* Top-edge accent hairline */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${COLORS.accent}28 40%, ${COLORS.accent}18 60%, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* ── Brand ── */}
      <div
        onClick={() => navigate('/')}
        style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 32, cursor: 'pointer', flexShrink: 0 }}
      >
        <div className="rr-status-dot" style={{
          width: 7, height: 7, borderRadius: '50%',
          background: COLORS.accent, flexShrink: 0,
        }} />
        <span style={{
          fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          fontSize: 14, fontWeight: 700, color: COLORS.text,
          letterSpacing: '-0.02em', whiteSpace: 'nowrap',
        }}>
          Route Resilience
        </span>
        <span style={{
          fontSize: 9, fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: COLORS.accent,
          padding: '2px 6px', borderRadius: 3,
          background: COLORS.accentSubtle,
          border: `1px solid ${COLORS.accent}22`,
          marginLeft: -4,
        }}>
          ISRO
        </span>
      </div>

      {/* ── Page links ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="rr-navlink"
            style={({ isActive }) => ({
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? COLORS.accent : COLORS.textMuted,
              background: isActive ? `${COLORS.accent}18` : 'transparent',
              border: `1px solid ${isActive ? `${COLORS.accent}30` : 'transparent'}`,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              lineHeight: '22px',
              boxShadow: isActive ? `0 0 12px ${COLORS.accent}18` : 'none',
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* ── Dataset selector ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
        <span style={{
          fontSize: 10, color: COLORS.textCaption, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          Dataset
        </span>

        <div style={{ position: 'relative' }}>
          <select
            value={activeDataset?.id ?? ''}
            onChange={e => setActiveId(e.target.value)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              background: COLORS.panelElevated,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 7,
              color: COLORS.text,
              fontSize: 12,
              fontWeight: 500,
              padding: '5px 28px 5px 10px',
              cursor: 'pointer',
              maxWidth: 160,
              outline: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
            onFocus={e => {
              e.target.style.borderColor = COLORS.accent
              e.target.style.boxShadow = `0 0 0 2px ${COLORS.accent}22`
            }}
            onBlur={e => {
              e.target.style.borderColor = COLORS.border
              e.target.style.boxShadow = 'none'
            }}
          >
            {datasets.map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>
          {/* Custom chevron */}
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <path d="M2 3.5L5 6.5L8 3.5" stroke={COLORS.textCaption} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {activeDataset && (
          <button
            onClick={() => navigate('/gallery')}
            title="Open Gallery"
            className="rr-btn"
            style={{
              background: COLORS.panelElevated,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              color: COLORS.textMuted,
              cursor: 'pointer',
              padding: '5px 9px',
              fontSize: 12,
              lineHeight: 1,
            }}
          >
            ⊞
          </button>
        )}
      </div>
    </nav>
  )
}
