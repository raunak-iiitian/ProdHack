import React, { useState, useEffect } from "react";
import "./StoragePage.css";
import { ShoppingCart } from "lucide-react";

export default function StorePage() {
  const [coins, setCoins] = useState(500); // starting coins
  const [ownedItems, setOwnedItems] = useState([]);
  const [equippedItem, setEquippedItem] = useState(null);

  const items = [
    { id: 1, name: "Classic Clock", type: "Clock Style", price: 50 },
    { id: 2, name: "Minimal Clock", type: "Clock Style", price: 70 },
    { id: 3, name: "Digital Clock", type: "Clock Style", price: 100 },
    { id: 4, name: "Nature Background", type: "Background", price: 80 },
    { id: 5, name: "Galaxy Background", type: "Background", price: 120 },
    { id: 6, name: "5 Songs Playlist", type: "Playlist", price: 150 },
    { id: 7, name: "10 Songs Playlist", type: "Playlist", price: 250 },
  ];

  // 🔹 Load data from localStorage on first render
  useEffect(() => {
    const savedCoins = localStorage.getItem("coins");
    const savedOwned = localStorage.getItem("ownedItems");
    const savedEquipped = localStorage.getItem("equippedItem");

    if (savedCoins) setCoins(JSON.parse(savedCoins));
    if (savedOwned) setOwnedItems(JSON.parse(savedOwned));
    if (savedEquipped) setEquippedItem(JSON.parse(savedEquipped));
  }, []);

  // 🔹 Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("coins", JSON.stringify(coins));
  }, [coins]);

  useEffect(() => {
    localStorage.setItem("ownedItems", JSON.stringify(ownedItems));
  }, [ownedItems]);

  useEffect(() => {
    localStorage.setItem("equippedItem", JSON.stringify(equippedItem));
  }, [equippedItem]);

  // handle buying items
  function handleBuy(item) {
    if (ownedItems.includes(item.id)) {
      alert("You already own this!");
      return;
    }

    if (coins >= item.price) {
      setCoins(coins - item.price);
      setOwnedItems([...ownedItems, item.id]);
      alert(`You bought ${item.name}!`);
    } else {
      alert("Not enough coins 😢");
    }
  }

  // handle equipping items
  function handleEquip(item) {
    if (!ownedItems.includes(item.id)) {
      alert("You must buy this item first!");
      return;
    }
    setEquippedItem(item.id);
    alert(`You equipped ${item.name}!`);
  }

  return (
    <div
      className={`store-container ${equippedItem === 4 ? "nature-bg" : ""} ${
        equippedItem === 5 ? "galaxy-bg" : ""
      }`}
    >
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-logo">Pomodoro ⏱️</div>
        <ul className="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/store">Store</a></li>
          <li><a href="/profile">Profile</a></li>
        </ul>
        <div className="nav-coins">
          <span>{coins} 🪙</span>
        </div>
      </nav>

      {/* Store Section */}
      <h1 className="store-title">🛒 Pomodoro Store</h1>

      <div className="items-grid">
        {items.map((item) => (
          <div className="item-card" key={item.id}>
            <h2 className="item-name">{item.name}</h2>
            <p className="item-type">{item.type}</p>
            <p className="item-price">{item.price} 🪙</p>

            {!ownedItems.includes(item.id) ? (
              <button className="buy-button" onClick={() => handleBuy(item)}>
                <ShoppingCart size={18} /> Buy
              </button>
            ) : (
              <button
                className={`equip-button ${
                  equippedItem === item.id ? "equipped" : ""
                }`}
                onClick={() => handleEquip(item)}
              >
                {equippedItem === item.id ? "Equipped ✅" : "Equip"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>✨ Made with ❤️ for your productivity ✨</p>
      </footer>
    </div>
  );
}





