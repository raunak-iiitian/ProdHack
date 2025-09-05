import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from './App'; // Import the main App component


const root = createRoot(document.getElementById('root'));

// This should be the ONLY render call in this file
root.render(
  <StrictMode>
     <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
