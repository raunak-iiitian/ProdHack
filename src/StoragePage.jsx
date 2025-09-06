import React, { useState } from 'react';
import './StoragePage.css';

const storeItems = [
  { id: 'classic-clock', name: 'Classic Clock', type: 'Clock Style', price: 150, image: '🕰️' },
  { id: 'digital-clock', name: 'Digital Clock', type: 'Clock Style', price: 200, image: '📟' },
  { id: 'nature-bg', name: 'Nature Theme', type: 'Theme', price: 300, image: '🏞️' },
  { id: 'galaxy-bg', name: 'Galaxy Theme', type: 'Theme', price: 350, image: '🌌' },
  { id: 'lofi-beats', name: 'Lofi Beats Pack', type: 'Playlist', price: 100, image: '🎧' },
  { id: 'ambient-sound', name: 'Ambient Sounds', type: 'Playlist', price: 100, image: '🎶' },
];

function StorePage() {
  const [coins, setCoins] = useState(1000);
  const [purchasedItems, setPurchasedItems] = useState(new Set(['classic-clock']));
  const [equippedItems, setEquippedItems] = useState({
    'Clock Style': 'classic-clock',
    'Theme': '',
    'Playlist': '',
  });
  const [songs, setSongs] = useState([]);
  const [maxSongs, setMaxSongs] = useState(0);
  const [newSongUrl, setNewSongUrl] = useState('');

  const handlePurchase = (item) => {
    if (coins >= item.price) {
      setCoins(coins - item.price);
      setPurchasedItems(prev => new Set(prev).add(item.id));

      if (item.type === 'Playlist') setMaxSongs(prev => prev + 5);

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
      if (songs.length >= maxSongs) {
        alert(`You have reached your playlist limit of ${maxSongs} songs. Buy more packs to add more!`);
        return;
      }

      // Extract Spotify track ID
      let trackId = null;
      if (newSongUrl.includes("open.spotify.com/track/")) {
        const parts = newSongUrl.split("track/");
        trackId = parts[1].split("?")[0];
      }

      if (trackId) {
        const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
        setSongs([...songs, embedUrl]);
        setNewSongUrl('');
      } else {
        alert('Please enter a valid Spotify track URL.');
      }
    }
  };

  // Dynamic background based on equipped theme
  const getThemeBackground = () => {
    if (equippedItems['Theme'] === 'nature-bg') return 'linear-gradient(to bottom, #0b3d0b, #2e7d32, #a5d6a7)'; // Amazon forest green
    if (equippedItems['Theme'] === 'galaxy-bg') return 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)'; // Galaxy
    return 'linear-gradient(120deg, #e0c3fc, #fbc2eb, #fffacd, #a6c1ee)'; // Default
  };

  return (
    <>
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

      <div className="store-container" style={{ background: getThemeBackground(), transition: 'all 0.5s ease' }}>
        <h1 className="store-title">Welcome to the Store</h1>

        <div className="items-grid">
          {storeItems.map((item) => {
            const isPurchased = purchasedItems.has(item.id);
            const isEquipped = equippedItems[item.type] === item.id;

            return (
              <div
                key={item.id}
                className={`item-card glass-card ${isEquipped ? 'equipped-card' : ''}`}
              >
                {isPurchased && item.type === 'Playlist' && (
                  <div className="purchased-badge">Purchased</div>
                )}
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

        <div className="playlist-section glass-card">
          <h2 className="store-title" style={{ fontSize: '28px', margin: '0 0 20px 0' }}>Your Playlist</h2>
          
          <div className="spotify-input-container">
            <input
              type="text"
              placeholder="Paste a Spotify track URL here..."
              value={newSongUrl}
              onChange={(e) => setNewSongUrl(e.target.value)}
            />
            <button className="btn add-song-btn" onClick={handleAddSong}>Add Song</button>
          </div>

          <div className="playlist-count-bar">
            <div
              className="playlist-count-progress"
              style={{ width: `${(songs.length / (maxSongs || 1)) * 100}%` }}
            ></div>
          </div>
          <p>Playlist: {songs.length} / {maxSongs} songs</p>

          <ul className="song-list">
            {songs.length > 0 ? (
              songs.map((songUrl, index) => (
                <li key={index}>
                  <iframe
                    src={songUrl}
                    title={`song-${index}`}
                    frameBorder="0"
                    allow="encrypted-media"
                    allowTransparency="true"
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

