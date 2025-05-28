# AI Chatbot with Expert Consultation System

A Next.js application featuring an AI-powered chatbot that can detect medical and legal queries, maintain conversation context, and redirect users to expert consultations using passwordless authentication.

## Features

- Interactive chatbot with context-aware conversations
- Medical and legal topic detection
- Language detection and multilingual support
- Markdown-style formatting for bot messages
- Passwordless authentication via email magic links
- Expert consultation request system
- Firebase integration for user authentication and data storage

## Setup Instructions

### Prerequisites

1. **Node.js Installation**
   - Download and install Node.js (v18 or later) from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **PNPM Package Manager**
   - Install PNPM globally: `npm install -g pnpm`
   - Verify installation: `pnpm --version`

3. **Firebase Account**
   - Create a [Firebase account](https://firebase.google.com/) if you don't have one
   - Create a new Firebase project
   - Enable Authentication with Email/Password provider and Email link sign-in method
   - Create a Firestore database

### Project Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd chat-bot-app
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**
   - Create or update `.env.local` file with your Firebase and Google API credentials:
   ```
   # Firebase config
   NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
   
   # Google Gemini API
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Configure Firebase Security Rules**
   - Go to Firebase Console > Firestore Database > Rules
   - Copy the contents of `firestore.rules` from this project
   - Paste and publish the rules

5. **Run the Development Server**
   ```bash
   pnpm dev
   ```

6. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/app` - Next.js application routes and API endpoints
  - `/api/agents/router` - Message routing API for chatbot
  - `/auth/verify` - Email verification page
  - `/consultation/form` - Consultation request form

- `/components` - React components
  - `Chatbot.tsx` - Main chatbot component
  - `ConsultationRequest.tsx` - Expert consultation request form

- `/lib` - Utility functions and services
  - `firebase.ts` - Firebase configuration
  - `auth.ts` - Authentication service

## How It Works

1. **Chatbot Interaction**:
   - User sends a message to the chatbot
   - The message is analyzed by the router API to detect:
     - Language (for multilingual support)
     - Medical topics
     - Legal topics
   - The chatbot responds with contextually relevant information

2. **Expert Consultation**:
   - When medical or legal topics are detected, the consultation request form appears
   - User enters their email to receive a magic link
   - After clicking the link, they complete a detailed consultation form
   - Form data is stored in Firebase Firestore

## API Keys and Security

- **Never commit real API keys to version control**
- Store all sensitive keys in `.env.local` which is gitignored
- For production, use environment variables in your hosting platform

## Troubleshooting

- **Firebase Authentication Issues**:
  - Ensure Email/Password provider is enabled
  - Verify that Email link sign-in method is activated
  - Add your domain to the authorized domains list in Firebase Console

- **Firestore Permission Errors**:
  - Check that your security rules match the ones in `firestore.rules`
  - Verify that users are properly authenticated before database operations

## License

MIT
