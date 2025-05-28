// Authentication service
import { auth } from './firebase';
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink 
} from 'firebase/auth';

// Email action settings
const actionCodeSettings = {
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be in the authorized domains list in the Firebase Console.
  url: typeof window !== 'undefined' ? `${window.location.origin}/auth/verify` : 'http://localhost:3000/auth/verify',
  // This must be true.
  handleCodeInApp: true
};

// Send sign-in link to email
export const sendMagicLink = async (email: string) => {
  try {
    // Store the email locally to remember the user when they return
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('emailForSignIn', email);
    }
    
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    return { success: true };
  } catch (error) {
    console.error('Error sending sign-in link to email:', error);
    return { success: false, error };
  }
};

// Check if the URL contains a sign-in link
export const isSignInLink = (url: string) => {
  return isSignInWithEmailLink(auth, url);
};

// Sign in with email link
export const signInWithLink = async (email: string, url: string) => {
  try {
    const result = await signInWithEmailLink(auth, email, url);
    // Clear email from storage
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('emailForSignIn');
    }
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Error signing in with email link:', error);
    return { success: false, error };
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Sign out
export const signOut = async () => {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
};
