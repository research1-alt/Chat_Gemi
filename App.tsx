import React, { useState, useCallback, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import IntroPage from './components/IntroPage';
import AuthPage from './components/AuthPage';
import { ChatMessage } from './types';
import { getChatbotResponse } from './services/geminiService';
import { getAllFiles } from './utils/db';
import { matelEvKnowledgeBase } from './defaultLibrary';
import useAuth, { User } from './hooks/useAuth';

const languageOptions = {
    'en-US': 'English',
    'hi-IN': 'Hindi (हिन्दी)',
    'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
    'ta-IN': 'Tamil (தமிழ்)',
    'kn-IN': 'Kannada (ಕನ್ನಡ)',
    'gu-IN': 'Gujarati (ગુજરાતી)',
    'mr-IN': 'Marathi (मराठी)',
    'bn-IN': 'Bengali (বাংলা)',
    'te-IN': 'Telugu (తెలుగు)',
    'ml-IN': 'Malayalam (മലയാളം)',
    'ur-IN': 'Urdu (اردو)',
    'as-IN': 'Assamese (অসমীয়া)',
    'or-IN': 'Odia (ଓଡ଼ିଆ)',
};

type DeviceView = 'desktop' | 'tablet' | 'mobile';

const App: React.FC = () => {
  const { user, view, setView, login, signup, logout, authError, isAuthLoading } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
        const savedMessages = localStorage.getItem('app-messages');
        return savedMessages ? JSON.parse(savedMessages) : [];
    } catch {
        return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<{ content: string; fileCount: number } | null>(null);
  const [language, setLanguage] = useState(() => {
    try {
        const savedLang = localStorage.getItem('app-language');
        return savedLang ? JSON.parse(savedLang) : 'en-US';
    } catch {
        return 'en-US';
    }
  });
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');

  const handleFileError = useCallback((errorMessage: string) => {
    console.error(`File Error: ${errorMessage}`);
    const errorBotMessage: ChatMessage = {
      id: `system-error-${Date.now()}`,
      sender: 'bot',
      text: `An error occurred: ${errorMessage}`,
    };
    setMessages(prev => [...prev, errorBotMessage]);
  }, []);

  const loadKnowledgeBase = useCallback(async () => {
    try {
        const allDbFiles = await getAllFiles();
        const filesToLoad = allDbFiles.length > 0 ? allDbFiles : matelEvKnowledgeBase;

        if (filesToLoad.length > 0) {
            const combinedContent = filesToLoad
                .map(f => `--- Content from ${f.name} ---\n${f.content}`)
                .join('\n\n');
            setKnowledgeBase({ content: combinedContent, fileCount: filesToLoad.length });
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
    await loadKnowledgeBase(); 

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


  useEffect(() => {
    localStorage.setItem('app-messages', JSON.stringify(messages));
    localStorage.setItem('app-language', JSON.stringify(language));
  }, [messages, language]);
  
  useEffect(() => {
    if (view === 'chat' && user) {
        startChatSession();
    }
  }, [view, user, startChatSession]);

  const handleLogout = () => {
      logout();
      setMessages([]);
      setKnowledgeBase(null);
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
      const { text: botResponseText, suggestions, imageUrl } = await getChatbotResponse(messageText, messages, knowledgeBase?.content ?? null, lang);
      const newBotMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: botResponseText,
        sender: 'bot',
        suggestions: suggestions,
        imageUrl: imageUrl ?? undefined,
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

  if (!user) {
    if (view === 'auth') {
        return (
          <AuthPage
            onLogin={login}
            onSignup={signup}
            error={authError}
            isLoading={isAuthLoading}
          />
        );
    }
    return <IntroPage onStart={() => setView('auth')} />;
  }
  
  const getDeviceFrameClasses = () => {
    switch (deviceView) {
        case 'mobile':
            return 'w-[375px] h-[95%] max-w-full max-h-full flex flex-col bg-white shadow-2xl rounded-3xl border-8 border-gray-800 p-1 box-content transition-all duration-300 relative overflow-hidden';
        case 'tablet':
            return 'w-[768px] h-[95%] max-w-full max-h-full flex flex-col bg-white shadow-2xl rounded-3xl border-8 border-gray-800 p-1 box-content transition-all duration-300 relative overflow-hidden';
        default: // desktop
            return 'w-full h-full flex flex-col bg-white shadow-lg rounded-lg overflow-hidden';
    }
  };
  
  const getDeviceNotch = () => {
      if (deviceView === 'desktop') return null;
      return (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 bg-gray-800 rounded-b-xl z-10 ${deviceView === 'mobile' ? 'w-28 h-5' : 'w-36 h-6'}`}></div>
      );
  }

  const DeviceViewSelector = () => (
      <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">View:</span>
          <div className="flex items-center gap-1 p-0.5 bg-gray-200 rounded-md">
              <button 
                  onClick={() => setDeviceView('desktop')} 
                  title="Desktop View" 
                  aria-pressed={deviceView === 'desktop'}
                  className={`p-1.5 rounded-md transition-colors ${deviceView === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
              </button>
              <button 
                  onClick={() => setDeviceView('tablet')} 
                  title="Tablet View" 
                  aria-pressed={deviceView === 'tablet'}
                  className={`p-1.5 rounded-md transition-colors ${deviceView === 'tablet' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
              </button>
              <button 
                  onClick={() => setDeviceView('mobile')} 
                  title="Mobile View" 
                  aria-pressed={deviceView === 'mobile'}
                  className={`p-1.5 rounded-md transition-colors ${deviceView === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75A2.25 2.25 0 0015.75 1.5h-2.25" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 18h3" />
                  </svg>
              </button>
          </div>
      </div>
  );

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col font-sans text-gray-900">
      <header className="p-4 border-b border-gray-200 bg-white flex justify-between items-center flex-shrink-0 z-10">
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
                <div className="h-6 w-px bg-gray-300"></div>

                <DeviceViewSelector />
                
                <div className="h-6 w-px bg-gray-300"></div>
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
      <main className="flex-1 flex flex-col items-center justify-center min-h-0 p-4">
          <div className={getDeviceFrameClasses()}>
              {getDeviceNotch()}
              <ChatWindow 
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  selectedLanguage={language}
                  onSuggestionClick={handleSuggestionClick}
                  onClarificationRequest={handleClarificationRequest}
              />
          </div>
      </main>
    </div>
  );
};

export default App;
