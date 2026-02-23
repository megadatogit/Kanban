import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import './index.css'
import Kanban from './Kanban.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Kanban />
  </StrictMode>,
)
