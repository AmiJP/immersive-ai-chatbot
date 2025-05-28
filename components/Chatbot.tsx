"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LuBot, LuBotMessageSquare } from "react-icons/lu";
import { FiX, FiUser } from "react-icons/fi";
import { MdDoneAll } from "react-icons/md";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import ConsultationRequest from "./ConsultationRequest";

interface Message {
  sender: "user" | "bot";
  text: string;
  status?: "sent" | "received" | "read";
  timestamp?: number;
  metadata?: {
    isMedicalRequest?: boolean;
    isLegalRequest?: boolean;
    detectedLanguage?: string;
    urgency?: 'low' | 'medium' | 'high';
  };
}

// Function to format bot messages with markdown-like formatting
const formatBotMessage = (text: string) => {
  if (!text) return '';
  
  // Process the text to handle formatting
  let formattedText = text;
  
  // First, escape any HTML to prevent XSS
  formattedText = formattedText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Replace markdown-style bold with HTML bold
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
  
  // Replace markdown-style italic with HTML italic
  formattedText = formattedText.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  
  // Convert bullet lists to proper HTML lists
  // First identify bullet list sections
  const bulletListPattern = /((?:\* .*?(?:\n|$))+)/g;
  formattedText = formattedText.replace(bulletListPattern, (match) => {
    // Convert each bullet point to a list item
    const listItems = match.split('\n')
      .filter(line => line.trim().startsWith('*'))
      .map(line => {
        const content = line.replace(/^\* /, '');
        return `<li class="ml-5 mb-1">${content}</li>`;
      })
      .join('');
    
    return `<ul class="my-2">${listItems}</ul>`;
  });
  
  // Replace double newlines with paragraph breaks
  formattedText = formattedText.replace(/\n\n/g, '</p><p class="my-2">');
  
  // Replace single newlines with line breaks
  formattedText = formattedText.replace(/\n/g, '<br />');
  
  // Wrap the content in a paragraph tag
  formattedText = '<p class="my-2">' + formattedText + '</p>';
  
  // Create a div to render the HTML
  return <div className="formatted-message text-left" dangerouslySetInnerHTML={{ __html: formattedText }} />;
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "Hi! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);
  const [consultationData, setConsultationData] = useState<{
    category: 'medical' | 'legal' | 'other';
    language: string;
    urgency: 'low' | 'medium' | 'high';
    summary: string;
  }>({ 
    category: 'other', 
    language: 'English', 
    urgency: 'medium', 
    summary: '' 
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);



  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  // Simulate marking user messages as 'read' after a delay
  useEffect(() => {
    const lastUserIdx = [...messages].reverse().findIndex(m => m.sender === "user" && m.status !== "read");
    if (lastUserIdx !== -1) {
      const idx = messages.length - 1 - lastUserIdx;
      const timer = setTimeout(() => {
        setMessages(msgs => msgs.map((m, i) => i === idx ? { ...m, status: "read" } : m));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Create user message
    const userMessage: Message = { 
      sender: "user", 
      text: input, 
      status: "sent",
      timestamp: Date.now() 
    };
    
    // Add to UI immediately
    setMessages((msgs) => [...msgs, userMessage]);
    setInput("");
    
    // Simulate bot typing
    setBotTyping(true);
    
    // Update message status to received
    setTimeout(() => {
      setMessages((msgs) => {
        const updatedMsgs = msgs.map((m, i) =>
          i === msgs.length - 1 && m.sender === "user" && m.status === "sent"
            ? { ...m, status: "received" as "received" }
            : m
        );
        return updatedMsgs;
      });
    }, 500);
    
    try {
      // Get previous messages for context - format them properly for the AI
      const conversationHistory = messages.slice(-5).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      // Add the current message to the conversation history
      conversationHistory.push({
        role: 'user',
        content: input
      });
      
      // Call the message router API
      const response = await fetch('/api/agents/router', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversation: conversationHistory,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process message');
      }
      
      const result = await response.json();
      
      // Get the response text from the main agent
      let botResponseText = result.response;
      
      // Check if this is a medical or legal request
      const isMedicalRequest = result.isMedicalRequest || false;
      const isLegalRequest = result.isLegalRequest || false;
      const detectedLanguage = result.detectedLanguage || 'English';
      
      // If medical or legal request, show consultation option
      if (isMedicalRequest || isLegalRequest) {
        setShowConsultation(true);
        setConsultationData({
          category: isMedicalRequest ? 'medical' : isLegalRequest ? 'legal' : 'other',
          language: detectedLanguage,
          urgency: 'medium',
          summary: input
        });
      }
      
      // Add bot message to UI
      const botMessage: Message = { 
        sender: "bot", 
        text: botResponseText,
        timestamp: Date.now(),
        metadata: {
          isMedicalRequest,
          isLegalRequest,
          detectedLanguage
        }
      };
      
      setMessages((msgs) => [...msgs, botMessage]);
      
      // Update user message status to read
      setTimeout(() => {
        setMessages((msgs) => {
          return msgs.map((m) =>
            m.sender === "user" && m.status === "received"
              ? { ...m, status: "read" as "read" }
              : m
          );
        });
      }, 500);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message to UI
      const errorMessage: Message = { 
        sender: "bot", 
        text: "I'm sorry, but I encountered an error processing your message. Please try again later.",
        timestamp: Date.now() 
      };
      
      setMessages((msgs) => [...msgs, errorMessage]);
    } finally {
      setBotTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          className="rounded-full shadow-lg size-14 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setOpen(!open)}
        >
          <LuBotMessageSquare className="w-16 h-16" />
        </Button>
      </div>
      {/* Chat Popup */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[28rem] max-w-[98vw] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col animate-chat-popup"
          style={{ minHeight: 560 }}
        >

          <div className="border-b px-6 py-3 bg-primary text-primary-foreground rounded-t-2xl flex items-center justify-between">
            <span className="font-semibold">Chatbot</span>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 rounded-full transition-colors focus:outline-none"
              aria-label="Close chat"
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="flex flex-col h-[28rem] px-6 py-4 gap-2 overflow-y-auto bg-background">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div className="flex flex-row items-end gap-2">
                  {msg.sender === "bot" && (
                    <>
                      <Avatar className="size-7 mb-0.5">
                        <span className="bg-primary text-white w-full h-full flex items-center justify-center rounded-full">
                          <LuBot size={20} />
                        </span>
                      </Avatar>
                      <div className="rounded-tl-lg rounded-tr-lg rounded-bl-none rounded-br-lg px-4 py-3 max-w-xs sm:max-w-md md:max-w-lg text-sm bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 overflow-auto">
                        {formatBotMessage(msg.text)}
                      </div>
                    </>
                  )}
                  {msg.sender === "user" && (
                    <>
                      <div className="rounded-tl-lg rounded-tr-lg rounded-br-none rounded-bl-lg px-3 py-2 max-w-xs text-sm bg-primary text-primary-foreground flex items-end gap-1 flex-wrap break-words">
                        <span className="break-all whitespace-pre-line">{msg.text}</span>
                        <MdDoneAll size={16} className={`ml-auto ${msg.status === "read" ? "text-blue-500" : "text-zinc-300 dark:text-zinc-500"}`} />
                      </div>
                      <Avatar className="size-7 mb-0.5">
                        <span className="bg-secondary text-secondary-foreground w-full h-full flex items-center justify-center rounded-full">
                          <FiUser size={18} />
                        </span>
                      </Avatar>
                    </>
                  )}
                </div>

              </div>
            ))}
            
            {/* Show consultation request form if needed */}
            {showConsultation && (
              <div className="w-full mt-2">
                <ConsultationRequest 
                  category={consultationData.category}
                  language={consultationData.language}
                  urgency={consultationData.urgency}
                  summary={consultationData.summary}
                />
              </div>
            )}
            {/* Bot typing indicator */}
            {botTyping && (
              <div className="flex items-end gap-2 justify-start">
                <Avatar className="size-7">
                  <span className="bg-primary text-white w-full h-full flex items-center justify-center rounded-full">
                    <LuBot size={20} />
                  </span>
                </Avatar>
                <div className="rounded-lg px-3 py-2 max-w-xs text-sm bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center min-h-[32px]">
                  <span className="whatsapp-typing-dots">
                    <span></span><span></span><span></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-center gap-2 border-t px-4 py-3 bg-background rounded-b-2xl">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 focus-visible:ring-1 focus-visible:ring-offset-0 border-zinc-300 dark:border-zinc-700"
              autoFocus
            />
            <Button onClick={handleSend} variant="default" className="h-10 px-4">
              Send
            </Button>
          </div>
        </div>
      )}
      {/* Chat Popup End */}
      <style jsx global>{`
        @keyframes chat-popup {
          0% { transform: translateY(40px) scale(0.98); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-chat-popup {
          animation: chat-popup 0.25s cubic-bezier(0.33,1,0.68,1);
        }
        .whatsapp-typing-dots {
          display: inline-flex;
          align-items: center;
          height: 1.2em;
          gap: 2px;
        }
        .whatsapp-typing-dots span {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin: 0 1px;
          border-radius: 50%;
          background: #a3a3a3;
          opacity: 0.7;
          animation: whatsapp-typing-bounce 1.2s infinite both;
        }
        .whatsapp-typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .whatsapp-typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes whatsapp-typing-bounce {
          0%, 80%, 100% {
            transform: scale(0.7);
            opacity: 0.7;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        /* Formatted message styles */
        .formatted-message p {
          margin-bottom: 0.5rem;
        }
        .formatted-message strong {
          font-weight: 600;
        }
        .formatted-message em {
          font-style: italic;
        }
        .formatted-message ul {
          margin-left: 1rem;
          margin-bottom: 0.5rem;
        }
        .formatted-message li {
          margin-bottom: 0.25rem;
        }
      `}</style>
    </>
  );
}
