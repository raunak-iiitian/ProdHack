import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProdHackHomePage from "./ProdHackHomePage";
import OneOne from "./OneOne";
import StorePage from "./StoragePage";
import LoginPage from "./LoginPage";

export default function App() {
  return (
    
      <Routes>
        <Route path="/" element={<ProdHackHomePage />} />
        
        {/* This route is for the page where you create a room */}
        <Route path="/OneOne" element={<OneOne />} /> 
        
        {/* ✅ THIS IS THE CRITICAL ROUTE THAT MAKES THE BUTTON WORK */}
        {/* It tells the app to render the OneOne component for any battle room URL */}
        <Route path="/battle/:roomIdFromUrl" element={<OneOne />} />

        {/* Your other placeholder routes */}
        <Route path="/theme-store" element={<StorePage />} />
        <Route path="/leaderboard" element={<h1>Leaderboard Page</h1>} />
        <Route path="/about-us" element={<h1>About Us Page</h1>} />
        <Route path="/login" element={<LoginPage />} />

      </Routes>
    
  );
}

