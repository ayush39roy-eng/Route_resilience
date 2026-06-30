// colors.js — mission-control glassmorphism palette + centrality gradient

/* ── Centrality heatmap: emerald → amber → rose ─────────────────────────── */
export function centralityColor(norm) {
  const stops = [
    [0.0,  [16,  185, 129]],   // emerald  #10B981
    [0.25, [52,  211, 153]],   // lt emerald
    [0.5,  [252, 211, 77 ]],   // warm yellow
    [0.75, [245, 158, 11 ]],   // amber    #F59E0B
    [1.0,  [220, 38,  38 ]],   // rose     #DC2626
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

/* ── UI color palette ───────────────────────────────────────────────────── */
export const COLORS = {
  // ── Backgrounds ───────────────────────────────────────────────────────────
  background:    '#0A0E14',   // canvas / app shell
  panel:         '#0F1520',   // sidebar / nav base
  panelElevated: '#141C2B',   // cards, list items
  panelRaised:   '#1A2237',   // tooltips, popovers

  // ── Borders ───────────────────────────────────────────────────────────────
  border:        '#1E293B',
  borderMid:     '#253347',
  borderStrong:  '#2E3F55',

  // ── Typography ────────────────────────────────────────────────────────────
  text:          '#E2EAF4',
  textMuted:     '#8A9BB0',
  textCaption:   '#4A5C6E',

  // ── Accent — blue ─────────────────────────────────────────────────────────
  accent:        '#3B82F6',
  accentSubtle:  '#162444',
  accentHover:   '#2563EB',

  // ── Semantic ──────────────────────────────────────────────────────────────
  success:       '#10B981',
  successSubtle: '#0C2018',
  warning:       '#F59E0B',
  warningSubtle: '#221808',
  danger:        '#EF4444',
  dangerSubtle:  '#261010',

  // ── Road network ──────────────────────────────────────────────────────────
  edge:          '#2E4D6E',   // road segments
  edgeCasing:    '#06090E',   // dark underpass casing
  healed:        '#22D3EE',   // gap-healed edges (cyan)
  path:          '#F59E0B',   // shortest path (amber)
  pathRerouted:  '#F97316',   // rerouted path (orange)

  // ── Nodes ─────────────────────────────────────────────────────────────────
  nodeDefault:   '#3B82F6',   // off-heatmap junctions
  nodeEndpoint:  '#10B981',   // leaf endpoints
  nodeDisabled:  '#1C2B3A',   // knocked-out nodes
  nodeHovered:   '#FCD34D',   // hover highlight
  disconnected:  '#111C28',   // unreachable after ablation
}
