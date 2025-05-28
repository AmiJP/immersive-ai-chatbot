"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInLink, signInWithLink } from '@/lib/auth';

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'error' | 'success'>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmailLink = async () => {
      // Check if this is a sign-in link
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.href;
        
        if (isSignInLink(currentUrl)) {
          // Get the email from localStorage that was saved during sendSignInLinkToEmail
          let email = window.localStorage.getItem('emailForSignIn');
          
          if (!email) {
            // If missing email, prompt the user for it
            email = window.prompt('Please provide your email for confirmation');
          }
          
          if (email) {
            try {
              const result = await signInWithLink(email, currentUrl);
              
              if (result.success) {
                setStatus('success');
                // Redirect to consultation form after a short delay
                setTimeout(() => {
                  router.push('/consultation/form');
                }, 2000);
              } else {
                setStatus('error');
                setErrorMessage('Failed to verify your email. Please try again.');
              }
            } catch (error) {
              console.error('Error signing in with email link:', error);
              setStatus('error');
              setErrorMessage('An error occurred during verification. Please try again.');
            }
          } else {
            setStatus('error');
            setErrorMessage('No email provided for verification.');
          }
        } else {
          setStatus('error');
          setErrorMessage('Invalid verification link.');
        }
      }
    };

    verifyEmailLink();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Email Verification</h1>
        
        {status === 'checking' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mb-4"></div>
            <p>Verifying your email...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="inline-block rounded-full h-12 w-12 bg-red-100 text-red-500 flex items-center justify-center mb-4">
              <span className="text-xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{errorMessage}</p>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <div className="inline-block rounded-full h-12 w-12 bg-green-100 text-green-500 flex items-center justify-center mb-4">
              <span className="text-xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Verification Successful!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your email has been verified. Redirecting you to the consultation form...
            </p>
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        )}
      </div>
    </div>
  );
}
