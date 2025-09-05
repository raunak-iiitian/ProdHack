import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import StorePage from './StoragePage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StorePage />
  </StrictMode>,
)
