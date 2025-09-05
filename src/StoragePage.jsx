import React, { useState } from 'react';
import './StoragePage.css'; // Make sure this CSS file is in the same folder

// --- Mock Data for the Store ---
// In a real app, you would fetch this from a server.
const storeItems = [
  { id: 'classic-clock', name: 'Classic Clock', type: 'Clock Style', price: 150, image: '🕰️' },
  { id: 'digital-clock', name: 'Digital Clock', type: 'Clock Style', price: 200, image: '📟' },
  { id: 'nature-bg', name: 'Nature Theme', type: 'Theme', price: 300, image: '🏞️' },
  { id: 'galaxy-bg', name: 'Galaxy Theme', type: 'Theme', price: 350, image: '🌌' },
  { id: 'lofi-beats', name: 'Lofi Beats Pack', type: 'Playlist', price: 100, image: '🎧' },
  { id: 'ambient-sound', name: 'Ambient Sounds', type: 'Playlist', price: 100, image: '🎶' },
];


function StorePage() {
  // --- State Management ---
  const [coins, setCoins] = useState(1000);
  const [purchasedItems, setPurchasedItems] = useState(new Set(['classic-clock'])); // User owns 'classic-clock' by default
  const [equippedItems, setEquippedItems] = useState({
    'Clock Style': 'classic-clock',
    'Theme': '',
    'Playlist': '',
  });
  const [songs, setSongs] = useState([]);
  const [newSongUrl, setNewSongUrl] = useState('');

  // --- Event Handlers ---
  const handlePurchase = (item) => {
    if (coins >= item.price) {
      setCoins(coins - item.price);
      setPurchasedItems(new Set(purchasedItems).add(item.id));
      alert(`You have successfully purchased ${item.name}!`);
    } else {
      alert("You don't have enough coins!");
    }
  };

  const handleEquip = (item) => {
    setEquippedItems({
      ...equippedItems,
      [item.type]: item.id,
    });
  };

  const handleAddSong = () => {
    if (newSongUrl.trim() !== '') {
      // Basic validation for YouTube links to get embeddable URL
      const videoId = newSongUrl.split('v=')[1];
      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId.split('&')[0]}`;
        setSongs([...songs, embedUrl]);
        setNewSongUrl('');
      } else {
        alert('Please enter a valid YouTube video URL.');
      }
    }
  };


  return (
    <>
      {/* ---- Navbar ---- */}
      <nav className="navbar glass-card">
        <div className="nav-logo">ProdHack</div>
        <ul className="nav-links">
          <li><a href="#">Timer</a></li>
          <li><a href="#">Store</a></li>
          <li><a href="#">Profile</a></li>
        </ul>
        <div className="nav-coins">
          <span>💎</span> {coins}
        </div>
      </nav>

      {/* ---- Main Store Container ---- */}
      <div className="store-container">
        <h1 className="store-title">Welcome to the Store</h1>

        {/* ---- Items Grid ---- */}
        <div className="items-grid">
          {storeItems.map((item) => {
            const isPurchased = purchasedItems.has(item.id);
            const isEquipped = equippedItems[item.type] === item.id;

            return (
              <div key={item.id} className="item-card glass-card">
                <div style={{ fontSize: '4rem', margin: '10px 0' }}>{item.image}</div>
                <h3 className="item-name">{item.name}</h3>
                <p className="item-type">{item.type}</p>
                
                {isPurchased ? (
                  <button
                    onClick={() => handleEquip(item)}
                    className={`btn equip-button ${isEquipped ? 'equipped' : ''}`}
                  >
                    {isEquipped ? 'Equipped' : 'Equip'}
                  </button>
                ) : (
                  <button onClick={() => handlePurchase(item)} className="btn buy-button">
                    Buy for {item.price} 💎
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ---- Playlist Section ---- */}
        <div className="playlist-section glass-card">
          <h2 className="store-title" style={{ fontSize: '28px', margin: '0 0 20px 0' }}>Your Playlist</h2>
          <div>
            <input
              type="text"
              placeholder="Paste a YouTube video URL here..."
              value={newSongUrl}
              onChange={(e) => setNewSongUrl(e.target.value)}
            />
            <button className="btn add-song-btn" onClick={handleAddSong}>Add Song</button>
          </div>
          <ul className="song-list">
            {songs.length > 0 ? (
              songs.map((songUrl, index) => (
                <li key={index}>
                  <iframe
                    src={songUrl}
                    title={`song-${index}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </li>
              ))
            ) : (
              <p>Your playlist is empty. Add some songs!</p>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

export default StorePage;