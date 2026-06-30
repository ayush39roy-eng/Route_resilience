// useGraphState.js — central state hook for graph data + interactions
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchGraph, fetchCriticality, postAblate, fetchRoute } from './api.js'

export function useGraphState() {
  const [graphData, setGraphData] = useState(null)       // { nodes, edges, stats }
  const [criticality, setCriticality] = useState(null)   // { centrality_norm, top_gatekeepers }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Interaction state
  const [disabledNodes, setDisabledNodes] = useState(new Set())
  const [hoveredNode, setHoveredNode] = useState(null)
  const [routeStart, setRouteStart] = useState(null)
  const [routeEnd, setRouteEnd] = useState(null)
  const [routeData, setRouteData] = useState(null)       // current path
  const [rerouteData, setRerouteData] = useState(null)   // path after ablation
  const [ablateResult, setAblateResult] = useState(null)

  // UI toggles
  const [showHealed, setShowHealed] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [routeMode, setRouteMode] = useState('none')     // 'none' | 'pickStart' | 'pickEnd'

  // Load on mount
  useEffect(() => {
    Promise.all([fetchGraph(), fetchCriticality()])
      .then(([g, c]) => {
        setGraphData(g)
        setCriticality(c)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  // Re-run ablation whenever disabled nodes change
  const ablateRef = useRef(null)
  useEffect(() => {
    if (!graphData) return
    const ids = [...disabledNodes]
    clearTimeout(ablateRef.current)
    ablateRef.current = setTimeout(() => {
      postAblate(ids).then(res => {
        setAblateResult(res)
        // Re-route if we have a path selected
        if (routeData && routeStart != null && routeEnd != null) {
          fetchRoute(routeStart, routeEnd, ids)
            .then(r => setRerouteData(r))
            .catch(() => setRerouteData(null))
        }
      }).catch(() => setAblateResult(null))
    }, 150)
  }, [disabledNodes, graphData])

  // Route when start+end set
  useEffect(() => {
    if (routeStart == null || routeEnd == null || routeStart === routeEnd) {
      setRouteData(null)
      setRerouteData(null)
      return
    }
    const ids = [...disabledNodes]
    fetchRoute(routeStart, routeEnd, ids)
      .then(r => {
        setRouteData(r)
        setRerouteData(null)
      })
      .catch(e => {
        setRouteData({ error: e.message })
        setRerouteData(null)
      })
  }, [routeStart, routeEnd])

  const toggleNode = useCallback((nodeId) => {
    setDisabledNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [])

  const handleNodeClick = useCallback((nodeId) => {
    if (routeMode === 'pickStart') {
      setRouteStart(nodeId)
      setRouteMode('pickEnd')
    } else if (routeMode === 'pickEnd') {
      setRouteEnd(nodeId)
      setRouteMode('none')
    } else {
      toggleNode(nodeId)
    }
  }, [routeMode, toggleNode])

  const reset = useCallback(() => {
    setDisabledNodes(new Set())
    setRouteStart(null)
    setRouteEnd(null)
    setRouteData(null)
    setRerouteData(null)
    setAblateResult(null)
    setRouteMode('none')
  }, [])

  const highlightGatekeeper = useCallback((nodeId) => {
    setHoveredNode(nodeId)
    setTimeout(() => setHoveredNode(n => n === nodeId ? null : n), 2000)
  }, [])

  return {
    graphData, criticality, loading, error,
    disabledNodes, hoveredNode, setHoveredNode,
    routeStart, routeEnd, routeData, rerouteData, ablateResult,
    showHealed, setShowHealed,
    showHeatmap, setShowHeatmap,
    routeMode, setRouteMode,
    handleNodeClick, reset, highlightGatekeeper,
    setRouteStart, setRouteEnd,
  }
}
