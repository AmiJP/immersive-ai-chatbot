"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface ConsultationData {
  category: 'medical' | 'legal' | 'other';
  language: string;
  urgency: 'low' | 'medium' | 'high';
  summary: string;
  timestamp: number;
}

export default function ConsultationFormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [consultationType, setConsultationType] = useState<'video' | 'home'>('video');
  const [category, setCategory] = useState<'medical' | 'legal' | 'other'>('other');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [address, setAddress] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const user = getCurrentUser();
    
    if (!user) {
      // Redirect to home if not authenticated
      router.push('/');
      return;
    }
    
    // Try to load saved consultation data from localStorage
    if (typeof window !== 'undefined') {
      const savedData = window.localStorage.getItem('consultationData');
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData) as ConsultationData;
          setCategory(parsedData.category || 'other');
          setLanguage(parsedData.language || 'English');
          setUrgency(parsedData.urgency || 'medium');
          setSummary(parsedData.summary || '');
        } catch (e) {
          console.error('Error parsing saved consultation data:', e);
        }
      }
    }
    
    setIsLoading(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const user = getCurrentUser();
      
      if (!user) {
        setError('You must be signed in to submit a consultation request.');
        return;
      }
      
      // Validate required fields
      if (consultationType === 'home' && !address) {
        setError('Address is required for at-home consultations.');
        setIsSubmitting(false);
        return;
      }
      
      // Create consultation request in Firestore
      const consultationData = {
        userId: user.uid,
        userEmail: user.email,
        consultationType,
        category,
        country,
        language,
        urgency,
        address: consultationType === 'home' ? address : null,
        summary,
        status: 'pending',
        createdAt: new Date().toISOString() // Use ISO string for better compatibility
      };
      
      try {
        // Add to Firestore using the collection name you created
        const docRef = await addDoc(collection(db, 'chat-bot-consulation'), consultationData);
        console.log('Document written with ID: ', docRef.id);
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        // If Firestore fails, store in localStorage as fallback
        if (typeof window !== 'undefined') {
          const storedRequests = JSON.parse(localStorage.getItem('consultationRequests') || '[]');
          storedRequests.push({
            ...consultationData,
            id: `local-${Date.now()}`,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('consultationRequests', JSON.stringify(storedRequests));
          console.log('Saved to localStorage as fallback');
        }
      }
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('consultationData');
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting consultation request:', error);
      setError('Failed to submit consultation request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
          <div className="inline-block rounded-full h-16 w-16 bg-green-100 text-green-500 flex items-center justify-center mb-6">
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">Consultation Request Submitted!</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Thank you for your request. An expert will review your information and contact you soon.
          </p>
          <Button onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Consultation Request</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Consultation Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Consultation Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="consultationType"
                  checked={consultationType === 'video'}
                  onChange={() => setConsultationType('video')}
                  className="mr-2"
                />
                Video Call
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="consultationType"
                  checked={consultationType === 'home'}
                  onChange={() => setConsultationType('home')}
                  className="mr-2"
                />
                At Home
              </label>
            </div>
          </div>
          
          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'medical' | 'legal' | 'other')}
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-700"
              required
            >
              <option value="medical">Medical</option>
              <option value="legal">Legal</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {/* Country */}
          <div>
            <label className="block text-sm font-medium mb-2">Your Country</label>
            <Input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Enter your country"
              required
            />
          </div>
          
          {/* Language */}
          <div>
            <label className="block text-sm font-medium mb-2">Preferred Language</label>
            <Input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Enter your preferred language"
              required
            />
          </div>
          
          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium mb-2">Urgency Level</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-700"
              required
            >
              <option value="low">Low - Can wait a few days</option>
              <option value="medium">Medium - Need help within 24 hours</option>
              <option value="high">High - Urgent assistance needed</option>
            </select>
          </div>
          
          {/* Address (only for at-home consultations) */}
          {consultationType === 'home' && (
            <div>
              <label className="block text-sm font-medium mb-2">Your Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your full address"
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 min-h-[80px]"
                required
              />
            </div>
          )}
          
          {/* Summary */}
          <div>
            <label className="block text-sm font-medium mb-2">Request Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Briefly describe what you need help with"
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 min-h-[120px]"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Consultation Request'}
          </Button>
        </form>
      </div>
    </div>
  );
}
