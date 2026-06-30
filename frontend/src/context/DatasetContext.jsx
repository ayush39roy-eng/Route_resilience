// DatasetContext.jsx — global dataset list + active selection, persisted in localStorage
import { createContext, useContext, useEffect, useState } from 'react'
import { fetchDatasets } from '../api.js'

const DatasetContext = createContext(null)

export function DatasetProvider({ children }) {
  const [datasets, setDatasets]       = useState([])
  const [activeId, setActiveIdState]  = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  // Load dataset list once on mount
  useEffect(() => {
    fetchDatasets()
      .then(ds => {
        setDatasets(ds)
        const saved = localStorage.getItem('rr_active_dataset')
        const valid = ds.find(d => d.id === saved)?.id ?? ds[0]?.id ?? null
        setActiveIdState(valid)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  function setActiveId(id) {
    setActiveIdState(id)
    localStorage.setItem('rr_active_dataset', id)
  }

  const activeDataset = datasets.find(d => d.id === activeId) ?? null

  return (
    <DatasetContext.Provider value={{ datasets, activeDataset, activeId, setActiveId, loading, error }}>
      {children}
    </DatasetContext.Provider>
  )
}

export function useDataset() {
  return useContext(DatasetContext)
}
