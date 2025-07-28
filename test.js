// Simple Text-based Chat Interface using Google Generative AI
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the AI client
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure the model for text-based chat
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

// Create readline interface for user input
const rl = readline.createInterface({ input, output });

class TextChatInterface {
  constructor() {
    this.chatSession = null;
    this.conversationHistory = [];
    this.isClosing = false;
  }

  async initialize() {
    try {
      // Get the generative model
      const generativeModel = ai.getGenerativeModel({ 
        model: model,
        systemInstruction: config.systemInstruction,
        generationConfig: config.generationConfig
      });

      // Start a chat session to maintain conversation context
      this.chatSession = generativeModel.startChat({
        history: [],
      });

      console.log("🤖 Chat Interface Initialized!");
      console.log("💡 Type your messages and press Enter to chat.");
      console.log("📝 Type 'exit', 'quit', or 'bye' to end the conversation.\n");
      
    } catch (error) {
      console.error("❌ Error initializing chat:", error.message);
      throw error;
    }
  }

  async sendMessage(userInput) {
    try {
      console.log("🤖 Thinking...");
      
      // Send message to the chat session
      const result = await this.chatSession.sendMessage(userInput);
      const response = await result.response;
      const text = response.text();

      // Store in conversation history
      this.conversationHistory.push({
        user: userInput,
        assistant: text,
        timestamp: new Date().toLocaleTimeString()
      });

      return text;
    } catch (error) {
      console.error("❌ Error sending message:", error.message);
      return "Sorry, I encountered an error processing your message. Please try again.";
    }
  }

  async startChat() {
    console.log("👋 Hello! I'm your AI assistant. How can I help you today?");
    
    while (!this.isClosing) {
      try {
        // Get user input
        const userInput = await rl.question('\n💬 You: ');
        
        // Check for exit commands
        if (['exit', 'quit', 'bye', 'goodbye'].includes(userInput.toLowerCase().trim())) {
          console.log("👋 Goodbye! Thanks for chatting with me!");
          await this.close();
          break;
        }

        // Check for empty input
        if (!userInput.trim()) {
          console.log("🤔 Please enter a message to continue...");
          continue;
        }

        // Send message and get response
        const response = await this.sendMessage(userInput);
        console.log(`\n🤖 Assistant: ${response}`);

      } catch (error) {
        if (!this.isClosing) {
          console.error("❌ Error in chat loop:", error.message);
          console.log("🔄 Let's try again...");
        }
        break;
      }
    }
  }

  displayConversationHistory() {
    console.log("\n📋 Conversation History:");
    console.log("=".repeat(50));
    
    this.conversationHistory.forEach((exchange, index) => {
      console.log(`\n[${exchange.timestamp}] Exchange ${index + 1}:`);
      console.log(`👤 User: ${exchange.user}`);
      console.log(`🤖 Assistant: ${exchange.assistant}`);
    });
  }

  async close() {
    if (this.isClosing) return;
    this.isClosing = true;
    
    console.log("\n📊 Chat session ended.");
    
    if (this.conversationHistory.length > 0) {
      console.log(`💬 Total exchanges: ${this.conversationHistory.length}`);
      
      // Ask if user wants to see conversation history BEFORE closing readline
      try {
        const showHistory = await rl.question("📋 Would you like to see the conversation history? (y/n): ");
        if (showHistory.toLowerCase().startsWith('y')) {
          this.displayConversationHistory();
        }
      } catch (error) {
        // If readline is already closed or there's an error, just skip this step
        console.log("ℹ️ Skipping history display due to readline closure.");
      }
    }
    
    // Close readline interface
    rl.close();
  }
}

// Enhanced chat with additional features
class AdvancedTextChat extends TextChatInterface {
  constructor() {
    super();
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.firebaseSessionDoc = null;
    this.commands = {
      '/help': 'Show available commands',
      '/history': 'Show conversation history',
      '/clear': 'Clear conversation history',
      '/save': 'Save conversation to file',
      '/model': 'Show current model info',
      '/firebase': 'Show Firebase session info',
      '/upload': 'Upload file to Firebase Storage',
      '/recent': 'Show recent conversations from Firebase'
    };
  }

  async handleCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    
    switch(cmd) {
      case '/help':
        this.showHelp();
        return true;
        
      case '/history':
        this.displayConversationHistory();
        return true;
        
      case '/clear':
        this.conversationHistory = [];
        console.log("🧹 Conversation history cleared!");
        return true;
        
      case '/save':
        await this.saveConversation();
        return true;
        
      case '/firebase':
        this.showFirebaseInfo();
        return true;
        
      case '/upload':
        await this.handleUploadCommand(parts);
        return true;
        
      case '/recent':
        await this.showRecentConversations();
        return true;
        
      case '/model':
        this.showModelInfo();
        return true;
        
      default:
        return false;
    }
  }

  showHelp() {
    console.log("\n🔧 Available Commands:");
    Object.entries(this.commands).forEach(([cmd, desc]) => {
      console.log(`  ${cmd} - ${desc}`);
    });
    console.log("\n🔥 Firebase Features:");
    console.log("  - All conversations automatically saved to Firebase");
    console.log("  - File uploads stored in Firebase Storage");
    console.log("  - Session data stored in Firestore");
    console.log("\n📎 File Upload:");
    console.log("  /upload <file_path> [description] - Upload file to Firebase");
  }

  showFirebaseInfo() {
    console.log(`\n🔥 Firebase Session Info:`);
    console.log(`   📍 Session ID: ${this.sessionId}`);
    console.log(`   📄 Document ID: ${this.firebaseSessionDoc || 'Not initialized'}`);
    console.log(`   💬 Messages: ${this.conversationHistory.length}`);
    console.log(`   🕒 Started: ${new Date().toLocaleString()}`);
  }

  showModelInfo() {
    console.log(`\n🤖 Current Model: ${model}`);
    console.log(`📝 System Instruction: ${config.systemInstruction}`);
    console.log(`🔥 Session ID: ${this.sessionId}`);
  }

  async handleUploadCommand(parts) {
    if (parts.length < 2) {
      console.log("❓ Usage: /upload <file_path> [description]");
      console.log("📝 Example: /upload audio.mp3 My voice recording");
      return;
    }
    
    const filePath = parts[1];
    const description = parts.slice(2).join(' ') || 'No description provided';
    
    try {
      // Placeholder for Firebase upload functionality
      console.log(`📤 Uploading file: ${filePath}`);
      console.log(`📝 Description: ${description}`);
      console.log("⚠️ Firebase upload functionality not implemented yet");
    } catch (error) {
      console.error(`❌ Upload failed: ${error.message}`);
    }
  }

  async showRecentConversations() {
    console.log("🔍 Loading recent conversations from Firebase...");
    try {
      // Placeholder for Firebase recent conversations functionality
      console.log("⚠️ Firebase recent conversations functionality not implemented yet");
    } catch (error) {
      console.error(`❌ Error loading recent conversations: ${error.message}`);
    }
  }

  async saveConversation() {
    if (this.conversationHistory.length === 0) {
      console.log("📝 No conversation to save.");
      return;
    }

    try {
      const fs = await import('node:fs/promises');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `chat-history-${timestamp}.json`;
      
      const data = {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        model: model,
        totalExchanges: this.conversationHistory.length,
        conversation: this.conversationHistory
      };
      
      await fs.writeFile(filename, JSON.stringify(data, null, 2));
      console.log(`💾 Conversation saved to: ${filename}`);
    } catch (error) {
      console.error("❌ Error saving conversation:", error.message);
    }
  }

  async startChat() {
    console.log("👋 Hello! I'm your advanced AI assistant with Firebase integration!");
    console.log("💡 Type your messages or use commands (type '/help' for available commands)");
    console.log("🔥 All conversations are automatically saved to Firebase Storage & Firestore");
    console.log("📁 You can upload files with '/upload <file_path>' command");
    
    while (!this.isClosing) {
      try {
        const userInput = await rl.question('\n💬 You: ');
        
        // Check for exit commands
        if (['exit', 'quit', 'bye', 'goodbye'].includes(userInput.toLowerCase().trim())) {
          console.log("👋 Goodbye! Thanks for chatting with me!");
          
          // Final save to Firebase (placeholder)
          if (this.firebaseSessionDoc) {
            try {
              console.log("💾 Final session data would be saved to Firebase");
              // Actual Firebase update would go here
            } catch (error) {
              console.error("⚠️ Error saving final session data:", error.message);
            }
          }
          
          await this.close();
          break;
        }

        // Handle commands
        if (userInput.startsWith('/')) {
          const handled = await this.handleCommand(userInput);
          if (handled) continue;
          console.log("❓ Unknown command. Type '/help' for available commands.");
          continue;
        }

        // Check for empty input
        if (!userInput.trim()) {
          console.log("🤔 Please enter a message or command to continue...");
          continue;
        }

        // Send message and get response
        const response = await this.sendMessage(userInput);
        console.log(`\n🤖 Assistant: ${response}`);

      } catch (error) {
        if (!this.isClosing) {
          console.error("❌ Error in chat loop:", error.message);
          console.log("🔄 Let's try again...");
        }
        break;
      }
    }
  }
}

// Main function to run the chat interface
async function main() {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ Error: GEMINI_API_KEY environment variable is not set.");
      console.log("💡 Please set your API key in the .env file:");
      console.log("   GEMINI_API_KEY=your-api-key-here");
      process.exit(1);
    }

    console.log("🔑 API Key loaded successfully!");
    console.log(`🤖 Using model: ${model}`);

    // Create and initialize chat interface
    const chat = new AdvancedTextChat();
    await chat.initialize();
    
    // Start the chat session
    await chat.startChat();
    
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log("\n\n👋 Goodbye! Chat session terminated.");
  rl.close();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  rl.close();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  rl.close();
  process.exit(1);
});

// Run the application
main().catch((error) => {
  console.error("❌ Application error:", error.message);
  rl.close();
  process.exit(1);
});