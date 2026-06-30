// api.js — all backend calls, parameterised by dataset id

const API = import.meta.env.VITE_API_URL || ''
const BASE = `${API}/api`

export async function fetchDatasets() {
  const r = await fetch(`${BASE}/datasets`)
  if (!r.ok) throw new Error(`/api/datasets failed: ${r.status}`)
  return r.json()
}

export async function fetchGraph(datasetId) {
  const r = await fetch(`${BASE}/datasets/${datasetId}/graph`)
  if (!r.ok) throw new Error(`graph fetch failed: ${r.status}`)
  return r.json()
}

export async function fetchCriticality(datasetId) {
  const r = await fetch(`${BASE}/datasets/${datasetId}/criticality`)
  if (!r.ok) throw new Error(`criticality fetch failed: ${r.status}`)
  return r.json()
}

export async function postAblate(datasetId, disabledIds) {
  const r = await fetch(`${BASE}/datasets/${datasetId}/ablate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ disabled_node_ids: disabledIds }),
  })
  if (!r.ok) throw new Error(`ablate failed: ${r.status}`)
  return r.json()
}

export async function fetchRoute(datasetId, start, end, disabledIds = []) {
  const disabled = disabledIds.join(',')
  const r = await fetch(
    `${BASE}/datasets/${datasetId}/route?start=${start}&end=${end}&disabled=${disabled}`
  )
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }))
    throw new Error(err.detail || 'Route not found')
  }
  return r.json()
}
