"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMagicLink } from '@/lib/auth';

interface ConsultationRequestProps {
  category: 'medical' | 'legal' | 'other';
  language: string;
  urgency: 'low' | 'medium' | 'high';
  summary: string;
}

export default function ConsultationRequest({ 
  category, 
  language, 
  urgency, 
  summary 
}: ConsultationRequestProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setStatus('sending');
    
    try {
      // Store consultation data in localStorage to retrieve after authentication
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('consultationData', JSON.stringify({
          category,
          language,
          urgency,
          summary,
          timestamp: Date.now()
        }));
      }
      
      // Send magic link
      const result = await sendMagicLink(email);
      
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage('Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending magic link:', error);
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700 mt-4">
      <h3 className="text-lg font-medium mb-2">Connect with an Expert</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        We'll connect you with a {category} expert who can help with your request.
        Enter your email to receive a secure link.
      </p>
      
      {status === 'idle' || status === 'error' ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="w-full"
              required
            />
            {errorMessage && (
              <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Sending...' : 'Get Secure Link'}
          </Button>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            We'll send you a secure link to complete your consultation request.
            No password required.
          </p>
        </form>
      ) : status === 'sending' ? (
        <div className="text-center py-4">
          <p>Sending secure link...</p>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-green-600 dark:text-green-400 font-medium mb-2">
            ✓ Secure link sent!
          </p>
          <p className="text-sm">
            We've sent a secure link to <strong>{email}</strong>. 
            Please check your email and click the link to continue.
          </p>
        </div>
      )}
    </div>
  );
}
