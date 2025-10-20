export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  suggestions?: string[];
  imageUrl?: string;
}
