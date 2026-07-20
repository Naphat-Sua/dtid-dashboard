import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './leafletSetup'   // set window.L before any lazy leaflet.heat chunk evaluates
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
