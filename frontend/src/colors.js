// colors.js — deep-space amber/blue palette for Route Resilience

/* ── Centrality heatmap: teal → amber → red ─────────────────────────────── */
export function centralityColor(norm) {
  const stops = [
    [0.0,  [56,  189, 248]],   // sky-blue  #38BDF8 (cool = low risk)
    [0.25, [99,  210, 200]],   // teal
    [0.5,  [252, 211, 77 ]],   // warm yellow
    [0.75, [255, 122, 26 ]],   // amber     #FF7A1A
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

/* ── UI color palette — deep-space amber ────────────────────────────────── */
export const COLORS = {
  // ── Backgrounds — warm dark space ─────────────────────────────────────────
  background:    '#0A0A0F',   // near-black with warm undertone
  panel:         '#0E0C09',   // sidebar / nav base
  panelElevated: '#161108',   // cards, list items
  panelRaised:   '#1E1810',   // tooltips, popovers

  // ── Borders — warm dark ───────────────────────────────────────────────────
  border:        '#2A2018',
  borderMid:     '#3A2E1E',
  borderStrong:  '#4A3C28',

  // ── Typography — warm white ───────────────────────────────────────────────
  text:          '#F5F1EA',   // warm white
  textMuted:     '#9A8F82',   // warm gray
  textCaption:   '#5A5048',

  // ── PRIMARY ACCENT — amber / orange ───────────────────────────────────────
  accent:        '#FF7A1A',
  accentSubtle:  '#2A1608',
  accentHover:   '#FF9A40',

  // ── SECONDARY ACCENT — sky blue ───────────────────────────────────────────
  secondary:     '#3B9EFF',
  secondarySubtle: '#081828',

  // ── Semantic ──────────────────────────────────────────────────────────────
  success:       '#22C55E',
  successSubtle: '#081808',
  warning:       '#F59E0B',
  warningSubtle: '#1E1408',
  danger:        '#EF4444',
  dangerSubtle:  '#1E0808',

  // ── Road network ──────────────────────────────────────────────────────────
  edge:          '#3A2A16',   // warm dark road segments
  edgeCasing:    '#060408',
  healed:        '#38BDF8',   // healed edges (sky blue)
  path:          '#FF7A1A',   // shortest path (amber)
  pathRerouted:  '#F97316',   // rerouted path (orange)

  // ── Nodes ─────────────────────────────────────────────────────────────────
  nodeDefault:   '#FF7A1A',   // amber junctions
  nodeEndpoint:  '#22C55E',   // leaf endpoints (green)
  nodeDisabled:  '#1A1208',   // knocked-out
  nodeHovered:   '#FCD34D',   // hover highlight
  disconnected:  '#120E08',   // unreachable after ablation
}
