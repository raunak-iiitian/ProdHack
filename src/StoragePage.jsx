import React, {useState, useEffect} from "react";
import "./StoragePage.css";
import {ShoppingCart} from "lucide-react";

export default function StorePage() {
  const [coins, setCoins] = useState(500);
  const [ownedItems, setOwnedItems] = useState([]);
  const [equippedItem, setEquippedItem] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState(0); // slots available
  const [songs, setSongs] = useState([]); // added songs
  const [newSong, setNewSong] = useState(""); // input for new song

  const items = [
    {id: 1, name: "Classic Clock", type: "Clock Style", price: 50},
    {id: 2, name: "Minimal Clock", type: "Clock Style", price: 70},
    {id: 3, name: "Digital Clock", type: "Clock Style", price: 100},
    {id: 4, name: "Nature Background", type: "Background", price: 80},
    {id: 5, name: "Galaxy Background", type: "Background", price: 120},
    {id: 6, name: "5 Songs Playlist", type: "Playlist", price: 150},
    {id: 7, name: "10 Songs Playlist", type: "Playlist", price: 250},
  ];

  // Load from localStorage
  useEffect(() => {
    const savedCoins = localStorage.getItem("coins");
    const savedItems = localStorage.getItem("ownedItems");
    const savedEquipped = localStorage.getItem("equippedItem");
    const savedSongs = localStorage.getItem("songs");
    const savedSlots = localStorage.getItem("playlistSongs");

    if (savedCoins) setCoins(parseInt(savedCoins, 10));
    if (savedItems) setOwnedItems(JSON.parse(savedItems));
    if (savedEquipped) setEquippedItem(parseInt(savedEquipped, 10));
    if (savedSlots) setPlaylistSongs(parseInt(savedSlots, 10));
    if (savedSongs) setSongs(JSON.parse(savedSongs));
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("coins", coins);
    localStorage.setItem("ownedItems", JSON.stringify(ownedItems));
    if (equippedItem !== null) {
      localStorage.setItem("equippedItem", equippedItem);
    }
    localStorage.setItem("playlistSongs", playlistSongs);
    localStorage.setItem("songs", JSON.stringify(songs));
  }, [coins, ownedItems, equippedItem, playlistSongs, songs]);

  // handle buying items
  function handleBuy(item) {
    if (ownedItems.includes(item.id)) {
      alert("You already own this!");
      return;
    }

    if (coins >= item.price) {
      setCoins(coins - item.price);
      setOwnedItems([...ownedItems, item.id]);

      if (item.type === "Playlist") {
        if (item.id === 6) {
          setPlaylistSongs(playlistSongs + 5);
        } else if (item.id === 7) {
          setPlaylistSongs(playlistSongs + 10);
        }
      }

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

  function handleAddSong() {
    if (!newSong.includes("spotify.com/track")) {
      alert("Please enter a valid Spotify track link!");
      return;
    }
    if (songs.length >= playlistSongs) {
      alert("You don’t have free slots left!");
      return;
    }
    setSongs([...songs, newSong]);
    setNewSong("");
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
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/store">Store</a>
          </li>
          <li>
            <a href="/profile">Profile</a>
          </li>
        </ul>
        <div className="nav-coins">
          <span>{coins} 🪙</span>
          <span>
            {songs.length}/{playlistSongs} 🎵
          </span>
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
                disabled={item.type === "Playlist"}
              >
                {item.type === "Playlist"
                  ? "Owned ✅"
                  : equippedItem === item.id
                  ? "Equipped ✅"
                  : "Equip"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Playlist Manager */}
      {/* Playlist Manager */}
      <div className="playlist-section">
        <h2>Your Playlist 🎶</h2>
        <input
          type="text"
          placeholder="Enter Spotify track link"
          value={newSong}
          onChange={(e) => setNewSong(e.target.value)}
        />
        <button className="add-song-btn" onClick={handleAddSong}>
          Add Song
        </button>

        <ul className="song-list">
          {songs.map((song, idx) => (
            <li key={idx}>
              <p>Song {idx + 1}</p>
              <iframe
                src={song.replace(
                  "open.spotify.com/track",
                  "open.spotify.com/embed/track"
                )}
                width="100%"
                height="80"
                frameBorder="0"
                allow="encrypted-media"
                title={`Spotify Track ${idx + 1}`}
              ></iframe>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>✨ Made with ❤️ for your productivity ✨</p>
      </footer>
    </div>
  );
}
