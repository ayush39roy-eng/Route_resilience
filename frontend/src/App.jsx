// App.jsx — router, providers, layout shell
import { HashRouter, Routes, Route } from 'react-router-dom'
import { DatasetProvider } from './context/DatasetContext.jsx'
import NavBar      from './components/NavBar.jsx'
import Home        from './pages/Home.jsx'
import Gallery     from './pages/Gallery.jsx'
import Criticality from './pages/Criticality.jsx'
import Simulation  from './pages/Simulation.jsx'
import Layers      from './pages/Layers.jsx'
import Upload      from './pages/Upload.jsx'
import { COLORS }  from './colors.js'

export default function App() {
  return (
    <HashRouter>
      <DatasetProvider>
        <div style={{
          display: 'flex', flexDirection: 'column',
          height: '100vh', overflow: 'hidden',
          background: COLORS.background,
        }}>
          <NavBar />
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <Routes>
              <Route path="/"            element={<Home />}        />
              <Route path="/gallery"     element={<Gallery />}     />
              <Route path="/criticality" element={<Criticality />} />
              <Route path="/simulation"  element={<Simulation />}  />
              <Route path="/layers"      element={<Layers />}      />
              <Route path="/upload"      element={<Upload />}      />
            </Routes>
          </div>
        </div>
      </DatasetProvider>
    </HashRouter>
  )
}
