
import React, { useState, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  language: string;
  onSuggestionClick: (suggestionText: string, messageId: string) => void;
  onClarificationRequest: (messageId: string) => void;
}

const UserIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
        U
    </div>
);

const BotIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h1a1 1 0 011 1v3.5a1.5 1.5 0 01-3 0V9a1 1 0 00-1-1h-1a1 1 0 01-1-1V3.5zM6.5 15.5a1.5 1.5 0 013 0V16a1 1 0 001 1h1a1 1 0 011 1v3.5a1.5 1.5 0 01-3 0V20a1 1 0 00-1-1h-1a1 1 0 01-1-1v-3.5z" />
            <path d="M4 9.5a1.5 1.5 0 013 0V10a1 1 0 001 1h1a1 1 0 011 1v3.5a1.5 1.5 0 01-3 0V14a1 1 0 00-1-1h-1a1 1 0 01-1-1V9.5z" />
            <path d="M16.5 3.5a1.5 1.5 0 010 3h-3.5a1.5 1.5 0 010-3h3.5z" />
        </svg>
    </div>
);

const SpeakerIcon: React.FC<{ isSpeaking: boolean }> = ({ isSpeaking }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isSpeaking ? 'text-blue-400 animate-pulse' : 'currentColor'}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9 9 0 0119 10a9 9 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7 7 0 0017 10a7 7 0 00-2.343-5.657 1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5 5 0 0115 10a5 5 0 01-1.757 3.536 1 1 0 01-1.415-1.415A3 3 0 0013 10a3 3 0 00-1.172-2.424 1 1 0 010-1.415z" clipRule="evenodd" />
    </svg>
);


const ChatMessage: React.FC<ChatMessageProps> = ({ message, language, onSuggestionClick, onClarificationRequest }) => {
  const isUser = message.sender === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.lang = language;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;

    return () => {
        speechSynthesis.cancel();
    }
  }, [message.text, language]);

  const handleSpeak = () => {
    if (isSpeaking) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
    } else {
        speechSynthesis.cancel();
        if (utteranceRef.current) {
            speechSynthesis.speak(utteranceRef.current);
        }
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <BotIcon />}
            <div
                className={`rounded-lg p-3 max-w-lg break-words group relative font-mono ${
                isUser
                    ? 'bg-green-600 rounded-br-none text-white'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
            >
                {message.imageUrl && (
                    <div className="mb-2 border-b border-gray-300 pb-2">
                        <img 
                            src={message.imageUrl} 
                            alt="Generated Diagram" 
                            className="rounded-md max-w-full h-auto bg-white" 
                        />
                    </div>
                )}
                <p className="whitespace-pre-wrap">{message.text}</p>
                {!isUser && message.id !== 'initial-bot-message' && !message.id.startsWith('system-') && (
                    <button 
                        onClick={handleSpeak} 
                        className="absolute -bottom-3 -right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                        aria-label={isSpeaking ? 'Stop speaking' : 'Read message aloud'}
                    >
                        <SpeakerIcon isSpeaking={isSpeaking}/>
                    </button>
                )}
            </div>
            {isUser && <UserIcon />}
        </div>
        {!isUser && message.suggestions && (
            <div className="flex flex-wrap gap-2 ml-11 mt-2 items-center">
                {message.suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onSuggestionClick(suggestion, message.id)}
                        className="px-3 py-1 text-sm rounded-full transition-colors font-mono bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        {suggestion}
                    </button>
                ))}
                <button
                    onClick={() => onClarificationRequest(message.id)}
                    className="px-3 py-1 text-sm rounded-full transition-colors flex items-center gap-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200"
                    title="Get a different explanation for this response"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline font-sans">Unclear? Ask for a new explanation</span>
                </button>
            </div>
        )}
    </div>
  );
};

export default ChatMessage;
