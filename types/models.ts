// Centralized TypeScript types for chat, user, and consultation data

export type MessageStatus = "sent" | "received" | "read";

export interface ChatMessage {
  id?: string;
  sender: "user" | "bot";
  text: string;
  status?: MessageStatus; // Only for user messages
  timestamp?: number;
}

export interface UserSession {
  uid: string;
  email?: string;
  displayName?: string;
  country?: string;
  language?: string;
}

export type ConsultationType = "video" | "at_home";
export type ConsultationCategory = "medical" | "legal" | "other";

export interface ConsultationRequest {
  id?: string;
  userId: string;
  type: ConsultationType;
  category: ConsultationCategory;
  country: string;
  language: string;
  urgency: "low" | "medium" | "high";
  address?: string; // Only if at-home consultation
  summary: string;
  createdAt: number;
}
