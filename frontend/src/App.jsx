// App.jsx — router, providers, layout shell + Framer Motion page transitions
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { DatasetProvider } from './context/DatasetContext.jsx'
import NavBar      from './components/NavBar.jsx'
import Home        from './pages/Home.jsx'
import Gallery     from './pages/Gallery.jsx'
import Criticality from './pages/Criticality.jsx'
import Simulation  from './pages/Simulation.jsx'
import Testing     from './pages/Testing.jsx'
import Layers      from './pages/Layers.jsx'
import Upload      from './pages/Upload.jsx'
import { COLORS }  from './colors.js'

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
}

function PageWrap({ children, fullFlex }) {
  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        minHeight: 0,
        ...(fullFlex ? { flexDirection: 'column' } : {}),
      }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"            element={<PageWrap fullFlex><Home /></PageWrap>}        />
        <Route path="/gallery"     element={<PageWrap><Gallery /></PageWrap>}     />
        <Route path="/criticality" element={<PageWrap><Criticality /></PageWrap>} />
        <Route path="/simulation"  element={<PageWrap><Simulation /></PageWrap>}  />
        <Route path="/testing"     element={<PageWrap fullFlex><Testing /></PageWrap>}     />
        <Route path="/layers"      element={<PageWrap><Layers /></PageWrap>}      />
        <Route path="/upload"      element={<PageWrap><Upload /></PageWrap>}      />
      </Routes>
    </AnimatePresence>
  )
}

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
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            <AnimatedRoutes />
          </div>
        </div>
      </DatasetProvider>
    </HashRouter>
  )
}
