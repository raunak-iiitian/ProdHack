import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Timer, Trophy, Copy, Users, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import io from 'socket.io-client';
import './One.css';

// Connect to the backend server
const socket = io("http://localhost:3001", {
  transports: ['websocket'],
  upgrade: false,
});

export default function OneOne() {
  const { roomIdFromUrl } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // --- CONNECTION & ROOM STATES ---
  const [isHost] = useState(location.state?.isHost || !roomIdFromUrl);
  const [roomId, setRoomId] = useState(roomIdFromUrl || '');
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // --- SESSION STATES ---
  const [sessionState, setSessionState] = useState(!roomIdFromUrl ? 'lobby' : 'waiting');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- PDF & QUIZ DATA ---
  const [topics, setTopics] = useState([]);
  const [quizData, setQuizData] = useState([]);
  const [studyDuration, setStudyDuration] = useState(15);
  const [timeLeft, setTimeLeft] = useState(studyDuration * 60);

  // --- QUIZ STATES ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [player1QuizScore, setPlayer1QuizScore] = useState(0);
  const [player2QuizScore, setPlayer2QuizScore] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState('Player 1');
  const [isMyTurn, setIsMyTurn] = useState(true);

  // --- PLAYER DATA ---
  const [player1] = useState({ name: 'Player 1', score: 0 });
  const [player2] = useState({ name: 'Player 2', score: 0 });
  const [opponentName, setOpponentName] = useState('Player 2');

  // --- CONNECTION STATUS ---
  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      setConnectionStatus('connected');
      setError('');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setConnectionStatus('disconnected');
      setError('Connection lost. Attempting to reconnect...');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      setError('Failed to connect to server. Please check if the server is running.');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, []);

  // --- SOCKET EVENT HANDLERS ---
  useEffect(() => {
    if (!roomIdFromUrl) return;

    console.log('🔄 Attempting to join room:', roomIdFromUrl);
    socket.emit('joinRoom', { roomId: roomIdFromUrl, playerName: 'Player 2' });

    return () => {
      // Cleanup handled in main socket effect
    };
  }, [roomIdFromUrl]);

  useEffect(() => {
    // Player joined events
    socket.on('playerJoined', ({ playerName }) => {
      console.log('👥 Player joined:', playerName);
      setOpponentName(playerName || 'Player 2');
      setOpponentConnected(true);
      if (isHost) {
        setSessionState('idle');
      }
    });

    socket.on('joinedRoom', ({ roomId: joinedRoomId }) => {
      console.log('✅ Successfully joined room:', joinedRoomId);
      setRoomId(joinedRoomId);
      setSessionState('idle');
      setOpponentConnected(true);
    });

    socket.on('roomReady', () => {
      console.log('🎮 Room is ready for battle');
      setOpponentConnected(true);
      setSessionState('idle');
    });

    // Game action events
    socket.on('opponentAction', ({ action, payload }) => {
      console.log('🎮 Received opponent action:', action, payload);
      
      switch (action) {
        case 'pdfAnalyzed':
          setTopics(payload.topics || []);
          setQuizData(payload.quiz || []);
          setStudyDuration(payload.studyDuration || 15);
          break;
        case 'startSession':
          setTimeLeft(payload.studyTime);
          setSessionState('studying');
          break;
        case 'quizStarted':
          setSessionState('quizzing');
          setCurrentQuestionIndex(0);
          setCurrentPlayer('Player 1');
          setIsMyTurn(isHost); // Host goes first
          break;
        case 'nextQuestion':
          setCurrentQuestionIndex(payload.questionIndex);
          setCurrentPlayer(payload.currentPlayer);
          setIsMyTurn(payload.isMyTurn);
          setQuizAnswered(false);
          setSelectedAnswer('');
          setShowResult(false);
          break;
        case 'quizEnded':
          setPlayer1QuizScore(payload.player1Score);
          setPlayer2QuizScore(payload.player2Score);
          setSessionState('results');
          break;
      }
    });

    // Quiz answer events
    socket.on('opponentQuizAnswer', ({ questionIndex, answer, isCorrect, player }) => {
      console.log('📝 Opponent answered:', { questionIndex, answer, isCorrect, player });
      // Update opponent's score if needed
      if (isCorrect && player === 'Player 2') {
        setPlayer2QuizScore(s => s + 1);
      }
    });

    // Error and disconnect events
    socket.on('joinError', (message) => {
      console.error('❌ Join error:', message);
      setError(message);
      setSessionState('lobby');
    });

    socket.on('opponentDisconnected', () => {
      console.log('👋 Opponent disconnected');
      setError('Your opponent has disconnected.');
      setOpponentConnected(false);
      setSessionState('lobby');
    });

    return () => {
      socket.off('playerJoined');
      socket.off('joinedRoom');
      socket.off('roomReady');
      socket.off('opponentAction');
      socket.off('opponentQuizAnswer');
      socket.off('joinError');
      socket.off('opponentDisconnected');
    };
  }, [isHost]);

  // --- TIMER COUNTDOWN ---
  useEffect(() => {
    if (sessionState === 'studying' && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setSessionState('quizzing');
            setCurrentQuestionIndex(0);
            setCurrentPlayer('Player 1');
            setIsMyTurn(isHost);
            
            // Notify opponent that quiz started
            socket.emit('gameAction', {
              roomId,
              action: 'quizStarted',
              payload: {}
            });
            
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionState, timeLeft, roomId, isHost]);

  // --- ACTION HANDLERS ---
  const handleCreateRoom = useCallback(() => {
    if (connectionStatus !== 'connected') {
      setError('Please wait for connection to establish');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    socket.emit('createRoom', (newRoomId) => {
      console.log('🏠 Room created:', newRoomId);
      setRoomId(newRoomId);
      setSessionState('waiting');
      setIsLoading(false);
      
      // Update URL without full navigation
      const newUrl = `/battle/${newRoomId}`;
      window.history.pushState({ isHost: true }, '', newUrl);
    });
  }, [connectionStatus]);

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Please upload a file smaller than 10MB.');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      console.log('📤 Uploading PDF for analysis...');
      const response = await fetch('http://localhost:3001/api/analyze-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.topics || !data.quiz) {
        throw new Error('Invalid response format from server');
      }

      console.log('✅ PDF analysis successful:', data);
      setTopics(data.topics);
      setQuizData(data.quiz);

      // Broadcast to opponent
      socket.emit('gameAction', {
        roomId,
        action: 'pdfAnalyzed',
        payload: {
          topics: data.topics,
          quiz: data.quiz,
          studyDuration
        }
      });

    } catch (err) {
      console.error('❌ PDF upload error:', err);
      setError(err.message || 'Failed to analyze PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, studyDuration]);

  const startSession = useCallback(() => {
    const initialTime = studyDuration * 60;
    setTimeLeft(initialTime);
    setSessionState('studying');
    
    socket.emit('gameAction', {
      roomId,
      action: 'startSession',
      payload: { studyTime: initialTime }
    });
  }, [roomId, studyDuration]);

  const handleAnswer = useCallback((selectedOption) => {
    if (quizAnswered || !isMyTurn) return;
    
    setSelectedAnswer(selectedOption);
    setQuizAnswered(true);
    setShowResult(true);

    const isCorrect = selectedOption === quizData[currentQuestionIndex].answer;
    const currentPlayerName = isHost ? 'Player 1' : 'Player 2';
    
    // Update local score
    if (isCorrect) {
      if (isHost) {
        setPlayer1QuizScore(s => s + 1);
      } else {
        setPlayer2QuizScore(s => s + 1);
      }
    }

    // Send answer to opponent
    socket.emit('quizAnswer', {
      roomId,
      questionIndex: currentQuestionIndex,
      answer: selectedOption,
      isCorrect,
      player: currentPlayerName
    });

    setTimeout(() => {
      if (currentQuestionIndex < quizData.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        const nextPlayer = currentPlayer === 'Player 1' ? 'Player 2' : 'Player 1';
        const nextIsMyTurn = !isMyTurn;
        
        setCurrentQuestionIndex(nextIndex);
        setCurrentPlayer(nextPlayer);
        setIsMyTurn(nextIsMyTurn);
        setQuizAnswered(false);
        setSelectedAnswer('');
        setShowResult(false);
        
        // Notify opponent about next question
        socket.emit('gameAction', {
          roomId,
          action: 'nextQuestion',
          payload: {
            questionIndex: nextIndex,
            currentPlayer: nextPlayer,
            isMyTurn: !nextIsMyTurn // Opposite for opponent
          }
        });
      } else {
        endQuiz();
      }
    }, 2000);
  }, [quizAnswered, isMyTurn, quizData, currentQuestionIndex, isHost, currentPlayer, roomId]);

  const endQuiz = useCallback(() => {
    const finalP1Score = player1QuizScore + (isHost && selectedAnswer === quizData[currentQuestionIndex]?.answer ? 1 : 0);
    const finalP2Score = player2QuizScore + (!isHost && selectedAnswer === quizData[currentQuestionIndex]?.answer ? 1 : 0);
    
    setSessionState('results');
    
    // Notify opponent about quiz end
    socket.emit('gameAction', {
      roomId,
      action: 'quizEnded',
      payload: {
        player1Score: finalP1Score,
        player2Score: finalP2Score
      }
    });
  }, [player1QuizScore, player2QuizScore, isHost, selectedAnswer, quizData, currentQuestionIndex, roomId]);

  const resetGame = useCallback(() => {
    // Reset all states
    setSessionState('lobby');
    setOpponentConnected(false);
    setTopics([]);
    setQuizData([]);
    setCurrentQuestionIndex(0);
    setQuizAnswered(false);
    setSelectedAnswer('');
    setShowResult(false);
    setPlayer1QuizScore(0);
    setPlayer2QuizScore(0);
    setCurrentPlayer('Player 1');
    setIsMyTurn(true);
    setError('');
    setTimeLeft(studyDuration * 60);
    
    navigate('/oneone');
  }, [navigate, studyDuration]);

  const copyInviteLink = useCallback(() => {
    const link = `${window.location.origin}/battle/${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      // Could show a toast notification here
      console.log('📋 Invite link copied to clipboard');
    });
  }, [roomId]);

  // --- UTILITY FUNCTIONS ---
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="text-green-500" size={16} />;
      case 'connecting': return <Timer className="text-yellow-500" size={16} />;
      case 'disconnected': return <AlertCircle className="text-red-500" size={16} />;
      default: return <AlertCircle className="text-red-500" size={16} />;
    }
  };

  // --- RENDER FUNCTIONS ---
  const renderLobby = () => (
    <div className="input-section">
      <h2>🎯 Study Battle Arena</h2>
      <p>Challenge a friend to a study battle! Upload a PDF, study together, then compete in a quiz.</p>
      
      {connectionStatus !== 'connected' ? (
        <div className="connection-status">
          {getConnectionStatusIcon()}
          <span>Connecting to server...</span>
        </div>
      ) : (
        <button 
          className="btn-primary" 
          onClick={handleCreateRoom}
          disabled={isLoading}
        >
          <Users /> {isLoading ? 'Creating...' : 'Create New Battle'}
        </button>
      )}
    </div>
  );

  const renderWaiting = () => (
    <div className="waiting-section">
      <h2>⏳ Waiting for Opponent...</h2>
      <div className="loader"></div>
      
      {roomId && (
        <div className="invite-section">
          <p>Share this link with your opponent:</p>
          <div className="invite-link-container">
            <input 
              type="text" 
              value={`${window.location.origin}/battle/${roomId}`} 
              readOnly 
            />
            <button onClick={copyInviteLink} title="Copy invite link">
              <Copy size={18} />
            </button>
          </div>
          <p className="room-id">Room ID: <strong>{roomId}</strong></p>
        </div>
      )}
    </div>
  );

  const renderIdle = () => (
    <div className="input-section">
      <div className="battle-header">
        <h2>⚔️ Battle Setup</h2>
        <div className="connection-info">
          <span className={`status ${opponentConnected ? 'connected' : 'waiting'}`}>
            {opponentConnected ? '✅ Opponent Ready' : '⏳ Waiting for opponent'}
          </span>
        </div>
      </div>

      {isHost ? (
        <div className="host-controls">
          <div className="settings-container">
            <label htmlFor="study-duration">📚 Study Time (minutes)</label>
            <input
              id="study-duration"
              type="number"
              value={studyDuration}
              onChange={e => setStudyDuration(Math.max(1, Math.min(60, Number(e.target.value))))}
              min="1"
              max="60"
              disabled={topics.length > 0}
            />
          </div>

          <div className="upload-section">
            <label htmlFor="pdf-upload" className="upload-label">
              <Upload /> Upload Study Material (PDF)
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isLoading || topics.length > 0}
            />
          </div>

          {isLoading && (
            <div className="loading-status">
              <div className="loader"></div>
              <p>🤖 AI is analyzing your PDF...</p>
            </div>
          )}

          {topics.length > 0 && quizData.length > 0 && opponentConnected && (
            <button className="btn-primary btn-start" onClick={startSession}>
              🚀 Start Battle Session
            </button>
          )}
        </div>
      ) : (
        <div className="guest-waiting">
          <p>🎯 Waiting for host to upload study material...</p>
          {topics.length > 0 && <p>📚 Study material received! Ready to start.</p>}
        </div>
      )}

      {topics.length > 0 && (
        <div className="topics-preview">
          <h3>📖 Study Topics</h3>
          <ul className="topics-list">
            {topics.map((topic, index) => (
              <li key={index}>{topic}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderStudying = () => (
    <div className="studying-section">
      <h2>📚 Study Time!</h2>
      <div className="timer-display">
        <Timer size={32} />
        <span className="timer-text">{formatTime(timeLeft)}</span>
      </div>
      <p>Focus and study the material. Quiz starts when timer ends!</p>
      
      {topics.length > 0 && (
        <div className="study-topics">
          <h3>Key Topics to Focus On:</h3>
          <ul>
            {topics.map((topic, index) => (
              <li key={index}>{topic}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderQuizzing = () => {
    const currentQuestion = quizData[currentQuestionIndex];
    if (!currentQuestion) return <div className="loader"></div>;

    return (
      <div className="quiz-section">
        <div className="quiz-header">
          <h2>🧠 Quiz Battle</h2>
          <div className="turn-indicator">
            <span className={`player-turn ${isMyTurn ? 'active' : ''}`}>
              {isMyTurn ? '👤 Your Turn' : `⏳ ${opponentName}'s Turn`}
            </span>
          </div>
        </div>

        <div className="quiz-progress">
          <span>Question {currentQuestionIndex + 1} of {quizData.length}</span>
          <div className="score-display">
            <span>You: {isHost ? player1QuizScore : player2QuizScore}</span>
            <span>{opponentName}: {isHost ? player2QuizScore : player1QuizScore}</span>
          </div>
        </div>

        <div className="quiz-card">
          <h3 className="question">{currentQuestion.question}</h3>
          
          <div className="options-grid">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = 'option-btn';
              
              if (showResult && selectedAnswer) {
                if (option === currentQuestion.answer) {
                  buttonClass += ' correct';
                } else if (option === selectedAnswer) {
                  buttonClass += ' incorrect';
                }
              }

              return (
                <button
                  key={index}
                  className={buttonClass}
                  onClick={() => handleAnswer(option)}
                  disabled={quizAnswered || !isMyTurn}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="answer-feedback">
              {selectedAnswer === currentQuestion.answer ? (
                <p className="correct-feedback">✅ Correct!</p>
              ) : (
                <p className="incorrect-feedback">❌ Incorrect. The answer was: {currentQuestion.answer}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const myScore = isHost ? player1QuizScore : player2QuizScore;
    const opponentScore = isHost ? player2QuizScore : player1QuizScore;
    const isWinner = myScore > opponentScore;
    const isTie = myScore === opponentScore;

    return (
      <div className="results-section">
        <div className="results-header">
          <Trophy size={48} className="trophy-icon" />
          <h2>🏁 Battle Complete!</h2>
        </div>

        <div className="results-content">
          {isTie ? (
            <div className="tie-result">
              <h3>🤝 It's a Tie!</h3>
              <p>Great minds think alike!</p>
            </div>
          ) : (
            <div className={`winner-announcement ${isWinner ? 'winner' : 'loser'}`}>
              <h3>{isWinner ? '🎉 You Won!' : `🏆 ${opponentName} Wins!`}</h3>
              <p>{isWinner ? 'Excellent work!' : 'Better luck next time!'}</p>
            </div>
          )}

          <div className="final-scores">
            <div className="score-card">
              <h4>Your Score</h4>
              <div className="score-value">{myScore} / {quizData.length}</div>
              <div className="score-percentage">
                {Math.round((myScore / quizData.length) * 100)}%
              </div>
            </div>
            
            <div className="score-card">
              <h4>{opponentName}'s Score</h4>
              <div className="score-value">{opponentScore} / {quizData.length}</div>
              <div className="score-percentage">
                {Math.round((opponentScore / quizData.length) * 100)}%
              </div>
            </div>
          </div>

          <div className="results-actions">
            <button className="btn-primary" onClick={resetGame}>
              🔄 New Battle
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (sessionState) {
      case 'lobby': return renderLobby();
      case 'waiting': return renderWaiting();
      case 'idle': return renderIdle();
      case 'studying': return renderStudying();
      case 'quizzing': return renderQuizzing();
      case 'results': return renderResults();
      default: return <div className="loader"></div>;
    }
  };

  // --- MAIN RENDER ---
  return (
    <div className="battle-page">
      <header className="header">
        <div className="header-container">
          <div className="logo-container">
            <Sparkles className="logo-icon" />
            <h1>StudyBattle</h1>
          </div>
          
          <div className="header-info">
            {roomId && (
              <div className="room-info">
                <span>Room: {roomId}</span>
              </div>
            )}
            
            <div className="connection-status">
              {getConnectionStatusIcon()}
              <span className="status-text">{connectionStatus}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {error ? (
          <div className="error-section">
            <div className="error-content">
              <AlertCircle size={32} className="error-icon" />
              <p className="error-message">{error}</p>
              <button className="btn-primary" onClick={resetGame}>
                🏠 Go Home
              </button>
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </main>

      <footer className="footer">
        <p>🎯 Challenge your friends • 📚 Learn together • 🏆 Compete fairly</p>
      </footer>
    </div>
  );
}
