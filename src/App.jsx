import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProdHackHomePage from "./ProdHackHomePage";
import OneOne from "./OneOne";

export default function App() {
  return (
   
      <Routes>
        <Route path="/" element={<ProdHackHomePage />} />
        
        {/* Route for the initial page where you can create a room */}
        <Route path="/OneOne" element={<OneOne />} /> 
        
        {/* ✅ CRITICAL: This route handles joining/playing in a created room */}
        <Route path="/battle/:roomIdFromUrl" element={<OneOne />} />

        {/* Placeholder routes */}
        <Route path="/theme-store" element={<h1>Theme Store Page</h1>} />
        <Route path="/leaderboard" element={<h1>Leaderboard Page</h1>} />
        <Route path="/about-us" element={<h1>About Us Page</h1>} />
      </Routes>
   
  );
}