// server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const multer = require('multer');
const { Server } = require('socket.io');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// HTTP + Socket.IO setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ROOM MANAGEMENT
const rooms = new Map(); // roomId -> { players: Set, status: string, host: string, data: object }

// Firestore setup (optional)
let admin = null, db = null;
try {
  admin = require('firebase-admin');
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  db = admin.firestore();
  console.log('✅ Firestore initialized');
} catch (error) {
  console.log('ℹ️ Firestore not configured (optional)');
}

// SOCKET.IO
io.on('connection', (socket) => {
  console.log(`🔗 Player connected: ${socket.id}`);

  // Create Room
  socket.on('createRoom', (callback) => {
    const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
    rooms.set(roomId, {
      players: new Set([socket.id]),
      status: 'waiting',
      host: socket.id,
      created: new Date()
    });
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.isHost = true;

    console.log(`🏠 Room ${roomId} created by ${socket.id}`);
    if (typeof callback === 'function') callback(roomId);
  });

  // Join Room
  socket.on('joinRoom', ({ roomId, playerName = 'Player 2' }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('joinError', 'Room not found.');
    if (room.players.size >= 2 && !room.players.has(socket.id)) return socket.emit('joinError', 'Room is full.');

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.isHost = false;
    socket.data.playerName = playerName;

    room.players.add(socket.id);
    room.status = room.players.size >= 2 ? 'ready' : 'waiting';

    socket.emit('joinedRoom', { roomId, playerName });
    socket.to(roomId).emit('playerJoined', { playerName });

    if (room.players.size === 2) {
      io.to(roomId).emit('roomReady');
    }
  });

  // Game Actions
  socket.on('gameAction', ({ roomId, action, payload }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (action === 'pdfAnalyzed') {
      room.topics = payload.topics;
      room.quizData = payload.quiz;
      room.studyDuration = payload.studyDuration;
      room.pdfUploaded = true;
    } else if (action === 'startSession') {
      room.status = 'studying';
      room.sessionStarted = new Date();
    } else if (action === 'quizStarted') {
      room.status = 'quizzing';
      // Initialize scores and answered questions tracking
      room.scores = {};
      room.answers = {};
      for (const playerId of room.players) {
        room.scores[playerId] = 0;
        room.answers[playerId] = {}; // Tracks { questionIndex: true }
      }
    }
    socket.to(roomId).emit('opponentAction', { action, payload });
  });

  // Quiz answers (SERVER-AUTHORITATIVE & DEDUPLICATED)
  socket.on('quizAnswer', ({ roomId, questionIndex, chosenOption }) => {
    const room = rooms.get(roomId);
    // Validate that the game is in a state to receive answers
    if (!room || room.status !== 'quizzing' || !room.quizData || !room.quizData[questionIndex]) {
      return;
    }

    //
    // ⬇️ CRITICAL FIX: Prevent duplicate answers for the same question ⬇️
    //
    if (room.answers[socket.id] && room.answers[socket.id][questionIndex]) {
      console.log(`Player ${socket.id} already answered question ${questionIndex}. Ignoring.`);
      return; // Stop execution if already answered
    }

    // Mark the question as answered for this player *immediately* to prevent race conditions
    if (!room.answers[socket.id]) room.answers[socket.id] = {};
    room.answers[socket.id][questionIndex] = true;

    // Server validates the answer
    const correctAnswer = room.quizData[questionIndex].answer;
    const isCorrect = (chosenOption === correctAnswer);

    // Update score on the server
    if (isCorrect) {
      room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;
    }

    // Let the opponent's UI know what was answered for feedback
    socket.to(roomId).emit('opponentAnswered', { questionIndex, chosenOption, isCorrect });

    // Broadcast the complete, authoritative score object to BOTH players
    io.to(roomId).emit('scoreUpdate', room.scores);
  });


  // Disconnect
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.players.delete(socket.id);

    if (room.players.size === 0) {
      rooms.delete(roomId);
    } else {
      room.status = 'waiting';
      socket.to(roomId).emit('opponentDisconnected');
    }
  });

  // Room Status
  socket.on('getRoomStatus', (roomId, callback) => {
    const room = rooms.get(roomId);
    if (typeof callback === 'function') {
      callback({
        exists: !!room,
        size: room ? room.players.size : 0,
        status: room ? room.status : 'unknown',
        data: room || {}
      });
    }
  });
});

// MULTER for PDF upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  }
});

// GEMINI AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// PDF Analysis Endpoint
app.post('/api/analyze-pdf', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Gemini API key not configured.');
    return res.status(500).json({ success: false, error: 'Server configuration error: API key missing.' });
  }

  const prompt = `
        Analyze the provided PDF for a study session. Suggest 10 key topics or concepts that a student should focus on to best understand the material.
        
        Also, generate a 10-question multiple-choice quiz based on these core concepts.
        
        Return a single, clean JSON object with the following structure:
        {
          "topics": ["<Suggested Topic 1>", ...],
          "quiz": [
            {
              "question": "<Question text>",
              "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
              "answer": "<The correct option text>"
            },
            ...
          ]
        }
        
        Ensure the 'answer' value for each question is present in its 'options' array. Do not include any text, explanations, or markdown formatting outside of this JSON object.
    `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const filePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype
      }
    };

    const result = await model.generateContent([prompt, filePart]);
    const response = result.response;
    const responseText = response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.warn('⚠️ Initial JSON parse failed, trying to extract from markdown.');
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        data = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Invalid or malformed JSON response from AI.');
      }
    }

    if (!data.topics || !data.quiz || !Array.isArray(data.topics) || !Array.isArray(data.quiz)) {
      throw new Error('AI response is missing required "topics" or "quiz" arrays.');
    }

    return res.json({
      success: true,
      topics: data.topics.slice(0, 10),
      quiz: data.quiz.slice(0, 10),
      studyDuration: 15
    });

  } catch (error) {
    console.error('❌ Gemini AI Error:', error);

    return res.json({
      success: true,
      isFallback: true,
      topics: Array.from({ length: 10 }, (_, i) => `Analysis Failed: Topic ${i + 1}`),
      quiz: Array.from({ length: 10 }, (_, i) => ({
        question: `This is fallback question #${i + 1}. The AI analysis failed.`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        answer: "Option A"
      })),
      studyDuration: 15
    });
  }
});

// Debug & Health
app.get('/api/rooms', (req, res) => {
  const roomsData = Array.from(rooms.entries()).map(([roomId, data]) => ({
    roomId,
    playerCount: data.players.size,
    players: Array.from(data.players),
    status: data.status
  }));
  res.json({ rooms: roomsData });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), activeRooms: rooms.size });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
});