import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LoginPage from './LoginPage'
import ProdHackHomePage from './ProdHackHomePage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProdHackHomePage/>
  </StrictMode>,
)
