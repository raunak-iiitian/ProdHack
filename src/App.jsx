import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProdHackHomePage from "./ProdHackHomePage";
import OneOne from "./OneOne"; // Fixed: Import the OneOne component

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProdHackHomePage />} />

        {/* Fixed: Path is now "/OneOne" and it renders the correct component */}
        <Route path="/OneOne" element={<OneOne />} />

        {/* Placeholders for your other routes */}
        <Route path="/theme-store" element={<h1>Theme Store Page</h1>} />
        <Route path="/leaderboard" element={<h1>Leaderboard Page</h1>} />
        <Route path="/about-us" element={<h1>About Us Page</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

