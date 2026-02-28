export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationContext {
  sessionId: string;
  step: number;
  messages: ChatMessage[];
  initialReaction?: string;
  factReaction?: string;
  perspectiveReaction?: string;
}
