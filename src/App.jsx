import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { LangProvider, LangToggle } from './lib/i18n'
import SimulationPage from './pages/SimulationPage'
import StartPage from './pages/StartPage'
import './App.css'

// BASE_URL comes from vite.config.js (VITE_BASE_PATH), so the router
// works under a sub-path such as https://<user>.github.io/<repo>/.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

function App() {
  return (
    <LangProvider>
      <AppProvider>
        <Router basename={basename}>
          <Routes>
            <Route path="/" element={<StartPage />} />
            <Route path="/simulation/:projectId" element={<SimulationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <LangToggle />
      </AppProvider>
    </LangProvider>
  )
}

export default App
