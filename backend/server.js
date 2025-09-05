// 1. IMPORTS AND SETUP
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const connectDB = require('./db'); // <-- IMPORT DATABASE CONNECTION
const authRoutes = require('./routes/auth'); // <-- IMPORT AUTH ROUTES
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB(); // <-- CALL THE CONNECTION FUNCTION

// Init Middleware
app.use(express.json()); // <-- ADD THIS to parse JSON request bodies
app.use(cors({ origin: "http://localhost:5173" }));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// 2. DEFINE ROUTES
app.use('/api/auth', authRoutes); // <-- USE YOUR AUTH ROUTES

// API ROUTE FOR PDF ANALYSIS
app.post('/api/analyze-pdf', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const filePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const prompt = `
      Analyze this document. Based on its content, generate a JSON object with two keys:
      1. "topics": An array of 3-5 main study topics.
      2. "quiz": An array of 3 multiple-choice questions. Each question object should have three keys: "question", "options" (an array of 4 strings), and "answer" (the correct string from the options).
      Do not include any text or markdown formatting outside of the JSON object itself.
    `;

    const result = await model.generateContent([prompt, filePart]);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();
    const jsonData = JSON.parse(responseText);
    
    res.json(jsonData);

  } catch (error) {
    console.error("Error analyzing PDF with Gemini:", error);
    res.status(500).json({ error: 'Failed to analyze PDF with AI.' });
  }
});


// 3. REAL-TIME SOCKET.IO LOGIC FOR MULTIPLAYER
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // ... (your existing socket logic remains the same)
  socket.on('createRoom', (callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.join(roomId);
    console.log(`Room created with ID: ${roomId}`);
    callback(roomId);
  });

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit('playerJoined', { playerId: socket.id });
  });

  socket.on('gameAction', ({ roomId, action, payload }) => {
    console.log(`Action in room ${roomId}:`, action, payload);
    socket.to(roomId).emit('opponentAction', { action, payload });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});


// 4. START THE SERVER
const PORT = process.env.PORT || 3000; // <-- Updated port to 3000
server.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});