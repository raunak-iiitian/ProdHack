import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Timer, Trophy, Copy, Users } from 'lucide-react';
import io from 'socket.io-client';
import './One.css';

// Connect to the backend server. The server must be running!
const socket = io("http://localhost:3002"); // Match the new port

export default function OneOne() {
  const { roomIdFromUrl } = useParams(); // Gets room ID from URL like /battle/A7FB2X
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [roomId, setRoomId] = useState(roomIdFromUrl);
  const [sessionState, setSessionState] = useState('lobby'); // lobby, waiting, studying, quizzing, results
  const [player1, setPlayer1] = useState({ name: 'Player 1', score: 0 });
  const [player2, setPlayer2] = useState({ name: 'Player 2', score: 0 });
  const [studyTime, setStudyTime] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(studyTime);
  const [pdfFile, setPdfFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [quizData, setQuizData] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [player1QuizScore, setPlayer1QuizScore] = useState(0);
  const [player2QuizScore, setPlayer2QuizScore] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState('Player 1');
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [opponentConnected, setOpponentConnected] = useState(false);

  // --- REAL-TIME LOGIC ---
  useEffect(() => {
    // If we joined via a URL, tell the server to put us in that room
    if (roomIdFromUrl) {
      socket.emit('joinRoom', roomIdFromUrl);
      setOpponentConnected(true); // Assume the creator is already there
    }

    socket.on('playerJoined', () => {
      console.log('Opponent has joined the room!');
      setOpponentConnected(true);
    });

    socket.on('opponentAction', ({ action, payload }) => {
      console.log('Received opponent action:', action, payload);
      if (action === 'pdfAnalyzed') {
        setTopics(payload.topics);
        setQuizData(payload.quiz);
        setIsLoading(false);
        setSessionState('waiting');
      }
      if (action === 'startSession') {
        setSessionState('studying');
        setTimeLeft(studyTime);
      }
      // Add more actions for quiz answers if needed
    });

    return () => {
      socket.off('playerJoined');
      socket.off('opponentAction');
    };
  }, [roomIdFromUrl, studyTime]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval = null;
    if (sessionState === 'studying' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && sessionState === 'studying') {
      clearInterval(interval);
      setSessionState('quizzing');
    }
    return () => clearInterval(interval);
  }, [sessionState, timeLeft]);


  // --- API AND GAME LOGIC ---
  const handleCreateRoom = () => {
    socket.emit('createRoom', (newRoomId) => {
      navigate(`/battle/${newRoomId}`);
      setRoomId(newRoomId);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setPdfFile(file);
    setSessionState('waiting');
    setIsLoading(true);

    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      const response = await fetch('http://localhost:3001/api/analyze-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setTopics(data.topics);
      setQuizData(data.quiz);
      socket.emit('gameAction', { roomId, action: 'pdfAnalyzed', payload: data });
    } catch (error) {
      console.error("Error uploading or analyzing file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = () => {
    setSessionState('studying');
    setTimeLeft(studyTime);
    socket.emit('gameAction', { roomId, action: 'startSession' });
  };

  const handleAnswer = (selectedOption) => {
    if (quizAnswered) return;
    setQuizAnswered(true);
    const isCorrect = selectedOption === quizData[currentQuestionIndex].answer;
    if (isCorrect) {
      if (currentPlayer === 'Player 1') setPlayer1QuizScore(prev => prev + 1);
      else setPlayer2QuizScore(prev => prev + 1);
    }
    setTimeout(() => {
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentPlayer(prev => prev === 'Player 1' ? 'Player 2' : 'Player 1');
        setQuizAnswered(false);
      } else {
        endQuiz();
      }
    }, 1500);
  };

  const endQuiz = () => {
    const winner = player1QuizScore > player2QuizScore ? 'Player 1' : 
                   player2QuizScore > player1QuizScore ? 'Player 2' : 'tie';
    if (winner === 'Player 1') setPlayer1(prev => ({ ...prev, score: prev.score + 10 }));
    else if (winner === 'Player 2') setPlayer2(prev => ({ ...prev, score: prev.score + 10 }));
    setSessionState('results');
  };

  const resetGame = () => {
    // In a real app, you might emit a 'rematch' signal
    setSessionState('lobby');
    setRoomId(null);
    navigate('/oneone'); // Navigate back to the creation page
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // --- DYNAMIC RENDERING LOGIC ---
  const renderContent = () => {
    switch (sessionState) {
      case 'idle':
        return (
          <div className="input-section">
            <h2 className="section-title">Start the Battle</h2>
            <p className="section-subtitle">The first player to upload a PDF will generate the quiz!</p>
            <div className="file-input-container">
              <label htmlFor="pdf-upload" className="file-label">
                <Sparkles className="icon-white" /> Upload PDF to Begin
              </label>
              <input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileUpload} className="file-input"/>
            </div>
          </div>
        );
      case 'waiting':
        return (
          <div className="waiting-section">
            {isLoading ? (
              <>
                <div className="loader"></div>
                <h2 className="section-title">Analyzing PDF...</h2>
                <p className="section-subtitle">Gemini is generating your study topics and quiz.</p>
              </>
            ) : (
              <>
                <h2 className="section-title">Ready to Battle?</h2>
                <div className="topics-container">
                  <h3 className="topics-title">Topics to Study:</h3>
                  <ul className="topics-list">
                    {topics.map((topic, index) => <li key={index}>{topic}</li>)}
                  </ul>
                </div>
                <button className="btn-primary" onClick={startSession}>Start Session</button>
              </>
            )}
          </div>
        );
      case 'studying':
        return (
          <div className="studying-section">
            <h2 className="section-title">Focus Time!</h2>
            <p className="section-subtitle">Time remaining:</p>
            <div className="timer-display">
              <Timer className="timer-icon" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        );
      case 'quizzing':
        const currentQuestion = quizData[currentQuestionIndex];
        return (
          <div className="quiz-section">
            <h2 className="section-title">Quiz Time! - {currentPlayer}'s Turn</h2>
            <div className="quiz-card">
              <h3 className="question">{currentQuestion.question}</h3>
              <div className="options-grid">
                {currentQuestion.options.map((option, index) => (
                  <button key={index} className="quiz-option-btn" onClick={() => handleAnswer(option)} disabled={quizAnswered}>{option}</button>
                ))}
              </div>
            </div>
            <p className="quiz-progress">Question {currentQuestionIndex + 1} of {quizData.length}</p>
          </div>
        );
      case 'results':
        const winnerName = player1QuizScore > player2QuizScore ? player1.name : player2QuizScore > player1QuizScore ? player2.name : 'No one';
        const winnerMessage = winnerName === 'No one' ? "It's a tie!" : `${winnerName} wins!`;
        return (
          <div className="results-section">
            <h2 className="section-title"><Trophy /> Battle Results <Trophy /></h2>
            <p className="section-subtitle">{winnerMessage}</p>
            <div className="score-summary">
              <div className="player-score-card">
                <p className="player-name">{player1.name}</p>
                <p className="final-score">{player1QuizScore} / {quizData.length}</p>
              </div>
              <div className="player-score-card">
                <p className="player-name">{player2.name}</p>
                <p className="final-score">{player2QuizScore} / {quizData.length}</p>
              </div>
            </div>
            <button className="btn-primary" onClick={resetGame}>Play Another Battle</button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderLobby = () => (
    <div className="input-section">
      <h2 className="section-title">Create a New Battle</h2>
      <p className="section-subtitle">Start a private room and invite a friend to join!</p>
      <button className="btn-primary" onClick={handleCreateRoom}>
        <Users className="icon-white" /> Create New Game
      </button>
    </div>
  );
  
  const renderWaitingForOpponent = () => (
    <div className="waiting-section">
      <h2 className="section-title">Waiting for Opponent...</h2>
      <p className="section-subtitle">Share the invite link with a friend to begin.</p>
      <div className="loader"></div>
      <div className="invite-link-container">
        <span>Invite Link:</span>
        <input type="text" value={window.location.href} readOnly />
        <button onClick={() => navigator.clipboard.writeText(window.location.href)}>
          <Copy size={18} /> Copy
        </button>
      </div>
    </div>
  );

  return (
    <div className="battle-page">
      <header className="header">
        <div className="header-container">
            <div className="logo-container">
                <Sparkles className="logo-icon" />
                <h1>ProdHack Battle</h1>
            </div>
            {roomId && <p className="score-display">P1 Score: {player1.score} | P2 Score: {player2.score}</p>}
        </div>
      </header>
      <main className="main-content">
        {!roomId && renderLobby()}
        {roomId && !opponentConnected && renderWaitingForOpponent()}
        {roomId && opponentConnected && (sessionState === 'lobby' ? renderContent('idle') : renderContent())}
      </main>
      <footer className="footer">
        <p className="footer-text">Earn points to unlock cool themes in the in-app store!</p>
      </footer>
    </div>
  );
}