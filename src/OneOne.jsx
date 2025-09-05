import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Timer, Trophy, Copy, Users } from 'lucide-react';
import io from 'socket.io-client';
import './One.css';

// Ensure this URL and port match your running backend server
const socket = io("http://localhost:3001");

export default function OneOne() {
  const { roomIdFromUrl } = useParams();
  const navigate = useNavigate();

  // --- State Management ---
  const [roomId, setRoomId] = useState(roomIdFromUrl);
  const [sessionState, setSessionState] = useState('lobby');
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [quizData, setQuizData] = useState([]);
  
  // --- TIMER STATE ---
  const [studyDuration, setStudyDuration] = useState(15); // Default study time in minutes
  const [timeLeft, setTimeLeft] = useState(studyDuration * 60);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [player1QuizScore, setPlayer1QuizScore] = useState(0);
  const [player2QuizScore, setPlayer2QuizScore] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState('Player 1');
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [player1, setPlayer1] = useState({ name: 'Player 1', score: 0 });
  const [player2, setPlayer2] = useState({ name: 'Player 2', score: 0 });
  const [error, setError] = useState('');

  // --- Real-Time Multiplayer Logic ---
  useEffect(() => {
    if (roomIdFromUrl) {
      socket.emit('joinRoom', roomIdFromUrl);
      setOpponentConnected(true);
      setSessionState('idle'); 
    }

    socket.on('playerJoined', () => {
      console.log('Opponent has joined the room!');
      setOpponentConnected(true);
      setSessionState('idle'); 
    });

    socket.on('opponentAction', ({ action, payload }) => {
      if (action === 'pdfAnalyzed') {
        setTopics(payload.topics);
        setQuizData(payload.quiz);
        // Sync timer duration from the host
        setStudyDuration(payload.studyDuration);
        setTimeLeft(payload.studyDuration * 60);
        setIsLoading(false);
        setSessionState('waiting');
      }
      if (action === 'startSession') {
        console.log("Opponent started session. Switching to 'studying'.");
        setSessionState('studying');
        setTimeLeft(payload.studyTime);
      }
    });

    return () => {
      socket.off('playerJoined');
      socket.off('opponentAction');
    };
  }, [roomIdFromUrl]);

  // --- TIMER COUNTDOWN LOGIC (CRITICAL) ---
  useEffect(() => {
    let interval = null;
    if (sessionState === 'studying' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && sessionState === 'studying') {
      clearInterval(interval);
      console.log("Timer finished. Switching to 'quizzing'.");
      setSessionState('quizzing');
    }
    return () => clearInterval(interval);
  }, [sessionState, timeLeft]);


  const handleCreateRoom = () => {
    socket.emit('createRoom', (newRoomId) => {
      navigate(`/battle/${newRoomId}`);
      setRoomId(newRoomId);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSessionState('waiting');
    setIsLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      const response = await fetch('http://localhost:3001/api/analyze-pdf', {
        method: 'POST', body: formData,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!data.topics || !data.quiz) throw new Error("AI response is missing data.");

      setTopics(data.topics);
      setQuizData(data.quiz);
      
      const payload = { ...data, studyDuration: studyDuration };
      socket.emit('gameAction', { roomId: roomId || roomIdFromUrl, action: 'pdfAnalyzed', payload });

    } catch (err) {
      console.error("Error during file upload:", err);
      setError('Failed to analyze the PDF. Please try again.');
      setSessionState('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = () => {
    console.log("Starting session. Switching to 'studying'.");
    setSessionState('studying');
    const initialTime = studyDuration * 60;
    setTimeLeft(initialTime);
    socket.emit('gameAction', { roomId: roomId || roomIdFromUrl, action: 'startSession', payload: { studyTime: initialTime } });
  };
  
  const handleAnswer = (selectedOption) => {
    // ... (rest of the game logic is unchanged)
    if (quizAnswered) return;
    setQuizAnswered(true);
    const isCorrect = selectedOption === quizData[currentQuestionIndex].answer;
    if (isCorrect) {
      if (currentPlayer === 'Player 1') setPlayer1QuizScore(s => s + 1);
      else setPlayer2QuizScore(s => s + 1);
    }
    setTimeout(() => {
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setCurrentPlayer(p => p === 'Player 1' ? 'Player 2' : 'Player 1');
        setQuizAnswered(false);
      } else {
        endQuiz();
      }
    }, 1500);
  };
  
  const endQuiz = () => {
    if (player1QuizScore > player2QuizScore) setPlayer1(p => ({ ...p, score: p.score + 10 }));
    else if (player2QuizScore > player1QuizScore) setPlayer2(p => ({ ...p, score: p.score + 10 }));
    setSessionState('results');
  };
  
  const resetGame = () => {
    navigate('/OneOne');
    // Full reset
    window.location.reload();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- UI Rendering ---
  const renderContent = () => {
    switch (sessionState) {
        case 'idle':
            return (
                <div className="input-section">
                    <h2 className="section-title">Start the Battle</h2>
                    <p className="section-subtitle">Set the timer, then upload a PDF to generate the quiz.</p>
                    {/* --- NEW TIMER SETTING INPUT --- */}
                    <div className="settings-container">
                        <label>Set Study Time (minutes)</label>
                        <input
                          type="number"
                          value={studyDuration}
                          onChange={(e) => setStudyDuration(Number(e.target.value))}
                          className="time-input"
                          min="1"
                          max="60"
                        />
                    </div>
                    <label htmlFor="pdf-upload" className="file-label"><Sparkles /> Upload PDF to Begin</label>
                    <input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileUpload} className="file-input"/>
                    {error && <p className="error-message">{error}</p>}
                </div>
            );
        case 'studying':
            return (
                // --- TIMER DISPLAY ---
                <div className="studying-section">
                    <h2 className="section-title">Focus Time!</h2>
                    <p className="section-subtitle">Time remaining:</p>
                    <div className="timer-display">
                        <Timer className="timer-icon" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                </div>
            );
        // ... other cases (waiting, quizzing, results) are unchanged
        case 'waiting':
             return (
                <div className="waiting-section">
                    {isLoading ? ( <> <div className="loader"></div> <h2>Analyzing PDF...</h2> </> ) : (
                        <>
                            <h2>Ready to Battle?</h2>
                            <div className="topics-container">
                                <h3>Topics to Study ({studyDuration} minutes):</h3>
                                <ul>{topics.map((topic, i) => <li key={i}>{topic}</li>)}</ul>
                            </div>
                            <button className="btn-primary" onClick={startSession}>Start Session</button>
                        </>
                    )}
                </div>
            );
        case 'quizzing':
            if (!quizData || quizData.length === 0) return <div><h2>Loading quiz...</h2></div>;
            const q = quizData[currentQuestionIndex];
            if (!q) return <div><h2>Loading question...</h2></div>;
            return (
                <div className="quiz-section">
                    <h2>Quiz Time! - {currentPlayer}'s Turn</h2>
                    <div className="quiz-card">
                        <h3>{q.question}</h3>
                        <div className="options-grid">
                            {q.options.map((opt, i) => <button key={i} className="quiz-option-btn" onClick={() => handleAnswer(opt)} disabled={quizAnswered}>{opt}</button>)}
                        </div>
                    </div>
                    <p>Question {currentQuestionIndex + 1} of {quizData.length}</p>
                </div>
            );
        case 'results':
            const winner = player1QuizScore > player2QuizScore ? player1.name : (player2QuizScore > player1QuizScore ? player2.name : 'No one');
            return (
                <div className="results-section">
                    <h2><Trophy /> Battle Results <Trophy /></h2>
                    <p className="winner-message">{winner === 'No one' ? "It's a tie!" : `${winner} wins!`}</p>
                    <div className="score-summary">
                      <div className="player-score-card"><p>{player1.name}</p><p>{player1QuizScore} / {quizData.length}</p></div>
                      <div className="player-score-card"><p>{player2.name}</p><p>{player2QuizScore} / {quizData.length}</p></div>
                    </div>
                    <button className="btn-primary" onClick={resetGame}>Play Another Battle</button>
                </div>
            );
        default: return null;
    }
  };

  const renderLobby = () => (
    <div className="input-section">
        <h2>Create a New Battle</h2>
        <button className="btn-primary" onClick={handleCreateRoom}><Users /> Create New Game</button>
    </div>
  );
  
  const renderWaiting = () => (
    <div className="waiting-section">
        <h2>Waiting for Opponent...</h2>
        <div className="loader"></div>
        <div className="invite-link-container">
            <input type="text" value={window.location.href} readOnly />
            <button onClick={() => navigator.clipboard.writeText(window.location.href)}><Copy size={18} /> Copy Link</button>
        </div>
    </div>
  );

  return (
    <div className="battle-page">
      <header className="header">
          <div className="header-container">
              <div className="logo-container"> <Sparkles className="logo-icon" /> <h1>ProdHack Battle</h1> </div>
              {roomId && <p className="score-display">P1 Score: {player1.score} | P2 Score: {player2.score}</p>}
          </div>
      </header>
      <main className="main-content">
        {!roomIdFromUrl && !roomId && renderLobby()}
        {(roomId || roomIdFromUrl) && !opponentConnected && renderWaiting()}
        {(roomId || roomIdFromUrl) && opponentConnected && renderContent()}
      </main>
      <footer className="footer"><p>Earn points to unlock cool themes!</p></footer>
    </div>
  );
}