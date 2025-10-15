
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';

// TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onstart: () => void;
    onend: () => void;
    onerror: (event: any) => void;
    onresult: (event: any) => void;
    start(): void;
    stop(): void;
    abort(): void;
}


interface ChatWindowProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string, language: string) => void;
  isLoading: boolean;
  selectedLanguage: string;
  onSuggestionClick: (suggestionText: string, messageId: string) => void;
  onClarificationRequest: (messageId: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
    messages, 
    onSendMessage, 
    isLoading,
    selectedLanguage,
    onSuggestionClick,
    onClarificationRequest,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
        recognitionRef.current?.abort();
    };
  }, []);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input, selectedLanguage);
      setInput('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  const handleListen = () => {
    if (isListening) {
        recognitionRef.current?.stop();
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Sorry, your browser doesn't support speech recognition.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
    };
    recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
    };
    recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map(result => result.transcript)
            .join('');
        setInput(transcript);
    };

    recognition.start();
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            language={selectedLanguage}
            onSuggestionClick={onSuggestionClick}
            onClarificationRequest={onClarificationRequest}
          />
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
             <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h1a1 1 0 011 1v3.5a1.5 1.5 0 01-3 0V9a1 1 0 00-1-1h-1a1 1 0 01-1-1V3.5zM6.5 15.5a1.5 1.5 0 013 0V16a1 1 0 001 1h1a1 1 0 011 1v3.5a1.5 1.5 0 01-3 0V20a1 1 0 00-1-1h-1a1 1 0 01-1-1v-3.5z" />
                    <path d="M4 9.5a1.5 1.5 0 013 0V10a1 1 0 001 1h1a1 1 0 011 1v3.5a1.5 1.5 0 01-3 0V14a1 1 0 00-1-1h-1a1 1 0 01-1-1V9.5z" />
                    <path d="M16.5 3.5a1.5 1.5 0 010 3h-3.5a1.5 1.5 0 010-3h3.5z" />
                </svg>
            </div>
            <div className="rounded-lg p-3 max-w-lg bg-gray-200 rounded-bl-none">
                <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
	                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
	                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 flex items-center gap-3">
        <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type or say something..."
              className="w-full border rounded-md py-2 pl-3 pr-10 focus:ring-2 focus:ring-green-500 focus:outline-none bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500"
              disabled={isLoading}
            />
            <button
              onClick={handleListen}
              disabled={isLoading}
              title={isListening ? 'Stop listening' : 'Start listening'}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isListening ? 'text-green-400 animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </button>
        </div>
        <button
          onClick={handleSend}
          className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;