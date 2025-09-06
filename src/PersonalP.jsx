import React, { useState, useEffect, useCallback, useMemo } from 'react';

// You might need to add this script tag to your main index.html to use Tone.js for sound
// <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js"></script>

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);
const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </svg>
);
const ResetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        <path d="M21 3v6h-6"></path>
    </svg>
);
const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const SettingsModal = ({ settings, onSave, onClose }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({...prev, [name]: parseInt(value, 10) || 0 }));
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="modal-title">Settings</h2>
                <div className="settings-form">
                    <div className="form-group">
                        <label htmlFor="pomodoro">Pomodoro (minutes)</label>
                        <input type="number" id="pomodoro" name="pomodoro" value={localSettings.pomodoro} onChange={handleInputChange} min="1" />
                    </div>
                     <div className="form-group">
                        <label htmlFor="shortBreak">Short Break (minutes)</label>
                        <input type="number" id="shortBreak" name="shortBreak" value={localSettings.shortBreak} onChange={handleInputChange} min="1" />
                    </div>
                     <div className="form-group">
                        <label htmlFor="longBreak">Long Break (minutes)</label>
                        <input type="number" id="longBreak" name="longBreak" value={localSettings.longBreak} onChange={handleInputChange} min="1" />
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};


export default function PomodoroTimer() {
    const [settings, setSettings] = useState({ pomodoro: 25, shortBreak: 5, longBreak: 15 });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [mode, setMode] = useState('pomodoro');
    const [isActive, setIsActive] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(settings.pomodoro * 60);
    const [pomodorosCompleted, setPomodorosCompleted] = useState(0);

    const timeForMode = useMemo(() => {
        switch (mode) {
            case 'pomodoro': return settings.pomodoro * 60;
            case 'shortBreak': return settings.shortBreak * 60;
            case 'longBreak': return settings.longBreak * 60;
            default: return settings.pomodoro * 60;
        }
    }, [mode, settings]);
    
    const playSound = useCallback(() => {
        if (window.Tone) {
            const synth = new window.Tone.Synth().toDestination();
            synth.triggerAttackRelease("C5", "8n", window.Tone.now());
            setTimeout(() => synth.triggerAttackRelease("G5", "8n", window.Tone.now() + 0.2), 100);
        }
    }, []);

    useEffect(() => {
        if (secondsLeft <= 0) {
            playSound();
            setIsActive(false);

            if (mode === 'pomodoro') {
                const newCompleted = pomodorosCompleted + 1;
                setPomodorosCompleted(newCompleted);
                if (newCompleted > 0 && newCompleted % 4 === 0) {
                    setMode('longBreak');
                } else {
                    setMode('shortBreak');
                }
            } else {
                setMode('pomodoro');
            }
        }
    }, [secondsLeft, mode, pomodorosCompleted, playSound]);

    useEffect(() => {
        if (!isActive) {
            setSecondsLeft(timeForMode);
        }
    }, [mode, timeForMode, isActive]);

    useEffect(() => {
        let interval = null;
        if (isActive && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, secondsLeft]);

    const handleSaveSettings = (newSettings) => {
        setSettings(newSettings);
        // If the current mode's time changed, update the timer (if not active)
        if (!isActive) {
            switch (mode) {
                case 'pomodoro': setSecondsLeft(newSettings.pomodoro * 60); break;
                case 'shortBreak': setSecondsLeft(newSettings.shortBreak * 60); break;
                case 'longBreak': setSecondsLeft(newSettings.longBreak * 60); break;
                default: break;
            }
        }
    };

    const toggleTimer = () => {
        if(window.Tone && window.Tone.context.state !== 'running') {
            window.Tone.start();
        }
        setIsActive(!isActive);
    };
    
    const resetTimer = useCallback(() => {
        setIsActive(false);
        setSecondsLeft(timeForMode);
    }, [timeForMode]);

    const switchMode = useCallback((newMode) => {
        setIsActive(false);
        setMode(newMode);
    }, []);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const totalSeconds = timeForMode;
    const progress = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
    const circumference = 2 * Math.PI * 140;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <>
            <style>{`
                /* ... (previous styles) ... */
                @import url('https://fonts.googleapis.com/css2?family=Fredericka+the+Great&family=Inter:wght@400;600;700&display=swap');
                
                .pomodoro-container {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(145deg, #f2e2ff, #e2eeff, #ddfffc);
                    background-size: 400% 400%;
                    animation: gradientMove 15s ease infinite;
                    color: #1a0d2e; font-family: 'Inter', sans-serif; padding: 2rem; box-sizing: border-box;
                }
                @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                
                .pomodoro-card {
                    background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.6); border-radius: 2rem;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); padding: 2.5rem;
                    width: 100%; max-width: 450px; text-align: center; position: relative;
                }
                .pomodoro-title { font-family: 'Fredericka the Great', cursive; font-size: 2.5rem; color: #1a0d2e; margin-bottom: 1.5rem; text-shadow: 2px 2px 8px rgba(0,0,0,0.1); }
                .mode-selector { display: flex; justify-content: center; gap: 0.5rem; background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 999px; margin-bottom: 2rem; }
                .mode-btn { padding: 0.6rem 1.2rem; border-radius: 999px; background: transparent; color: #1a0d2e; font-weight: 600; transition: all 0.3s ease; border: none; cursor: pointer; }
                .mode-btn.active { background: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); color: #6b21a8; }
                
                .timer-display { position: relative; width: 300px; height: 300px; margin: 0 auto 2rem; }
                .timer-display.active { animation: pulse 2s infinite ease-in-out; }
                @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } }

                .timer-svg { transform: rotate(-90deg); }
                .timer-circle-bg { fill: none; stroke: rgba(0,0,0,0.1); stroke-width: 15; }
                .timer-circle-progress {
                    fill: none; stroke: url(#progressGradient); stroke-width: 15; stroke-linecap: round;
                    stroke-dasharray: ${circumference}; stroke-dashoffset: ${strokeDashoffset};
                    transition: stroke-dashoffset 0.5s linear;
                }
                .time-left { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 4rem; font-weight: 700; color: #1a0d2e; font-family: 'Inter', sans-serif; }
                
                .controls { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
                .control-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: #fff; padding: 1rem 2rem; border-radius: 999px; font-size: 1.25rem; font-weight: 600; transition: all 0.3s ease; text-shadow: 1px 1px 4px rgba(0,0,0,0.2); min-width: 180px; }
                .btn-primary { background: linear-gradient(to right, #6b21a8, #c2410c); }
                .btn-primary:hover { box-shadow: 0 6px 14px rgba(0,0,0,0.2); transform: translateY(-3px); }
                .btn-secondary { background: transparent; border: 2px solid #6b21a8; color: #6b21a8; padding: 0; width: 50px; height: 50px; border-radius: 50%; min-width: auto; }
                .btn-secondary:hover { background: rgba(107, 33, 168, 0.1); }
                
                .settings-btn { position: absolute; top: 1.5rem; right: 1.5rem; background: none; border: none; color: #6b21a8; cursor: pointer; padding: 0.5rem; transition: transform 0.3s ease; }
                .settings-btn:hover { transform: rotate(45deg); }

                .pomodoro-counter { font-size: 1rem; font-weight: 600; color: #1a0d2e; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
                .completed-mark { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: #e9d5ff; color: #6b21a8; }

                /* Modal Styles */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); animation: fadeIn 0.3s ease; }
                .modal-content { background: #fff; padding: 2rem; border-radius: 1rem; width: 90%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); animation: slideIn 0.3s ease; }
                .modal-title { font-family: 'Fredericka the Great', cursive; font-size: 2rem; margin-bottom: 1.5rem; text-align: center; }
                .settings-form { display: flex; flex-direction: column; gap: 1rem; }
                .form-group { display: flex; flex-direction: column; text-align: left; }
                .form-group label { margin-bottom: 0.5rem; font-weight: 600; color: #3d1c63; }
                .form-group input { padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #ddd; font-size: 1rem; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
                .modal-actions .btn-secondary, .modal-actions .btn-primary { min-width: 100px; width: auto; height: auto; padding: 0.75rem 1.5rem; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>

            {isSettingsOpen && <SettingsModal settings={settings} onSave={handleSaveSettings} onClose={() => setIsSettingsOpen(false)} />}
            
            <div className="pomodoro-container">
                <div className="pomodoro-card">
                    <button className="settings-btn" onClick={() => setIsSettingsOpen(true)} aria-label="Open settings">
                        <SettingsIcon />
                    </button>
                    <h1 className="pomodoro-title">Pomodoro Timer</h1>
                    <div className="mode-selector">
                        <button className={`mode-btn ${mode === 'pomodoro' ? 'active' : ''}`} onClick={() => switchMode('pomodoro')}>
                            Pomodoro
                        </button>
                        <button className={`mode-btn ${mode === 'shortBreak' ? 'active' : ''}`} onClick={() => switchMode('shortBreak')}>
                            Short Break
                        </button>
                        <button className={`mode-btn ${mode === 'longBreak' ? 'active' : ''}`} onClick={() => switchMode('longBreak')}>
                            Long Break
                        </button>
                    </div>

                    <div className={`timer-display ${isActive ? 'active' : ''}`}>
                        <svg className="timer-svg" width="300" height="300" viewBox="0 0 300 300">
                             <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#6b21a8" />
                                    <stop offset="100%" stopColor="#c2410c" />
                                </linearGradient>
                            </defs>
                            <circle className="timer-circle-bg" cx="150" cy="150" r="140" />
                            <circle className="timer-circle-progress" cx="150" cy="150" r="140" />
                        </svg>
                        <div className="time-left">
                            {formatTime(secondsLeft)}
                        </div>
                    </div>

                    <div className="controls">
                         <button className="control-btn btn-primary" onClick={toggleTimer}>
                            {isActive ? <PauseIcon /> : <PlayIcon />}
                            {isActive ? 'Pause' : 'Start'}
                        </button>
                        <button className="control-btn btn-secondary" onClick={resetTimer} aria-label="Reset Timer">
                            <ResetIcon />
                        </button>
                    </div>
                   
                    <div className="pomodoro-counter">
                       <span>Sessions:</span>
                       {Array.from({ length: pomodorosCompleted % 4 }).map((_, index) => (
                           <div key={index} className="completed-mark">
                               <CheckIcon />
                           </div>
                       ))}
                    </div>
                </div>
            </div>
        </>
    );
}