
import React, { useState, useCallback, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import IntroPage from './components/IntroPage';
import AuthPage from './components/AuthPage';
import { ChatMessage } from './types';
import { getChatbotResponse } from './services/geminiService';
import { getAllFiles, addFile } from './utils/db';
import { matelEvKnowledgeBase } from './defaultLibrary';

const languageOptions = {
    'en-US': 'English',
    'hi-IN': 'Hindi (हिन्दी)',
    'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
    'ta-IN': 'Tamil (தமிழ்)',
    'kn-IN': 'Kannada (ಕನ್ನಡ)',
    'gu-IN': 'Gujarati (ગુજરાતી)',
};

type User = {
  name: string;
  email: string;
};

const App: React.FC = () => {
  // --- State Initialization ---
  const [view, setView] = useState<'intro' | 'auth' | 'chat'>('intro');
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = sessionStorage.getItem('app-messages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<{ content: string; fileCount: number } | null>(null);
  const [language, setLanguage] = useState(() => {
    const savedLang = sessionStorage.getItem('app-language');
    return savedLang ? JSON.parse(savedLang) : 'en-US';
  });
  const [isAppLoading, setIsAppLoading] = useState(true);

  const handleFileError = useCallback((errorMessage: string) => {
    console.error(`File Error: ${errorMessage}`);
    const errorBotMessage: ChatMessage = {
      id: `system-error-${Date.now()}`,
      sender: 'bot',
      text: `An error occurred: ${errorMessage}`,
    };
    setMessages(prev => [...prev, errorBotMessage]);
    setView('chat'); // Show error in chat window
  }, []);

  const loadKnowledgeBase = useCallback(async () => {
    try {
        const allDbFiles = await getAllFiles();
        if (allDbFiles.length > 0) {
            const combinedContent = allDbFiles
                .map(f => `--- Content from ${f.name} ---\n${f.content}`)
                .join('\n\n');
            setKnowledgeBase({ content: combinedContent, fileCount: allDbFiles.length });
        } else {
            setKnowledgeBase(null);
        }
    } catch (error) {
        console.error("Failed to load knowledge base from DB:", error);
        handleFileError("Failed to load knowledge base from your library.");
        setKnowledgeBase(null);
    }
  }, [handleFileError]);

  const startChatSession = useCallback(async () => {
    await loadKnowledgeBase(); // Refresh knowledge base from DB

    setMessages(prevMessages => {
        if (prevMessages.length === 0 || prevMessages.every(m => m.id.startsWith('system-'))) {
            const welcomeParts = [];
            welcomeParts.push('Welcome to the Field Service Assistant!');
            welcomeParts.push("I am your assistant, How may I help you?");

            return [{
                id: 'initial-bot-message',
                text: welcomeParts.join(' '),
                sender: 'bot'
            }];
        }
        return prevMessages;
    });
  }, [loadKnowledgeBase]);

  // --- Effect to run on initial application load ---
  useEffect(() => {
    const initializeApp = async () => {
        // 1. Seed database with default file if library is empty
        try {
            const existingFiles = await getAllFiles();
            if (existingFiles.length === 0) {
                console.log("Knowledge base is empty. Seeding with default MATEL EV guide...");
                for (const file of matelEvKnowledgeBase) {
                    await addFile(file);
                }
                console.log("Default knowledge base seeded successfully.");
            }
        } catch (error) {
            console.error("Failed to seed the database:", error);
        }

        // 2. Check for a logged-in user
        const loggedInUserJson = localStorage.getItem('currentUser');
        if (loggedInUserJson) {
            const loggedInUser = JSON.parse(loggedInUserJson);
            setUser(loggedInUser);
            setView('chat');
        } else {
            const savedView = sessionStorage.getItem('app-view');
            if(savedView) {
                const parsedView = JSON.parse(savedView);
                if (parsedView === 'auth') {
                    setView('auth');
                }
            }
        }
        
        setIsAppLoading(false);
    };
    initializeApp();
  }, []);

  // --- Effect to Persist State ---
  useEffect(() => {
    // Only persist view if it's not 'intro' to avoid getting stuck
    if (view !== 'intro') {
        sessionStorage.setItem('app-view', JSON.stringify(view));
    }
    sessionStorage.setItem('app-messages', JSON.stringify(messages));
    sessionStorage.setItem('app-language', JSON.stringify(language));
  }, [view, messages, language]);
  
  // --- Effect to start chat session ---
  useEffect(() => {
    if (view === 'chat' && user) {
        startChatSession();
    }
  }, [view, user, startChatSession]);

  const handleAuthSuccess = (authenticatedUser: User) => {
    localStorage.setItem('currentUser', JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    setView('chat');
  };

  const handleLogout = () => {
      localStorage.removeItem('currentUser');
      sessionStorage.clear();
      setUser(null);
      setMessages([]);
      setKnowledgeBase(null);
      setView('intro');
  }

  const handleSendMessage = useCallback(async (messageText: string, lang: string) => {
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: 'user',
    };

    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      const { text: botResponseText, suggestions } = await getChatbotResponse(messageText, messages, knowledgeBase?.content ?? null, lang);
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
  }, [messages, knowledgeBase]);
  
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

  if (isAppLoading) {
    return (
        <div className="h-screen w-screen flex items-center justify-center text-gray-600">
            <svg className="animate-spin h-8 w-8 mr-3 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Initializing Assistant...
        </div>
    )
  }

  if (view === 'intro') {
    return <IntroPage onStart={() => setView('auth')} />;
  }
  
  if (view === 'auth') {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="h-screen w-screen bg-white flex flex-col font-sans text-gray-900">
      <header className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Service Engineer Assistant</h1>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
                 {user && (
                    <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-700">Welcome, {user.name}</span>
                        <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:underline">Logout</button>
                    </div>
                )}
                <div className="h-6 w-px bg-gray-300"></div>
                {knowledgeBase && knowledgeBase.fileCount > 0 && <span className="max-w-xs truncate" title={`${knowledgeBase.fileCount} files loaded`}>Knowledge Base: {knowledgeBase.fileCount} file(s) loaded</span>}
                <div className="flex items-center gap-2">
                    <label htmlFor="language-select-header" className="text-sm font-medium text-gray-600">Language:</label>
                    <div className="relative">
                        <select
                            id="language-select-header"
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="appearance-none rounded-md border border-gray-300 bg-white py-1 pl-2 pr-7 text-sm text-gray-800 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            aria-label="Select language"
                        >
                            {Object.entries(languageOptions).map(([code, name]) => (
                                <option key={code} value={code}>{name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
            </div>
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
