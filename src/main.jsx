
import LoginPage from './LoginPage'
import ProdHackHomePage from './ProdHackHomePage'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Import the main App component
const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <App /> {/* Render ONLY the App component here */}
  </StrictMode>
);