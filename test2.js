import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP' }
});
app.use('/api/', limiter);

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = "gemini-1.5-flash";

const config = {
  systemInstruction: "You are a helpful assistant. Answer in a friendly, conversational tone. Keep responses concise but informative.",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.8,
    maxOutputTokens: 1024,
  }
};

class ChatService {
  constructor() {
    this.sessions = new Map();
    this.generativeModel = ai.getGenerativeModel({ 
      model: model,
      systemInstruction: config.systemInstruction,
      generationConfig: config.generationConfig
    });
  }

  createSession(sessionId = null) {
    const id = sessionId || uuidv4();
    try {
      const chatSession = this.generativeModel.startChat({ history: [] });
      const session = {
        id,
        chatSession,
        history: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      this.sessions.set(id, session);
      return session;
    } catch (error) {
      throw new Error(`Failed to create chat session: ${error.message}`);
    }
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    return session;
  }

  async sendMessage(sessionId, message) {
    try {
      const session = this.getSession(sessionId);
      
      const result = await session.chatSession.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      const exchange = {
        id: uuidv4(),
        user: message,
        assistant: text,
        timestamp: new Date().toISOString()
      };

      session.history.push(exchange);
      session.lastActivity = new Date().toISOString();
      
      return {
        response: text,
        exchangeId: exchange.id,
        sessionId: session.id
      };
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  getSessionHistory(sessionId) {
    try {
      const session = this.getSession(sessionId);
      return {
        sessionId: session.id,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        messageCount: session.history.length,
        history: session.history
      };
    } catch (error) {
      throw new Error(`Failed to get session history: ${error.message}`);
    }
  }

  deleteSession(sessionId) {
    try {
      const session = this.getSession(sessionId);
      this.sessions.delete(sessionId);
      return { sessionId, deletedAt: new Date().toISOString() };
    } catch (error) {
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }

  clearSessionHistory(sessionId) {
    try {
      const session = this.getSession(sessionId);
      session.history = [];
      session.chatSession = this.generativeModel.startChat({ history: [] });
      session.lastActivity = new Date().toISOString();
      return { sessionId, clearedAt: new Date().toISOString() };
    } catch (error) {
      throw new Error(`Failed to clear session history: ${error.message}`);
    }
  }

  getAllSessions() {
    const sessions = Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      messageCount: session.history.length
    }));
    return { sessions, count: sessions.length };
  }

  cleanupInactiveSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    const now = new Date();
    let cleaned = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const lastActivity = new Date(session.lastActivity);
      if (now - lastActivity > maxAge) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }
    
    return { cleaned, remaining: this.sessions.size };
  }
}

const chatService = new ChatService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    sessions: chatService.sessions.size
  });
});

// Create new chat session
app.post('/api/chat/session', (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = chatService.createSession(sessionId);
    res.status(201).json({
      success: true,
      sessionId: session.id,
      createdAt: session.createdAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Send message to chat session
app.post('/api/chat/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and message are required'
      });
    }

    const result = await chatService.sendMessage(sessionId, message);
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const statusCode = error.message.includes('Session not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get session history
app.get('/api/chat/session/:sessionId/history', (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = chatService.getSessionHistory(sessionId);
    res.json({
      success: true,
      ...history
    });
  } catch (error) {
    const statusCode = error.message.includes('Session not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Delete chat session
app.delete('/api/chat/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = chatService.deleteSession(sessionId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    const statusCode = error.message.includes('Session not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Clear session history
app.put('/api/chat/session/:sessionId/clear', (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = chatService.clearSessionHistory(sessionId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    const statusCode = error.message.includes('Session not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all sessions
app.get('/api/chat/sessions', (req, res) => {
  try {
    const result = chatService.getAllSessions();
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cleanup inactive sessions
app.post('/api/chat/cleanup', (req, res) => {
  try {
    const { maxAge } = req.body;
    const result = chatService.cleanupInactiveSessions(maxAge);
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get model info
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    model: model,
    systemInstruction: config.systemInstruction,
    generationConfig: config.generationConfig,
    activeSessions: chatService.sessions.size,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Cleanup inactive sessions every hour
setInterval(() => {
  try {
    const result = chatService.cleanupInactiveSessions();
    if (result.cleaned > 0) {
      console.log(`Cleaned up ${result.cleaned} inactive sessions`);
    }
  } catch (error) {
    console.error('Error during session cleanup:', error.message);
  }
}, 60 * 60 * 1000); // 1 hour

// Start server
app.listen(port, () => {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set');
    process.exit(1);
  }
  console.log(`Chat API server running on port ${port}`);
});

export default app;
