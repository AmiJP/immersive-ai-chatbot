/**
 * Message router API endpoint
 * Routes messages to appropriate agents based on content analysis
 */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, FunctionCallingConfigMode, FunctionDeclaration, Type } from '@google/genai';

const ai = new GoogleGenAI({apiKey: 'AIzaSyBBeAstnUAEsseCitjgf41waum-l8spEvk'});

// Helper function to extract valid JSON from a string that might contain extra text
function extractJsonFromString(str: string, defaultJson: any): any {
    if (!str) return defaultJson;
    
    try { 
        // First try direct parsing
        return JSON.parse(str);
    } catch (e) {
        try {
            // Look for JSON-like pattern with regex
            const jsonPattern = /{[\s\S]*}/;
            const match = str.match(jsonPattern);
            if (match && match[0]) {
                return JSON.parse(match[0]);
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
        return defaultJson;
    }
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { message, conversation } = body;

    // Determine user language by calling language agent
    const translationResult = await translationAgent(message);
    console.log('Translation Result: ', translationResult);

    // Determine if message is medical or legal
    const medicalResult = await medicalAgent(message);
    console.log('Medical Result: ', medicalResult);
    const legalResult = await legalAgent(message);
    console.log('Legal Result: ', legalResult);

    // Call main agent with the properly formatted conversation history
    const mainAgentResult = await mainAgent(
        message, 
        conversation, 
        translationResult.detectedLanguage, 
        medicalResult.isMedicalRequest, 
        legalResult.isLegalRequest
    );
    console.log('Main Agent Result: ', mainAgentResult);

    // Return the response with all the metadata
    return NextResponse.json({
        ...mainAgentResult,
        detectedLanguage: translationResult.detectedLanguage,
        isMedicalRequest: medicalResult.isMedicalRequest,
        isLegalRequest: legalResult.isLegalRequest
    });
}

interface TranslationResult {
    isEnglish: boolean;
    detectedLanguage: string;
    confidence: number;
}

async function translationAgent(message: string): Promise<TranslationResult> {
    const response = ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: JSON.stringify({
            system: `You are a language detection agent. Your task is to detect the language of the message and give the result in json format.
            Example: {"isEnglish": true, "detectedLanguage": "English", "confidence": 1}`,
            currentMessage: message,
        }),
      });

      const result = (await response).text || '';
      console.log('Raw translation result:', result);
      
      const defaultJson = {"isEnglish": true, "detectedLanguage": "English", "confidence": 1, "failed": true};
      const jsonResult = extractJsonFromString(result, defaultJson);

      return {
        isEnglish: jsonResult.isEnglish,
        detectedLanguage: jsonResult.detectedLanguage,
        confidence: jsonResult.confidence,
      };
}

interface MedicalResult {
    isMedicalRequest: boolean;
}

async function medicalAgent(message: string): Promise<MedicalResult> {
    const response = ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: JSON.stringify({
            system: `You are a medical agent. Your task is to determine if the message is related to medical topics or not and give the result in json format.
            Example: {"isMedicalRequest": true}`,
            currentMessage: message,
        }),
      });

      const result = (await response).text || '';
      console.log('Raw medical result:', result);
      
      const defaultJson = {"isMedicalRequest": false, "failed": true};
      const jsonResult = extractJsonFromString(result, defaultJson);

      return {
        isMedicalRequest: jsonResult.isMedicalRequest || false,
      }
}

interface LegalResult {
    isLegalRequest: boolean;
}

async function legalAgent(message: string): Promise<LegalResult> {
    const response = ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: JSON.stringify({
            system: `You are a legal agent. Your task is to determine if the message is related to legal topics or not and give the result in json format.
            Example: {"isLegalRequest": true}`,
            currentMessage: message,
        }),
      });

      const result = (await response).text || '';
      console.log('Raw legal result:', result);
      
      const defaultJson = {"isLegalRequest": false, "failed": true};
      const jsonResult = extractJsonFromString(result, defaultJson);

      return {
        isLegalRequest: jsonResult.isLegalRequest || false,
      }
}

interface MainAgentResult {
    response: string;
}

interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

async function mainAgent(message: string, pastMessages: ConversationMessage[], language: string, isMedicalRequest: boolean, isLegalRequest: boolean): Promise<MainAgentResult> {
    
    const prompt = `You are a website chatbot. Your task is to respond to the message and determine the user need and return the response or ask for more details.
    Always answer in ${language} language. Please focus on the user need which is ${isMedicalRequest ? 'medical related help' : isLegalRequest ? 'legal related help' : 'general help'}.
    Always maintain context from the previous messages in the conversation.
    Always answer in json format.
    Example: {"response": "Hello! How can I help you today?"}`;
    
    console.log('Conversation history:', JSON.stringify(pastMessages));
    
    const response = ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: JSON.stringify({
            system: prompt,
            conversation: pastMessages,
        }),
      });

      const result = (await response).text || '';
      console.log('Raw main agent result:', result);
      
      const defaultJson = {"response": "Something went wrong. Please ask again.", "failed": true};
      const jsonResult = extractJsonFromString(result, defaultJson);

      return {
        response: jsonResult.response,
      };
}
