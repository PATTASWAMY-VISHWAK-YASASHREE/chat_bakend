# AI Chat Interface with Firebase Integration

A comprehensive AI chat interface that integrates Google's Generative AI with Firebase Storage and Firestore for persistent data storage.

## 🎯 Features

### 🤖 AI Chat Capabilities
- **Google Generative AI**: Powered by Gemini 1.5 Flash
- **Conversational Context**: Maintains conversation history
- **Text-based Interface**: Real-time interactive chat
- **Custom Commands**: Built-in slash commands for enhanced functionality

### 🔥 Firebase Integration
- **Firebase Storage**: Stores conversation messages as JSON files
- **Firestore Database**: Manages session metadata and conversation indexes
- **File Upload**: Upload and analyze files (images, audio, documents)
- **Persistent History**: All conversations saved automatically
- **Cross-session Access**: View recent conversations across sessions

### 📁 File Analysis
- **File Upload**: Support for various file types
- **AI Analysis**: AI can analyze uploaded files
- **Storage**: Files stored securely in Firebase Storage
- **Metadata**: File information tracked in Firestore

## 🚀 Setup Instructions

### 1. Firebase Configuration

#### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Firestore Database** and **Storage**

#### B. Configure Security Rules

**Firestore Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to chat_sessions collection
    match /chat_sessions/{document} {
      allow read, write: if true; // For development - restrict in production
    }
  }
}
```

**Storage Rules** (`storage.rules`):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read/write access to chat_messages and chat_files
    match /chat_messages/{allPaths=**} {
      allow read, write: if true; // For development - restrict in production
    }
    match /chat_files/{allPaths=**} {
      allow read, write: if true; // For development - restrict in production
    }
  }
}
```

#### C. Deploy Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if not done)
firebase init

# Deploy rules
firebase deploy --only firestore:rules,storage
```

### 2. Environment Setup

#### A. API Keys
Update your `.env` file:
```env
# Google AI API Key
GEMINI_API_KEY=your-google-ai-api-key

# Firebase Configuration (optional - already in code)
FIREBASE_PROJECT_ID=utrack-e7640
```

#### B. Install Dependencies
```bash
npm install
```

### 3. Run the Application

```bash
# Start Firebase-integrated chat
npm run firebase-chat

# Or run directly
node index.js
```

## 🔧 Available Commands

### Basic Commands
- `/help` - Show all available commands
- `/history` - Display conversation history
- `/clear` - Clear conversation history
- `/save` - Save conversation to local file
- `/model` - Show current AI model information

### Firebase Commands
- `/firebase` - Show Firebase session information
- `/recent` - Display recent conversations from Firebase
- `/upload <file_path> [description]` - Upload file to Firebase Storage

### File Upload Examples
```bash
# Upload an image
/upload image.jpg Analyze this photo

# Upload audio file
/upload audio.mp3 Transcribe this audio

# Upload document
/upload document.pdf Summarize this document
```

## 📊 Data Structure

### Firestore Collections

#### `chat_sessions`
```json
{
  "sessionId": "chat_1234567890_abc123",
  "startTime": "2025-07-28T09:00:00.000Z",
  "endTime": "2025-07-28T09:30:00.000Z",
  "model": "gemini-1.5-flash",
  "status": "completed",
  "messageCount": 5,
  "lastMessage": "2025-07-28T09:25:00.000Z",
  "messages": [
    {
      "timestamp": "9:20:15 AM",
      "userInput": "Hello!",
      "assistantResponse": "Hi there! How can I help you?",
      "messageId": "msg_1234567890_abc12"
    }
  ]
}
```

### Firebase Storage Structure
```
/chat_messages/
  ├── chat_1234567890_abc123/
  │   ├── msg_1234567890_abc12.json
  │   └── msg_1234567891_def34.json
  └── chat_1234567890_xyz789/
      └── msg_1234567892_ghi56.json

/chat_files/
  ├── chat_1234567890_abc123/
  │   ├── 1234567890_image.jpg
  │   └── 1234567891_audio.mp3
  └── chat_1234567890_xyz789/
      └── 1234567892_document.pdf
```

## 🛠️ Development

### File Structure
```
node/
├── index.js              // Main Firebase-integrated chat
├── test.js               // Simple text chat (no Firebase)
├── chat.js               // Express server
├── firebase.js           // Firebase configuration
├── package.json          // Dependencies and scripts
├── .env                  // Environment variables
└── README.md            // This file
```

### Adding New Features

#### Custom Commands
Add new commands in the `AdvancedTextChat.handleCommand()` method:

```javascript
case '/mycustom':
  console.log("My custom command executed!");
  return true;
```

#### File Type Support
Extend the `getMimeType()` method for new file types:

```javascript
const mimeTypes = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.newext': 'application/newtype' // Add new types here
};
```

## 🔒 Security Considerations

### Production Firebase Rules
For production, replace the permissive rules with user authentication:

```javascript
// Firestore - authenticated users only
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chat_sessions/{document} {
      allow read, write: if request.auth != null;
    }
  }
}

// Storage - authenticated users only
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chat_messages/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### API Key Security
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Consider using Firebase Functions for server-side API calls

## 🐛 Troubleshooting

### Firebase Permission Errors
```
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions
```
**Solution**: Update Firebase Security Rules as shown above.

### API Key Issues
```
Error: GEMINI_API_KEY environment variable is not set
```
**Solution**: Ensure `.env` file contains your Google AI API key.

### Firebase Connection Issues
- Check internet connection
- Verify Firebase project configuration
- Ensure Firebase project has Firestore and Storage enabled

## 📈 Usage Analytics

The system tracks:
- Conversation sessions
- Message counts
- File uploads
- Session duration
- Recent activity

Access this data through:
- `/firebase` command for current session
- `/recent` command for recent sessions
- Firebase Console for detailed analytics

## 🎯 Next Steps

1. **Authentication**: Add Firebase Auth for user management
2. **Real-time**: Implement real-time chat with multiple users
3. **Voice**: Add speech-to-text and text-to-speech
4. **Mobile**: Create companion mobile app
5. **Analytics**: Advanced conversation analytics and insights
