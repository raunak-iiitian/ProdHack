import { useState, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Music } from "lucide-react";
import "./MusicP.css";

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const audioRef = useRef(null);

  const playlist = [
    "/music/song1.mp3",
    "/music/song2.mp3",
    "/music/song3.mp3"
  ];

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    const newIndex = (trackIndex + 1) % playlist.length;
    setTrackIndex(newIndex);
    audioRef.current.src = playlist[newIndex];
    audioRef.current.play();
    setIsPlaying(true);
  };

  const prevTrack = () => {
    const newIndex = (trackIndex - 1 + playlist.length) % playlist.length;
    setTrackIndex(newIndex);
    audioRef.current.src = playlist[newIndex];
    audioRef.current.play();
    setIsPlaying(true);
  };

  return (
    <div className="music-player">
      <div className="music-icon">
        <Music size={22} />
      </div>
      <div className="player-controls">
        <button onClick={prevTrack}><SkipBack size={18} /></button>
        <button onClick={togglePlay}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button onClick={nextTrack}><SkipForward size={18} /></button>
      </div>
      <audio ref={audioRef} src={playlist[trackIndex]} preload="auto" />
    </div>
  );
}
