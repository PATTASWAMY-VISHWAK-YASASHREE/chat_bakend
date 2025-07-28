# AI Chat Interface with Firebase Integration

A conversational AI chat interface using Google's Generative AI API with Firebase Storage and Firestore integration for persistent conversation management.

## Features

- 🤖 **Interactive Text Chat**: Real-time conversation with AI
- � **Firebase Integration**: Automatic saving to Firebase Storage & Firestore
- 💬 **Persistent History**: All conversations stored in Firebase with session management
- 🔧 **Built-in Commands**: Special commands for enhanced functionality
- � **File Upload**: Upload and analyze files (audio, images, documents) via Firebase
- 💾 **Cross-Session Access**: View conversations from previous sessions
- 🎯 **Advanced NLP**: Powered by Google's Gemini AI model
- 📊 **Session Tracking**: Complete metadata and analytics in Firestore

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure API Key**:
   - Copy `.env.example` to `.env`
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Replace `your-api-key-here` with your actual API key in the `.env` file

3. **Firebase Setup**:
   - The app uses Firebase service account keys from `../vectorsdk/keys/`
   - Ensure your Firebase project has Storage and Firestore enabled
   - Service account needs permissions for Storage and Firestore

4. **Run the Chat Interface**:
   ```bash
   npm run firebase-chat
   # or
   npm run chat
   # or
   node index.js
   ```

## Available Commands

- `/help` - Show available commands
- `/history` - Display current session conversation history
- `/clear` - Clear current session history
- `/firebase` - Show Firebase session information
- `/recent` - Load and display recent conversations from Firebase
- `/upload <file_path>` - Upload file to Firebase and analyze with AI
- `/save` - Export current conversation to local JSON file
- `/model` - Show current AI model information
- `exit`, `quit`, `bye` - End the chat session

## Firebase Integration Features

### 🔥 **Automatic Storage**
- Every message automatically saved to Firebase Storage as JSON
- Organized by session ID for easy retrieval
- Persistent URLs for each conversation

### 📊 **Session Management**
- Each chat session gets unique ID and Firestore document
- Complete session metadata (start time, model, message count)
- Cross-session conversation history

### 📁 **File Upload & Analysis**
- Upload files directly to Firebase Storage
- AI analysis of uploaded files (audio, images, documents)
- Persistent file storage with download URLs

## Usage Examples

```
💬 You: Hello, how are you?
🤖 Assistant: Hello! I'm doing great, thank you for asking! I'm here and ready to help you with any questions or tasks you might have. How are you doing today?
� Message saved to Firebase: https://storage.googleapis.com/...

💬 You: /upload audio.mp3
📤 Uploading file to Firebase...
✅ File uploaded successfully!
🤖 Assistant: I can hear a beautiful piano melody in this audio file...

💬 You: /recent
� Recent Firebase Conversations:
Session: chat_1753694785040_37vz0zmq6 (3 messages)
Last activity: 2025-01-28 10:30:15

💬 You: /firebase
🔥 Firebase Session Info:
Session ID: chat_1753694785040_37vz0zmq6
Firestore Doc: GurWdrFyBeoTunU9TM7m
Project: test-edc8c
```

## File Structure

- `index.js` - Main Firebase-integrated chat interface
- `test.js` - Simple local chat interface (no Firebase)
- `chat.js` - Express server for API endpoints
- `package.json` - Project configuration and dependencies
- `.env` - Environment variables (API keys)
- `../vectorsdk/keys/` - Firebase service account keys

## Firebase Architecture

### Storage Structure
```
chat_messages/
  └── {sessionId}/
      ├── msg_123456_abc.json
      ├── msg_123457_def.json
      └── ...

chat_files/
  └── {sessionId}/
      ├── 1653123456_audio.mp3
      ├── 1653123457_image.jpg
      └── ...
```

### Firestore Collections
```
chat_sessions/
  └── {documentId}
      ├── sessionId: "chat_1653123456_abc"
      ├── startTime: "2025-01-28T10:30:15.000Z"
      ├── model: "gemini-1.5-flash"
      ├── messages: [...] 
      ├── messageCount: 5
      └── status: "active"
```

## Configuration

The chat interface uses the following default settings:
- **Model**: `gemini-1.5-flash`
- **Temperature**: 0.7 (controls randomness)
- **Max Tokens**: 1024 (response length limit)
- **System Instruction**: Friendly, conversational assistant
- **Firebase Project**: `test-edc8c`

You can modify these settings in the `config` object within `index.js`.

## Error Handling

The application includes comprehensive error handling for:
- Missing API keys
- Firebase authentication errors
- Network connectivity issues
- Invalid user input
- API rate limits
- File system operations
- Firebase Storage/Firestore operations

## Security Features

- ✅ **Service Account Authentication**: Uses Firebase Admin SDK with service account keys
- ✅ **Secure File Storage**: Files stored in Firebase Storage with signed URLs
- ✅ **Environment Variables**: API keys stored securely in `.env` file
- ✅ **Session Isolation**: Each chat session is isolated with unique IDs
