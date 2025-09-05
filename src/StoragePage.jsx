import React from "react";
import React, {useState} from "react";
import "./StoragePage.css";
import { ShoppingCart } from "lucide-react";

export default function StorePage() {

  const [coins, setCoins] = useState(500);

  const [ownedItems, setOwnedItems] = useState([]);

  const [equippedBackground, setEquippedBackground] = useState(null);
  const items = [
    { id: 1, name: "Classic Clock", type: "Clock Style", price: 50 },
    { id: 2, name: "Minimal Clock", type: "Clock Style", price: 70 },
    { id: 3, name: "Digital Clock", type: "Clock Style", price: 100 },
    { id: 4, name: "Nature Background", type: "Background", price: 80 },
    { id: 5, name: "Galaxy Background", type: "Background", price: 120 },
    { id: 6, name: "5 Songs Playlist", type: "Playlist", price: 150 },
    { id: 7, name: "10 Songs Playlist", type: "Playlist", price: 250 },
  ];

  return (
    <div className="store-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-logo">Pomodoro Store</div>
        <ul className="nav-links">
          <li>Home</li>
          <li>Store</li>
          <li>Profile</li>
          <li>Settings</li>
        </ul>
        <div className="nav-coins">🪙 500</div>
      </nav>

      {/* Store Title */}
      <h1 className="store-title">🛒 Unlock Your Pomodoro Upgrades</h1>

      {/* Store Items */}
      <div className="items-grid">
        {items.map((item) => (
          <div className="item-card" key={item.id}>
            <h2 className="item-name">{item.name}</h2>
            <p className="item-type">{item.type}</p>
            <p className="item-price">{item.price} 🪙</p>
            <button className="buy-button">
              <ShoppingCart size={18} /> Buy
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>
          🎉 Keep grinding your pomodoros & earn coins to unlock fun upgrades!  
          <span> Stay productive, stay happy 🚀</span>
        </p>
      </footer>
    </div>
  );
}

