import { useState, useEffect } from 'react';
import { Sparkles, Timer, Trophy, Users } from 'lucide-react';
import './One.css'; // External CSS for styling


export default function OneOne() {

  
  // --- STATE MANAGEMENT ---
  const [sessionState, setSessionState] = useState('idle'); // 'idle', 'studying', 'quizzing', 'results'
  const [player1, setPlayer1] = useState({ name: 'Player 1', score: 0 });
  const [player2, setPlayer2] = useState({ name: 'Player 2', score: 0 });
  const [studyTime, setStudyTime] = useState(25 * 60); // Default study time in seconds (25 mins)
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

  // Function to simulate the Gemini API call
  const mockGeminiApiCall = async (file) => {
    setIsLoading(true);
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // This is the mocked API response. In a real app, this would come from a backend server
    // that has processed the PDF file with the Gemini API.
    const mockResponse = {
      topics: [
        'Introduction to the Pomodoro Technique',
        'Benefits of Time Management',
        'Effective Study Habits',
      ],
      quiz: [
        {
          question: 'What is the core principle of the Pomodoro Technique?',
          options: ['Long, uninterrupted sessions', 'Short bursts of focused work', 'Studying only with a partner', 'Using flashcards'],
          answer: 'Short bursts of focused work',
        },
        {
          question: 'What is a common benefit of time management?',
          options: ['Increased stress', 'Reduced productivity', 'Improved focus and efficiency', 'More distractions'],
          answer: 'Improved focus and efficiency',
        },
        {
          question: 'Which of the following is an effective study habit?',
          options: ['Cramming all night', 'Ignoring breaks', 'Setting specific goals', 'Multitasking'],
          answer: 'Setting specific goals',
        },
      ],
    };

    setIsLoading(false);
    setTopics(mockResponse.topics);
    setQuizData(mockResponse.quiz);
  };

  // Handles the file upload and triggers the mock API call
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPdfFile(file);
      setSessionState('waiting');
      mockGeminiApiCall(file);
    }
  };

  // Handles the start of the study session
  const startSession = () => {
    setSessionState('studying');
    setTimeLeft(studyTime);
  };

  // Countdown timer effect
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

  // Handle quiz answer
  const handleAnswer = (selectedOption) => {
    if (quizAnswered) return;
    setQuizAnswered(true);

    const isCorrect = selectedOption === quizData[currentQuestionIndex].answer;
    
    // Update score for the current player
    if (isCorrect) {
      if (currentPlayer === 'Player 1') {
        setPlayer1QuizScore(prevScore => prevScore + 1);
      } else {
        setPlayer2QuizScore(prevScore => prevScore + 1);
      }
    }

    setTimeout(() => {
      // Move to next question or end quiz
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setCurrentPlayer(currentPlayer === 'Player 1' ? 'Player 2' : 'Player 1');
        setQuizAnswered(false);
      } else {
        endQuiz();
      }
    }, 1500); // Give a brief pause before moving on
  };

  // Ends the quiz and determines the winner
  const endQuiz = () => {
    const winner = player1QuizScore > player2QuizScore ? 'Player 1' : 
                   player2QuizScore > player1QuizScore ? 'Player 2' : 'tie';

    if (winner === 'Player 1') {
      setPlayer1(prev => ({ ...prev, score: prev.score + 10 }));
    } else if (winner === 'Player 2') {
      setPlayer2(prev => ({ ...prev, score: prev.score + 10 }));
    }

    setSessionState('results');
  };

  // Resets the game
  const resetGame = () => {
    setSessionState('idle');
    setStudyTime(25 * 60);
    setTimeLeft(25 * 60);
    setPdfFile(null);
    setTopics([]);
    setQuizData([]);
    setCurrentQuestionIndex(0);
    setPlayer1QuizScore(0);
    setPlayer2QuizScore(0);
    setCurrentPlayer('Player 1');
    setQuizAnswered(false);
  };

  // Utility function to format time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // --- RENDERING LOGIC ---
  const renderContent = () => {
    switch (sessionState) {
      case 'idle':
        return (
          <div className="input-section">
            <h2 className="section-title">Start a New Pomodoro Battle</h2>
            <p className="section-subtitle">Choose a PDF to create a custom study session and quiz!</p>
            <div className="file-input-container">
              <label htmlFor="pdf-upload" className="file-label">
                <Sparkles className="icon-white" />
                Upload PDF to generate topics and quiz
              </label>
              <input 
                id="pdf-upload" 
                type="file" 
                accept=".pdf" 
                onChange={handleFileUpload} 
                className="file-input"
              />
            </div>
            <div className="settings-container">
              <label className="text-sm text-center font-bold">Set Study Time (minutes)</label>
              <input
                type="number"
                value={studyTime / 60}
                onChange={(e) => setStudyTime(e.target.value * 60)}
                className="time-input"
                min="1"
              />
            </div>
          </div>
        );

      case 'waiting':
        return (
          <div className="waiting-section">
            {isLoading ? (
              <>
                <div className="loader"></div>
                <h2 className="section-title">Processing PDF...</h2>
                <p className="section-subtitle">Generating study topics and a quiz with Gemini.</p>
              </>
            ) : (
              <>
                <h2 className="section-title">Ready to Battle?</h2>
                <p className="section-subtitle">Gemini has generated your study topics and quiz!</p>
                <div className="topics-container">
                  <h3 className="topics-title">Topics to Study:</h3>
                  <ul className="topics-list">
                    {topics.map((topic, index) => (
                      <li key={index}>{topic}</li>
                    ))}
                  </ul>
                </div>
                <button className="btn-primary" onClick={startSession}>
                  Start Session Now
                </button>
              </>
            )}
          </div>
        );

      case 'studying':
        return (
          <div className="studying-section">
            <h2 className="section-title">Focus Time!</h2>
            <p className="section-subtitle">Study the topics from your PDF. Time remaining:</p>
            <div className="timer-display">
              <Timer className="timer-icon" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <div className="player-stats-container">
              <div className="player-card">
                <h3 className="player-name">Player 1</h3>
                <p className="player-score">Score: {player1.score}</p>
              </div>
              <div className="player-card">
                <h3 className="player-name">Player 2</h3>
                <p className="player-score">Score: {player2.score}</p>
              </div>
            </div>
          </div>
        );

      case 'quizzing':
        const currentQuestion = quizData[currentQuestionIndex];
        return (
          <div className="quiz-section">
            <h2 className="section-title">Quiz Time!</h2>
            <p className="section-subtitle">{currentPlayer}'s turn. Choose the correct answer:</p>
            <div className="quiz-card">
              <h3 className="question">{currentQuestion.question}</h3>
              <div className="options-grid">
                {currentQuestion.options.map((option, index) => (
                  <button 
                    key={index} 
                    className="quiz-option-btn" 
                    onClick={() => handleAnswer(option)}
                    disabled={quizAnswered}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <p className="quiz-progress">
              Question {currentQuestionIndex + 1} of {quizData.length}
            </p>
          </div>
        );

      case 'results':
        const winnerName = player1QuizScore > player2QuizScore ? player1.name :
                         player2QuizScore > player1QuizScore ? player2.name : 'No one';
        const winnerScore = Math.max(player1QuizScore, player2QuizScore);
        const trophyEmoji = winnerScore > 0 ? '🏆' : '';
        const winnerMessage = winnerName === 'No one' ? "It's a tie!" : `${winnerName} wins!`;

        return (
          <div className="results-section">
            <h2 className="section-title">{trophyEmoji} Battle Results {trophyEmoji}</h2>
            <p className="section-subtitle">
              {winnerMessage}
              {winnerName !== 'No one' && ` and earns 10 points!`}
            </p>
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
            <button className="btn-primary" onClick={resetGame}>
              Play Another Battle
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="battle-page">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="logo-container">
            <Sparkles className="logo-icon" />
            <h1>ProdHack Battle</h1>
          </div>
          <p className="score-display">P1 Score: {player1.score} | P2 Score: {player2.score}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {renderContent()}
      </main>

      {/* Footer (simple) */}
      <footer className="footer">
        <p className="footer-text">
          Earn points to unlock cool themes in the in-app store!
        </p>
      </footer>
    </div>
  );
}