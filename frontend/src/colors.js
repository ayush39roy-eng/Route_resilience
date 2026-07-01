// colors.js — deep-space amber + sky-blue palette

/* ── Centrality heatmap: sky-blue → amber → red ─────────────────────────── */
export function centralityColor(norm) {
  const stops = [
    [0.0,  [56,  189, 248]],   // sky blue  #38BDF8
    [0.3,  [99,  210, 200]],   // teal
    [0.55, [252, 211, 77 ]],   // warm yellow
    [0.75, [232, 133, 26 ]],   // amber     #E8851A
    [1.0,  [220, 38,  38 ]],   // red       #DC2626
  ]
  let lo = stops[0], hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (norm >= stops[i][0] && norm <= stops[i + 1][0]) {
      lo = stops[i]; hi = stops[i + 1]; break
    }
  }
  const t = (hi[0] - lo[0]) === 0 ? 0 : (norm - lo[0]) / (hi[0] - lo[0])
  const r = Math.round(lo[1][0] + t * (hi[1][0] - lo[1][0]))
  const g = Math.round(lo[1][1] + t * (hi[1][1] - lo[1][1]))
  const b = Math.round(lo[1][2] + t * (hi[1][2] - lo[1][2]))
  return `rgb(${r},${g},${b})`
}

export function centralityColorHex(norm) {
  const c = centralityColor(norm)
  const m = c.match(/\d+/g)
  return '#' + m.map(x => parseInt(x).toString(16).padStart(2, '0')).join('')
}

/* ── UI palette ─────────────────────────────────────────────────────────── */
export const COLORS = {
  // ── Backgrounds — warm near-black ──────────────────────────────────────────
  background:    '#09090E',
  panel:         '#0D0B08',
  panelElevated: '#141008',
  panelRaised:   '#1C1610',

  // ── Borders ────────────────────────────────────────────────────────────────
  border:        '#281E14',
  borderMid:     '#382A1C',
  borderStrong:  '#483C28',

  // ── Typography ─────────────────────────────────────────────────────────────
  text:          '#F0EDE6',   // warm white
  textMuted:     '#948880',   // warm gray
  textCaption:   '#564E46',

  // ── PRIMARY — amber (toned down, less eye-searing) ─────────────────────────
  accent:        '#D97B1A',   // muted amber
  accentBright:  '#F59332',   // brighter amber for glows only
  accentSubtle:  '#1E1208',
  accentHover:   '#E8901A',

  // ── SECONDARY — sky blue (much more present now) ───────────────────────────
  secondary:     '#3B9EFF',
  secondaryBright:'#60B8FF',
  secondarySubtle:'#081628',
  secondaryHover: '#5AACFF',

  // ── TERTIARY — cyan / teal (healed edges, accent counterpoint) ────────────
  cyan:          '#38BDF8',
  cyanSubtle:    '#071422',

  // ── Semantic ───────────────────────────────────────────────────────────────
  success:       '#22C55E',
  successSubtle: '#081808',
  warning:       '#F59E0B',
  warningSubtle: '#1A1208',
  danger:        '#EF4444',
  dangerSubtle:  '#1E0808',

  // ── Road network ───────────────────────────────────────────────────────────
  edge:          '#2A2016',   // warm dark road
  edgeCasing:    '#060408',
  healed:        '#38BDF8',   // healed = cyan
  path:          '#D97B1A',   // path = amber
  pathRerouted:  '#F97316',   // rerouted = orange

  // ── Nodes ──────────────────────────────────────────────────────────────────
  nodeDefault:   '#D97B1A',   // amber
  nodeEndpoint:  '#22C55E',
  nodeDisabled:  '#18120A',
  nodeHovered:   '#FCD34D',
  disconnected:  '#100E08',
}
