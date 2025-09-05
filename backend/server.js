// 1. IMPORTS AND SETUP
const express = require('express');
const http =require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const server = http.createServer(app);

// Use CORS to allow your frontend to communicate with this backend
app.use(cors({ origin: "http://localhost:5173" })); // IMPORTANT: Replace with your React app's URL

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // IMPORTANT: Replace with your React app's URL
    methods: ["GET", "POST"]
  }
});

// Configure Multer for in-memory file storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// 2. API ROUTE FOR PDF ANALYSIS
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
    
    res.json(jsonData); // Send the structured JSON back to the frontend

  } catch (error) {
    console.error("Error analyzing PDF with Gemini:", error);
    res.status(500).json({ error: 'Failed to analyze PDF with AI.' });
  }
});


// 3. REAL-TIME SOCKET.IO LOGIC FOR MULTIPLAYER
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // When a player creates a new game
  socket.on('createRoom', (callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.join(roomId);
    console.log(`Room created with ID: ${roomId}`);
    callback(roomId); // Send the new room ID back to the creator
  });

  // When a player joins an existing game
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    // Notify the other player in the room that someone has joined
    socket.to(roomId).emit('playerJoined', { playerId: socket.id });
  });

  // Relay game actions (like uploading a file or answering a question)
  socket.on('gameAction', ({ roomId, action, payload }) => {
    console.log(`Action in room ${roomId}:`, action, payload);
    // Send the action to the other player(s) in the room
    socket.to(roomId).emit('opponentAction', { action, payload });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});


// 4. START THE SERVER
const PORT = process.env.PORT || 3002; // Use a different port
server.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});