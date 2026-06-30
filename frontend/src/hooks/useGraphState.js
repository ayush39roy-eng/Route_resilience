// useGraphState.js — graph data + all interactions, keyed by datasetId
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchGraph, fetchCriticality, postAblate, fetchRoute } from '../api.js'

export function useGraphState(datasetId) {
  const [graphData,    setGraphData]    = useState(null)
  const [criticality,  setCriticality]  = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  // Interaction state
  const [disabledNodes, setDisabledNodes] = useState(new Set())
  const [hoveredNode,   setHoveredNode]   = useState(null)
  const [routeStart,    setRouteStart]    = useState(null)
  const [routeEnd,      setRouteEnd]      = useState(null)
  const [routeData,     setRouteData]     = useState(null)
  const [rerouteData,   setRerouteData]   = useState(null)
  const [ablateResult,  setAblateResult]  = useState(null)
  const [routeMode,     setRouteMode]     = useState('none')

  // Load graph + criticality whenever datasetId changes
  useEffect(() => {
    if (!datasetId) return
    setLoading(true)
    setError(null)
    setGraphData(null)
    setCriticality(null)
    setDisabledNodes(new Set())
    setHoveredNode(null)
    setRouteStart(null)
    setRouteEnd(null)
    setRouteData(null)
    setRerouteData(null)
    setAblateResult(null)
    setRouteMode('none')

    Promise.all([fetchGraph(datasetId), fetchCriticality(datasetId)])
      .then(([g, c]) => { setGraphData(g); setCriticality(c); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [datasetId])

  // Refs so the ablation effect always reads current route state (avoids stale closure)
  const routeDataRef  = useRef(routeData)
  const routeStartRef = useRef(routeStart)
  const routeEndRef   = useRef(routeEnd)
  useEffect(() => { routeDataRef.current  = routeData  }, [routeData])
  useEffect(() => { routeStartRef.current = routeStart }, [routeStart])
  useEffect(() => { routeEndRef.current   = routeEnd   }, [routeEnd])

  // Re-run ablation when disabled set changes
  const ablateRef = useRef(null)
  useEffect(() => {
    if (!graphData || !datasetId) return
    const ids = [...disabledNodes]
    clearTimeout(ablateRef.current)
    ablateRef.current = setTimeout(() => {
      postAblate(datasetId, ids).then(res => {
        setAblateResult(res)
        const rd = routeDataRef.current
        const rs = routeStartRef.current
        const re = routeEndRef.current
        if (rd && rs != null && re != null) {
          fetchRoute(datasetId, rs, re, ids)
            .then(r => setRerouteData(r))
            .catch(() => setRerouteData(null))
        }
      }).catch(() => setAblateResult(null))
    }, 150)
  }, [disabledNodes, graphData, datasetId])

  // Route computation when start+end change
  useEffect(() => {
    if (!datasetId || routeStart == null || routeEnd == null || routeStart === routeEnd) {
      setRouteData(null)
      setRerouteData(null)
      return
    }
    const ids = [...disabledNodes]
    fetchRoute(datasetId, routeStart, routeEnd, ids)
      .then(r => { setRouteData(r); setRerouteData(null) })
      .catch(e => { setRouteData({ error: e.message }); setRerouteData(null) })
  }, [routeStart, routeEnd, datasetId])

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
      setRouteStart(nodeId); setRouteMode('pickEnd')
    } else if (routeMode === 'pickEnd') {
      setRouteEnd(nodeId); setRouteMode('none')
    } else {
      toggleNode(nodeId)
    }
  }, [routeMode, toggleNode])

  const addDisabledNodes = useCallback((ids) => {
    setDisabledNodes(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setDisabledNodes(new Set())
    setRouteStart(null); setRouteEnd(null)
    setRouteData(null);  setRerouteData(null)
    setAblateResult(null); setRouteMode('none')
  }, [])

  const highlightGatekeeper = useCallback((nodeId) => {
    setHoveredNode(nodeId)
    setTimeout(() => setHoveredNode(n => n === nodeId ? null : n), 2000)
  }, [])

  return {
    graphData, criticality, loading, error,
    disabledNodes, hoveredNode, setHoveredNode,
    routeStart, routeEnd, routeData, rerouteData, ablateResult,
    routeMode, setRouteMode,
    handleNodeClick, addDisabledNodes, reset, highlightGatekeeper,
    setRouteStart, setRouteEnd,
  }
}
