import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import SimulationPage from './pages/SimulationPage'
import './App.css'

// BASE_URL comes from vite.config.js (VITE_BASE_PATH), so the router
// works under a sub-path such as https://<user>.github.io/<repo>/.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

function App() {
  return (
    <AppProvider>
      <Router basename={basename}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/simulation/:projectId" element={<SimulationPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  )
}

export default App
