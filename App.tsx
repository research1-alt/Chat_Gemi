import React, { useState, useCallback, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import SettingsPage from './components/SettingsPage';
import IntroPage from './components/IntroPage';
import { ChatMessage } from './types';
import { getChatbotResponse } from './services/geminiService';

const languageOptions = {
    'en-US': 'English',
    'hi-IN': 'Hindi (हिन्दी)',
    'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
    'ta-IN': 'Tamil (தமிழ்)',
    'kn-IN': 'Kannada (ಕನ್ನಡ)',
    'gu-IN': 'Gujarati (ગુજરાતી)',
};

const App: React.FC = () => {
  // --- State Initialization with Session & Local Storage ---
  const [view, setView] = useState<'intro' | 'settings' | 'chat'>(() => {
    const savedView = sessionStorage.getItem('app-view');
    return savedView ? JSON.parse(savedView) : 'intro';
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = sessionStorage.getItem('app-messages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  // Use localStorage for knowledge base persistence across sessions
  const [fileContent, setFileContent] = useState<string | null>(() => localStorage.getItem('app-fileContent'));
  const [fileName, setFileName] = useState<string | null>(() => localStorage.getItem('app-fileName'));
  const [language, setLanguage] = useState(() => {
    const savedLang = sessionStorage.getItem('app-language');
    return savedLang ? JSON.parse(savedLang) : 'en-US';
  });

  // --- Effect to Persist State ---
  useEffect(() => {
    // Persist session-specific state
    sessionStorage.setItem('app-view', JSON.stringify(view));
    sessionStorage.setItem('app-messages', JSON.stringify(messages));
    sessionStorage.setItem('app-language', JSON.stringify(language));

    // Persist knowledge base state across sessions
    if (fileName) localStorage.setItem('app-fileName', fileName);
    else localStorage.removeItem('app-fileName');
    if (fileContent) localStorage.setItem('app-fileContent', fileContent);
    else localStorage.removeItem('app-fileContent');
  }, [view, messages, language, fileName, fileContent]);


  const startChatSession = () => {
    if (messages.length === 0 || messages.every(m => m.id.startsWith('system-'))) {
        setMessages([{
            id: 'initial-bot-message',
            text: fileName 
                ? `Knowledge base "${fileName}" is loaded. How can I assist you with the provided documents?`
                : "Welcome to the Field Service Assistant. You can now ask questions.",
            sender: 'bot'
        }]);
    }
    setView('chat');
  };

  const handleFileProcessed = useCallback((name: string, content: string) => {
    setFileContent(content);
    setFileName(name);
  }, []);
  
  const handleFileCleared = useCallback(() => {
    setFileContent(null);
    setFileName(null);
  }, []);

  const handleFileError = useCallback((errorMessage: string) => {
    console.error(`File Error: ${errorMessage}`);
    const errorBotMessage: ChatMessage = {
      id: `system-error-${Date.now()}`,
      sender: 'bot',
      text: `An error occurred while processing your file: ${errorMessage}`,
    };
    setMessages(prev => [...prev, errorBotMessage]);
  }, []);

  const handleSendMessage = useCallback(async (messageText: string, lang: string) => {
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: 'user',
    };

    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      const { text: botResponseText, suggestions } = await getChatbotResponse(messageText, messages, fileContent, lang);
      const newBotMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: botResponseText,
        sender: 'bot',
        suggestions: suggestions,
      };
      setMessages(prevMessages => [...prevMessages, newBotMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: `bot-error-${Date.now()}`,
        text: "I'm sorry, I encountered an error. Please try again.",
        sender: 'bot',
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, fileContent]);
  
  const handleSuggestionClick = useCallback((suggestionText: string, messageId: string) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, suggestions: undefined } : msg
      )
    );
    handleSendMessage(suggestionText, language);
  }, [handleSendMessage, language]);

  const handleClarificationRequest = useCallback((messageId: string) => {
    const messageToClarify = messages.find(msg => msg.id === messageId);
    if (messageToClarify) {
      const clarificationPrompt = `That explanation was not clear enough. Can you rephrase the following response with more detail or a different approach?\n\nPREVIOUS RESPONSE:\n"${messageToClarify.text}"`;
      setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, suggestions: undefined } : msg
      ));
      handleSendMessage(clarificationPrompt, language);
    }
  }, [messages, handleSendMessage, language]);

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang);
  }, []);

  if (view === 'intro') {
    return <IntroPage onStart={() => setView('settings')} />;
  }

  if (view === 'settings') {
    return (
        <SettingsPage 
            onProceed={startChatSession}
            onBack={() => setView('intro')}
            languageOptions={languageOptions}
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
            currentFileName={fileName}
            onFileProcessed={handleFileProcessed}
            onFileCleared={handleFileCleared}
            onError={handleFileError}
            isLoading={isLoading}
        />
    );
  }

  return (
    <div className="h-screen w-screen bg-white flex flex-col font-sans text-gray-900">
      <header className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Service Engineer Assistant</h1>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
                {fileName && <span className="max-w-xs truncate" title={fileName}>Knowledge Base: {fileName}</span>}
                <span>Language: {languageOptions[language]}</span>
            </div>
            <button
              onClick={() => setView('settings')}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              &larr; Back to Setup
            </button>
        </div>
      </header>
      <div className="flex-1 flex flex-col min-h-0">
          <ChatWindow 
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              selectedLanguage={language}
              onSuggestionClick={handleSuggestionClick}
              onClarificationRequest={handleClarificationRequest}
          />
      </div>
    </div>
  );
};

export default App;