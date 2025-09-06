// 1. IMPORTS & SETUP
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// <-- DB & ROUTE IMPORTS -->
const connectDB = require('./db'); 
const authRoutes = require('./routes/auth');

// <-- INITIALIZE APP & SERVER -->
const app = express();
const server = http.createServer(app);

// 2. DATABASE CONNECTION
connectDB();

// 3. MIDDLEWARE
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json()); // Middleware to parse JSON request bodies

// 4. SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 5. GLOBAL STATE MANAGEMENT
const rooms = new Map(); // roomId -> { players: Set, status: string, host: string, data: object }

// 6. SOCKET.IO EVENT HANDLERS
io.on('connection', (socket) => {
  console.log(`🔗 Player connected: ${socket.id}`);

  // Create room
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
      room.scores = {};
      room.answers = {};
      for (const playerId of room.players) {
        room.scores[playerId] = 0;
        room.answers[playerId] = {};
      }
    }
    socket.to(roomId).emit('opponentAction', { action, payload });
  });

  // Quiz answers
  socket.on('quizAnswer', ({ roomId, questionIndex, chosenOption }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'quizzing' || !room.quizData || !room.quizData[questionIndex]) return;
    if (room.answers[socket.id] && room.answers[socket.id][questionIndex]) return;

    if (!room.answers[socket.id]) room.answers[socket.id] = {};
    room.answers[socket.id][questionIndex] = true;

    const correctAnswer = room.quizData[questionIndex].answer;
    const isCorrect = (chosenOption === correctAnswer);

    if (isCorrect) {
      room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;
    }

    socket.to(roomId).emit('opponentAnswered', { questionIndex, chosenOption, isCorrect });
    io.to(roomId).emit('scoreUpdate', room.scores);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 Player disconnected: ${socket.id}`);
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    room.players.delete(socket.id);

    if (room.players.size === 0) {
      rooms.delete(roomId);
      console.log(`🗑️ Room ${roomId} deleted.`);
    } else {
      room.status = 'waiting';
      socket.to(roomId).emit('opponentDisconnected');
    }
  });
});


// 7. API ROUTES
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  }
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// <-- AUTHENTICATION ROUTES -->
app.use('/api/auth', authRoutes);

// <-- PDF ANALYSIS ROUTE -->
app.post('/api/analyze-pdf', upload.single('pdfFile'), async (req, res) => {
  // ... (Using the more robust version of your PDF analysis logic)
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ success: false, error: 'Server configuration error: API key missing.' });
  
  const prompt = `
        Analyze the provided PDF for a study session. Suggest 10 key topics or concepts that a student should focus on to best understand the material. Also, generate a 10-question multiple-choice quiz based on these core concepts. Return a single, clean JSON object with the following structure:
        { "topics": ["<Topic 1>", ...], "quiz": [{ "question": "<Question>", "options": ["<A>", "<B>", "<C>", "<D>"], "answer": "<Correct>" }, ...] }
        Ensure the 'answer' value is present in its 'options' array. Do not include any text, explanations, or markdown formatting outside of this JSON object.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const filePart = { inlineData: { data: req.file.buffer.toString("base64"), mimeType: req.file.mimetype } };
    const result = await model.generateContent([prompt, filePart]);
    const responseText = result.response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) data = JSON.parse(jsonMatch[1]);
      else throw new Error('Invalid or malformed JSON response from AI.');
    }

    if (!data.topics || !data.quiz || !Array.isArray(data.topics) || !Array.isArray(data.quiz)) {
      throw new Error('AI response is missing required "topics" or "quiz" arrays.');
    }

    res.json({ success: true, topics: data.topics.slice(0, 10), quiz: data.quiz.slice(0, 10), studyDuration: 15 });

  } catch (error) {
    console.error('❌ Gemini AI Error:', error);
    res.json({
      success: true, isFallback: true,
      topics: Array.from({ length: 10 }, (_, i) => `Analysis Failed: Topic ${i + 1}`),
      quiz: Array.from({ length: 10 }, (_, i) => ({ question: `This is fallback question #${i + 1}.`, options: ["A", "B", "C", "D"], answer: "A" })),
      studyDuration: 15
    });
  }
});


// 8. START THE SERVER
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
});